"""
مصادقة طالبي العمل — خاصة بتطبيق seeker_profiles.
يستخدم الهيدر: Authorization: JobSeekerToken <key>
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import JobSeekerAuthToken


class JobSeekerTokenAuthentication(BaseAuthentication):
    keyword = 'JobSeekerToken'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith(f'{self.keyword} '):
            return None

        key = auth_header[len(self.keyword) + 1:].strip()
        if not key:
            raise AuthenticationFailed('Invalid job seeker token.')

        try:
            token = JobSeekerAuthToken.objects.select_related('job_seeker').get(key=key)
        except JobSeekerAuthToken.DoesNotExist:
            raise AuthenticationFailed('Invalid job seeker token.')

        job_seeker = token.job_seeker
        if not job_seeker.is_active:
            raise AuthenticationFailed('Job seeker account is inactive.')

        return (None, job_seeker)

    def authenticate_header(self, request):
        return self.keyword