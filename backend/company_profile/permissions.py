from rest_framework.permissions import BasePermission
from users.models import Company


class IsCompanyAuthenticated(BasePermission):
    message = 'Authentication as a company is required.'

    def has_permission(self, request, view):

        if not request.auth:
            return False

        return isinstance(
            request.auth.company,
            Company
        )