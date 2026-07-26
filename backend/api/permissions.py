"""
Role-based DRF permission classes for Taste Tracker Tavern
"""
from rest_framework.permissions import BasePermission


class IsAuthenticatedUser(BasePermission):
    """User must be authenticated (any role)."""
    message = 'Authentication required.'

    def has_permission(self, request, view):
        return request.user is not None and hasattr(request.user, 'role')


class IsCustomer(BasePermission):
    """User must have the 'customer' role."""
    message = 'Only customers can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user is not None
            and hasattr(request.user, 'role')
            and request.user.role == 'customer'
        )


class IsOwner(BasePermission):
    """User must have the 'owner' role."""
    message = 'Only restaurant owners can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user is not None
            and hasattr(request.user, 'role')
            and request.user.role == 'owner'
        )


class IsAdmin(BasePermission):
    """User must have the 'admin' role."""
    message = 'Only admins can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user is not None
            and hasattr(request.user, 'role')
            and request.user.role == 'admin'
        )


class IsOwnerOrAdmin(BasePermission):
    """User must be an owner or admin."""
    message = 'Only restaurant owners or admins can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user is not None
            and hasattr(request.user, 'role')
            and request.user.role in ('owner', 'admin')
        )


class IsCustomerOrAdmin(BasePermission):
    """User must be a customer or admin."""
    message = 'Only customers or admins can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user is not None
            and hasattr(request.user, 'role')
            and request.user.role in ('customer', 'admin')
        )
