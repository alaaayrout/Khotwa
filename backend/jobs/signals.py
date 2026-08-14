from django.db.models.signals import pre_save
from django.dispatch import receiver
import numpy as np
from .models import JobPosting


def _build_job_embedding_text(job):
    from recommendations.services import EmbeddingService  # تجنّب circular import

    is_remote = job.work_mode == "remote"
    location_text = "" if is_remote else job.city

    def build_block(header, items):
        content = "\n".join(filter(None, items))
        return [header, content] if content else []

    parts = [
        job.title,
        getattr(job.specialization, "name_en", "") or "",
        getattr(job.specialization, "name_ar", "") or "",
        job.description,
    ]
    parts += build_block("Skills", job.required_skills or [])
    parts += [location_text, job.employment_type, job.work_mode]

    return "\n".join(filter(None, parts))


@receiver(pre_save, sender=JobPosting)
def compute_job_embedding(sender, instance, **kwargs):
    from recommendations.services import EmbeddingService

    service = EmbeddingService()

    text = _build_job_embedding_text(instance)
    vector = service.encode(text)
    instance.embedding = service.serialize_vector(vector)

    skills_text = "\n".join(instance.required_skills or [])

    if skills_text.strip():
        skills_vector = service.encode(skills_text)
        instance.skills_embedding = service.serialize_vector(skills_vector)
    else:
        instance.skills_embedding = None