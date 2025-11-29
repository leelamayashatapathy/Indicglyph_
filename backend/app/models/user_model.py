"""User model and schemas."""
import logging
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class UserCreate(BaseModel):
    """Schema for creating a user."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    languages: Optional[List[str]] = []


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response."""
    _id: str
    username: str
    email: str
    roles: List[str]
    languages: List[str]
    is_active: bool
    created_at: str
    payout_balance: float = 0.0
    reviews_done: int = 0


class UserUpdate(BaseModel):
    """Schema for updating user."""
    email: Optional[EmailStr] = None
    roles: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=6)


class AuthResponse(BaseModel):
    """Schema for authentication response with JWT token."""
    access_token: str
    token_type: str
    user: UserResponse


class User:
    """User domain model."""
    
    def __init__(
        self,
        username: str,
        email: str,
        hashed_password: str,
        roles: Optional[List[str]] = None,
        languages: Optional[List[str]] = None,
        is_active: bool = True,
        created_at: Optional[str] = None,
        _id: Optional[str] = None,
        payout_balance: float = 0.0,
        reviews_done: int = 0
    ):
        self._id = _id or username
        self.username = username
        self.email = email
        self.hashed_password = hashed_password
        self.roles = roles or ["user"]
        self.languages = languages or []
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow().isoformat()
        self.payout_balance = payout_balance
        self.reviews_done = reviews_done

        # Guard against legacy/invalid payout fields sneaking in
        self._validate_payout_fields()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for storage."""
        return {
            "_id": self._id,
            "username": self.username,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "roles": self.roles,
            "languages": self.languages,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "payout_balance": self.payout_balance,
            "reviews_done": self.reviews_done
        }

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Create from dictionary."""
        normalized = cls.normalize_payout_fields(data)
        # Convert list-like objects to plain Python list
        if "roles" in normalized and normalized["roles"] is not None:
            normalized["roles"] = list(normalized["roles"])
        if "languages" in normalized and normalized["languages"] is not None:
            normalized["languages"] = list(normalized["languages"])
        return cls(**normalized)

    @staticmethod
    def normalize_payout_fields(data: dict) -> dict:
        """
        Normalize legacy payout fields.

        - Fold legacy `balance` into `payout_balance`
        - Log unexpected payout-related fields
        """
        normalized = dict(data)
        payout_balance = normalized.get("payout_balance", 0.0) or 0.0

        if "balance" in normalized:
            try:
                payout_balance += float(normalized.get("balance") or 0.0)
            except (TypeError, ValueError):
                logger.warning("Legacy balance field present but non-numeric; ignoring")
            logger.warning("Found legacy `balance` field on user %s; consolidating into payout_balance", normalized.get("username"))
            normalized.pop("balance", None)

        unexpected_fields = [k for k in normalized.keys() if k.startswith("payout_") and k != "payout_balance"]
        if unexpected_fields:
            logger.warning("Unexpected payout fields on user %s: %s", normalized.get("username"), unexpected_fields)

        normalized["payout_balance"] = payout_balance
        return normalized

    def _validate_payout_fields(self) -> None:
        """Ensure payout_balance is present and no legacy fields remain."""
        if getattr(self, "payout_balance", None) is None:
            self.payout_balance = 0.0
