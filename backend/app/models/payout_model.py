"""Payout model and schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PayoutStatus(str, Enum):
    """Payout status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PayoutRequest(BaseModel):
    """Schema for requesting a payout."""
    amount: float = Field(..., gt=0)
    payment_method: Optional[str] = "bank_transfer"
    payment_details: Optional[dict] = None


class PayoutResponse(BaseModel):
    """Schema for payout response."""
    payout_id: str
    username: str
    amount: float
    status: str
    payment_method: str
    requested_at: str
    processed_at: Optional[str]
    notes: Optional[str]


class Payout:
    """Payout domain model."""
    
    def __init__(
        self,
        username: str,
        amount: float,
        payout_id: Optional[str] = None,
        status: str = PayoutStatus.PENDING.value,
        payment_method: str = "bank_transfer",
        payment_details: Optional[dict] = None,
        requested_at: Optional[str] = None,
        processed_at: Optional[str] = None,
        notes: Optional[str] = None
    ):
        self.payout_id = payout_id or f"payout_{int(datetime.utcnow().timestamp() * 1000)}"
        self.username = username
        self.amount = amount
        self.status = status
        self.payment_method = payment_method
        self.payment_details = payment_details or {}
        self.requested_at = requested_at or datetime.utcnow().isoformat()
        self.processed_at = processed_at
        self.notes = notes
    
    def to_dict(self) -> dict:
        """Convert to dictionary for storage."""
        return {
            "payout_id": self.payout_id,
            "username": self.username,
            "amount": self.amount,
            "status": self.status,
            "payment_method": self.payment_method,
            "payment_details": self.payment_details,
            "requested_at": self.requested_at,
            "processed_at": self.processed_at,
            "notes": self.notes
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Payout":
        """Create from dictionary."""
        return cls(**data)
