from rest_framework import permissions


class IsPlatformOperator(permissions.BasePermission):
    """Permission check for platform_operator or super_operator roles."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_roles = request.user.roles or []
        return any(role in ['platform_operator', 'super_operator'] for role in user_roles)

