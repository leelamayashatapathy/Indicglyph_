"""Dataset Item models and schemas."""
import logging
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class DatasetItemStatus(str, Enum):
    """Allowed review statuses for dataset items."""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    FINALIZED = "finalized"


class ReviewState(BaseModel):
    """Review state for a dataset item."""
    status: DatasetItemStatus = Field(default=DatasetItemStatus.PENDING, description="pending|in_review|finalized")
    review_count: int = Field(default=0, ge=0)
    skip_count: int = Field(default=0, ge=0)
    correct_skips: int = Field(default=0, ge=0, description="Skips with 'data is correct' checked")
    unchecked_skips: int = Field(default=0, ge=0, description="Skips without 'data is correct' checked")
    finalized: bool = False
    reviewed_by: List[str] = Field(default_factory=list)
    lock_owner: Optional[str] = None
    lock_time: Optional[str] = None


class DatasetItemCreate(BaseModel):
    """Schema for creating a dataset item."""
    dataset_type_id: str
    language: str
    content: Dict[str, Any]
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)
    modality: Optional[str] = Field(None, description="Dataset modality (auto-populated from dataset_type)")


class DatasetItemResponse(BaseModel):
    """Response schema for dataset item."""
    id: str = Field(alias="_id", serialization_alias="_id")
    item_number: Optional[int] = Field(None, description="Sequential item number per dataset type")
    dataset_type_id: str
    language: str
    modality: str = Field(default="text", description="Dataset modality type")
    content: Dict[str, Any]
    review_state: ReviewState
    meta: Dict[str, Any]
    is_gold: bool = Field(default=False, description="Marked as gold standard")
    flagged: bool = Field(default=False, description="Flagged by reviewers")
    skip_feedback: List[Dict[str, Any]] = Field(default_factory=list, description="Skip feedback from reviewers")
    created_at: Optional[str] = Field(None, description="ISO timestamp when item was created")
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "uuid-here",
                "dataset_type_id": "type-uuid",
                "language": "en",
                "content": {"headline": "Breaking News", "body": "Story..."},
                "review_state": {
                    "status": "pending",
                    "review_count": 0,
                    "skip_count": 0,
                    "finalized": False,
                    "reviewed_by": []
                },
                "meta": {"source": "upload"}
            }
        }
    }


def dataset_item_to_dict(data: dict) -> dict:
    """Convert dataset item to storage dict."""
    review_state = data.get("review_state", {
        "status": DatasetItemStatus.PENDING.value,
        "review_count": 0,
        "skip_count": 0,
        "correct_skips": 0,
        "unchecked_skips": 0,
        "finalized": False,
        "reviewed_by": [],
        "lock_owner": None,
        "lock_time": None
    })

    normalized_status = normalize_dataset_status(review_state.get("status"))
    review_state["status"] = normalized_status.value

    return {
        "_id": data.get("_id") or str(uuid.uuid4()),
        "item_number": data.get("item_number"),
        "dataset_type_id": data["dataset_type_id"],
        "language": data["language"],
        "modality": data.get("modality", "text"),
        "content": data["content"],
        "review_state": review_state,
        "meta": data.get("meta", {}),
        "is_gold": data.get("is_gold", False),
        "flagged": data.get("flagged", False),
        "skip_feedback": data.get("skip_feedback", []),
        "created_at": data.get("created_at") or datetime.utcnow().isoformat()
    }


def normalize_dataset_status(status: Optional[str]) -> DatasetItemStatus:
    """Map legacy/unknown statuses to an allowed DatasetItemStatus."""
    if isinstance(status, DatasetItemStatus):
        return status
    if status is None:
        return DatasetItemStatus.PENDING
    try:
        return DatasetItemStatus(status)
    except Exception:
        logger.warning("Encountered unknown dataset item status '%s'; defaulting to pending", status)
        return DatasetItemStatus.PENDING


ALLOWED_DATASET_STATUS_TRANSITIONS = {
    DatasetItemStatus.PENDING: {DatasetItemStatus.PENDING, DatasetItemStatus.IN_REVIEW, DatasetItemStatus.FINALIZED},
    DatasetItemStatus.IN_REVIEW: {DatasetItemStatus.IN_REVIEW, DatasetItemStatus.PENDING, DatasetItemStatus.FINALIZED},
    DatasetItemStatus.FINALIZED: {DatasetItemStatus.FINALIZED},
}


def validate_dataset_status_transition(current_status: Optional[str], new_status: str) -> DatasetItemStatus:
    """
    Validate dataset item status transitions.

    Returns the normalized new status or raises ValueError if invalid.
    """
    current = normalize_dataset_status(current_status)
    desired = normalize_dataset_status(new_status)

    if desired not in ALLOWED_DATASET_STATUS_TRANSITIONS[current]:
        raise ValueError(f"Invalid dataset item status transition {current.value} -> {desired.value}")

    return desired
