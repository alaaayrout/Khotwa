"""
مصادقة الشركات — خاصة بتطبيق jobs فقط.
يستخدم الهيدر: Authorization: CompanyToken <key>
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from users.models import Company
from .models import CompanyAuthToken


class CompanyTokenAuthentication(BaseAuthentication):
    keyword = 'CompanyToken'

    def authenticate(self, request):

        
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith(f'{self.keyword} '):
            return None

        key = auth_header[len(self.keyword) + 1:].strip()
        if not key:
            raise AuthenticationFailed('Invalid company token.')

        try:
            token = CompanyAuthToken.objects.select_related('company').get(key=key)
        except CompanyAuthToken.DoesNotExist:
            raise AuthenticationFailed('Invalid company token.')

        company = token.company
        if not company.is_active:
            raise AuthenticationFailed('Company account is inactive.')

        if company.approval_status != 'approved':
            raise AuthenticationFailed('Company account is not approved.')

        return (None, company)

    def authenticate_header(self, request):
        return self.keyword
