from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import AdminAuthToken


class AdminTokenAuthentication(BaseAuthentication):
    keyword = "Token"

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        key = parts[1]
        try:
            token = AdminAuthToken.objects.select_related("admin").get(key=key)
        except AdminAuthToken.DoesNotExist:
            raise AuthenticationFailed("توكن الأدمن غير صالح")

        if not token.admin.is_active:
            raise AuthenticationFailed("حساب الأدمن معطّل")

        return (token.admin, token)

    def authenticate_header(self, request):
        return self.keyword
