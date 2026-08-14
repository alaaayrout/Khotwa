
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from jobs.models import JobPosting
from seeker_profiles.authentication import JobSeekerTokenAuthentication
from seeker_profiles.permissions import IsJobSeekerAuthenticated
from .services import EmbeddingService
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
    ranked = []
    for job in jobs:
        job_vector = embedding_service.deserialize_vector(job.embedding)
        if job_vector.size == 0:
            continue

        if job.work_mode == "remote":
            seeker_vector = seeker_vector_without_location
        else:
            seeker_vector = seeker_vector_with_location
  

        similarity = embedding_service.cosine_similarity(seeker_vector, job_vector)
        ranked.append({
            'id': job.id,
            'title': job.title,
            'company_name': job.company.company_name,
            'company_logo': get_company_logo(job.company, request),
            'similarity_score': round(float(similarity), 4),
            'city': job.city,
            'employment_type': job.employment_type,
            'work_mode': job.work_mode,
            'status': job.status,
        })

    ranked.sort(key=lambda item: item['similarity_score'], reverse=True)
    return Response(ranked, status=status.HTTP_200_OK)