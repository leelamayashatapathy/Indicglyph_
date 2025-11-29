"""Authentication routes."""
from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import Optional
from datetime import timedelta

from backend.app.models.user_model import UserCreate, UserLogin, UserResponse, User, AuthResponse, ChangePasswordRequest
from backend.app.auth.password_utils import hash_password, verify_password
from backend.app.auth.jwt_handler import create_access_token, get_token_data
from backend.app.db_adapter import users_db
from backend.app.config import config

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Get current user from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = authorization.replace("Bearer ", "")
    token_data = get_token_data(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return token_data


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user."""
    # Check if user exists
    if await users_db.exists(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create user (always default to "user" role for security)
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        roles=["user"],  # Server-controlled, never from client
        languages=user_data.languages or []
    )
    
    # Save user
    await users_db.set(user.username, user.to_dict())
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "roles": user.roles},
        expires_delta=timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.to_dict())
    }


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login and get JWT token. Supports username or email."""
    # Try to get user by username first
    user_data = await users_db.get(credentials.username)
    
    # If not found by username, try to find by email
    if not user_data:
        all_users = await users_db.get_all()
        for username, user in all_users.items():
            if user.get("email") == credentials.username:
                user_data = user
                break
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    user = User.from_dict(user_data)
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create token
    access_token = create_access_token(
        data={"sub": user.username, "roles": user.roles},
        expires_delta=timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.to_dict())
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    user_data = await users_db.get(current_user["username"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Ensure roles and languages are lists (not ObservedList or other types)
    if "roles" in user_data and user_data["roles"] is not None:
        user_data["roles"] = list(user_data["roles"]) if not isinstance(user_data["roles"], list) else user_data["roles"]
    if "languages" in user_data and user_data["languages"] is not None:
        user_data["languages"] = list(user_data["languages"]) if not isinstance(user_data["languages"], list) else user_data["languages"]
    
    return UserResponse(**user_data)


@router.post("/logout")
def logout():
    """Logout (client should delete token)."""
    return {"message": "Logged out successfully"}


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Change user password."""
    # Get user
    user_data = await users_db.get(current_user["username"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = User.from_dict(user_data)
    
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    user.hashed_password = hash_password(password_data.new_password)
    
    # Save
    await users_db.set(user.username, user.to_dict())
    
    return {"message": "Password changed successfully"}
