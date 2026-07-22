"""
صلاحيات تطبيق seeker_profiles.
"""

from rest_framework.permissions import BasePermission

from users.models import JobSeeker


class IsJobSeekerAuthenticated(BasePermission):
    """يسمح فقط لطالبي العمل الموثقين بالوصول."""

    message = 'Authentication as a job seeker is required.'

    def has_permission(self, request, view):
        return isinstance(request.auth, JobSeeker)