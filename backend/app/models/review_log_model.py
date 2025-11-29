"""Review Log models and schemas."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class ReviewSubmit(BaseModel):
    """Schema for submitting a review."""
    item_id: str
    action: str = Field(..., description="approve|edit|skip")
    changes: Optional[Dict[str, Any]] = None  # For edit action
    skip_data_correct: bool = Field(default=False, description="Skip with 'data is correct' checked")
    skip_feedback: Optional[str] = Field(default=None, description="Optional feedback for skip")
    
    class Config:
        json_schema_extra = {
            "example": {
                "item_id": "item-uuid",
                "action": "edit",
                "changes": {"headline": "Corrected Headline"}
            }
        }


class ReviewLogResponse(BaseModel):
    """Response schema for review log."""
    _id: str
    reviewer_id: str
    dataset_item_id: str
    action: str
    changes: Optional[Dict[str, Any]]
    timestamp: str
    payout_amount: float


def review_log_to_dict(data: dict) -> dict:
    """Convert review log to storage dict."""
    return {
        "_id": data.get("_id") or str(uuid.uuid4()),
        "reviewer_id": data["reviewer_id"],
        "dataset_item_id": data["dataset_item_id"],
        "action": data["action"],
        "changes": data.get("changes", {}),
        "timestamp": data.get("timestamp") or datetime.utcnow().isoformat(),
        "payout_amount": data.get("payout_amount", 0.0),
        "skip_data_correct": data.get("skip_data_correct"),
        "skip_feedback": data.get("skip_feedback")
    }
