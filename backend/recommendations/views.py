
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from jobs.models import JobPosting
from seeker_profiles.authentication import JobSeekerTokenAuthentication
from seeker_profiles.permissions import IsJobSeekerAuthenticated
from .services import EmbeddingService
import numpy as np
def get_company_logo(company, request):
    profile = getattr(company, 'profile', None)
    if profile is None:
           return None
    if profile.profile_picture:
           return request.build_absolute_uri(profile.profile_picture.url)
    if profile.external_picture_url:
           return profile.external_picture_url
    return None
def build_block(header, items):
    content = "\n".join(filter(None, items))
    return [header, content] if content else []

@api_view(['GET'])
@authentication_classes([JobSeekerTokenAuthentication])
@permission_classes([IsJobSeekerAuthenticated])
def recommended_jobs_for_seeker(request):
    seeker = request.auth
    seeker_profile = getattr(seeker, 'seeker_profile', None)

    if seeker_profile is None:
        return Response({'detail': 'Seeker profile not found.'}, status=status.HTTP_404_NOT_FOUND)


    embedding_service = EmbeddingService()

    seeker_parts = [seeker_profile.bio]
    seeker_parts += build_block("Skills", [s.name for s in seeker_profile.skills.all()])
    seeker_parts += build_block("Education", [f"{e.degree} {e.institution}" for e in seeker_profile.education_entries.all()])

    seeker_text = "\n".join(filter(None, seeker_parts))
    seeker_text_with_location = "\n".join(
    filter(None, seeker_parts + [seeker_profile.governorate])
)
    seeker_vector_without_location = embedding_service.encode(seeker_text)
    seeker_vector_with_location = embedding_service.encode(seeker_text_with_location)
    jobs = (
        JobPosting.objects.filter(status='open', is_active=True, expires_at__gte=timezone.localdate())
        .select_related('company','company__profile','specialization')
        .prefetch_related('job_applications')
    )
    jobs = list(jobs)

    if not jobs:
        return Response([], status=status.HTTP_200_OK)
    seeker_skill_names = [
    skill.name
    for skill in seeker_profile.skills.all()
]
    seeker_skill_text = "\n".join(seeker_skill_names) if seeker_skill_names else ""
    seeker_skills_vector = (
        embedding_service.encode(seeker_skill_text)
        if seeker_skill_text.strip()
        else np.array([])
)
    ranked = []
    SKILLS_WEIGHT = 0.6
    GENERAL_WEIGHT = 0.4

    for job in jobs:
        job_vector = embedding_service.deserialize_vector(job.embedding)
        if job_vector.size == 0:
            continue

        seeker_vector = seeker_vector_without_location if job.work_mode == "remote" else seeker_vector_with_location
        general_similarity = embedding_service.cosine_similarity(seeker_vector, job_vector)

        job_skills_vector = embedding_service.deserialize_vector(job.skills_embedding)
        if job_skills_vector.size > 0 and seeker_skills_vector.size > 0:
            skills_similarity = embedding_service.cosine_similarity(seeker_skills_vector, job_skills_vector)
        else:
            skills_similarity = general_similarity  # fallback إذا ما في مهارات مسجّلة

        final_score = (SKILLS_WEIGHT * skills_similarity) + (GENERAL_WEIGHT * general_similarity)

        ranked.append({
            'id': job.id,
            'title': job.title,
            'company_name': job.company.company_name,
            'company_logo': get_company_logo(job.company, request),
            'similarity_score': round(float(final_score), 4),
            'city': job.city,
            'description': job.description,
            'required_skills': job.required_skills,
            'employment_type': job.employment_type,
            'work_mode': job.work_mode,
            'status': job.status,
        })

    ranked.sort(key=lambda item: item['similarity_score'], reverse=True)
    return Response(ranked, status=status.HTTP_200_OK)