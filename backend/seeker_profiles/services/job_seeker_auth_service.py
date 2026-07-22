"""
إصدار رمز مصادقة طالب العمل — يُستدعى من login_user في users.
"""

from ..models import JobSeekerAuthToken


def get_or_create_job_seeker_token(job_seeker):
    """إرجاع رمز مصادقة لطالب العمل (إنشاء واحد جديد إن لم يوجد)."""
    token, _ = JobSeekerAuthToken.objects.get_or_create(job_seeker=job_seeker)
    return token.key