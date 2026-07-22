from rest_framework.permissions import BasePermission

from .models import AdminUser


class IsAdminUser(BasePermission):

    message = "هذا الإجراء متاح فقط للأدمن."

    def has_permission(self, request, view):
        return bool(
            request.user
            and isinstance(request.user, AdminUser)
            and request.user.is_active
        )
