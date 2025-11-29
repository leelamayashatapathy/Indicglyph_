"""Role-based access control utilities."""
from typing import List
from fastapi import HTTPException, status


def require_roles(allowed_roles: List[str]):
    """
    Dependency to enforce role requirement.
    User must have at least one of the allowed roles.
    
    Args:
        allowed_roles: List of allowed role strings (e.g., ["platform_operator", "super_operator"])
    
    Returns:
        Dependency function that validates user roles
    """
    def role_dependency(user_data: dict) -> dict:
        user_roles = user_data.get("roles", [])
        
        # Check if user has any of the required roles
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
            )
        
        return user_data
    
    return role_dependency


def require_operator(user_data: dict) -> dict:
    """Dependency to require platform_operator or super_operator role."""
    user_roles = user_data.get("roles", [])
    if not any(role in ["platform_operator", "super_operator"] for role in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform operator access required"
        )
    return user_data


def require_reviewer(user_data: dict) -> dict:
    """Dependency to require reviewer, platform_operator, or super_operator role."""
    user_roles = user_data.get("roles", [])
    if not any(role in ["reviewer", "platform_operator", "super_operator"] for role in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reviewer access required"
        )
    return user_data
