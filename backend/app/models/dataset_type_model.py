"""Dataset Type models and schemas."""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from datetime import datetime
import uuid


class FieldSchema(BaseModel):
    """Schema for a single field in a dataset type."""
    key: str = Field(..., description="Field key/name")
    type: str = Field(..., description="Field type: text, textarea, number, select, checkbox")
    label: str = Field(..., description="Display label")
    required: Optional[bool] = False
    options: Optional[List[str]] = None  # For select fields
    placeholder: Optional[str] = None
    review_widget: Optional[str] = Field(
        None, 
        description="Custom review widget: text_input, textarea, audio_player, image_viewer, ocr_editor, video_player"
    )


class DatasetTypeCreate(BaseModel):
    """Schema for creating a dataset type."""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    modality: Literal["ocr", "voice", "text", "conversation", "image", "video", "custom"] = Field(
        ..., 
        description="Dataset modality type"
    )
    fields: List[FieldSchema]
    languages: List[str] = Field(default=["en"])
    payout_rate: float = Field(default=0.002, ge=0)
    review_guidelines: Optional[str] = None


class DatasetTypeUpdate(BaseModel):
    """Schema for updating a dataset type."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    modality: Optional[Literal["ocr", "voice", "text", "conversation", "image", "video", "custom"]] = None
    fields: Optional[List[FieldSchema]] = None
    languages: Optional[List[str]] = None
    payout_rate: Optional[float] = Field(None, ge=0)
    active: Optional[bool] = None
    review_guidelines: Optional[str] = None


class DatasetTypeResponse(BaseModel):
    """Response schema for dataset type."""
    id: str = Field(alias="_id", serialization_alias="_id")
    name: str
    description: Optional[str]
    modality: str = Field(default="text", description="Dataset modality type")
    fields: List[FieldSchema]
    languages: List[str]
    payout_rate: float
    active: bool
    created_at: str
    review_guidelines: Optional[str] = None
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "uuid-here",
                "name": "newspaper",
                "description": "Newspaper article review",
                "fields": [
                    {"key": "headline", "type": "text", "label": "Headline", "required": True},
                    {"key": "body", "type": "textarea", "label": "Article Body"}
                ],
                "languages": ["en", "hi"],
                "payout_rate": 0.003,
                "active": True,
                "created_at": "2025-10-23T10:00:00"
            }
        }
    }


def dataset_type_to_dict(data: dict) -> dict:
    """Convert dataset type to storage dict."""
    return {
        "_id": data.get("_id") or str(uuid.uuid4()),
        "name": data["name"],
        "description": data.get("description"),
        "modality": data.get("modality", "text"),
        "fields": data["fields"],
        "languages": data.get("languages", ["en"]),
        "payout_rate": data.get("payout_rate", 0.002),
        "active": data.get("active", True),
        "created_at": data.get("created_at") or datetime.utcnow().isoformat(),
        "review_guidelines": data.get("review_guidelines")
    }
