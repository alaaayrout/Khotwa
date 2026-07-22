"""
صلاحيات تطبيق jobs — منفصلة عن users.
"""

from rest_framework.permissions import BasePermission

from users.models import Company


class IsApprovedCompany(BasePermission):
    """يسمح فقط للشركات المعتمدة بالوصول."""

    message = 'Only approved companies can perform this action.'

    def has_permission(self, request, view):
        company = request.auth
        return (
            isinstance(company, Company)
            and company.approval_status == 'approved'
            and company.is_active
        )
