from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """Allow access only to authenticated staff (admin) users."""

    message = "Staff access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)
