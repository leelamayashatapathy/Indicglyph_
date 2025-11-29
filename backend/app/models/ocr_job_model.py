"""OCR Job models for file upload and processing."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class OcrJobStatus(str, Enum):
    """OCR job status enumeration."""
    PENDING = "pending"  # queued but not yet started
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


ALLOWED_OCR_STATUS_TRANSITIONS = {
    OcrJobStatus.PENDING: {OcrJobStatus.PENDING, OcrJobStatus.PROCESSING, OcrJobStatus.CANCELLED},
    OcrJobStatus.PROCESSING: {OcrJobStatus.PROCESSING, OcrJobStatus.COMPLETED, OcrJobStatus.FAILED},
    OcrJobStatus.COMPLETED: {OcrJobStatus.COMPLETED},
    OcrJobStatus.FAILED: {OcrJobStatus.FAILED, OcrJobStatus.PENDING},
    OcrJobStatus.CANCELLED: {OcrJobStatus.CANCELLED, OcrJobStatus.PENDING},
}


class OcrBlock(BaseModel):
    """Individual OCR text block."""
    text: str
    confidence: float = 0.0
    bbox: Optional[Dict[str, float]] = None
    page_index: int = 0


class OcrResult(BaseModel):
    """OCR result for a single page or section."""
    id: str = Field(default_factory=lambda: f"result_{datetime.utcnow().timestamp()}")
    job_id: str
    page_index: int = 0
    full_text: str = ""
    confidence: float = 0.0
    blocks: List[OcrBlock] = []
    metadata: Dict[str, Any] = {}

    def to_dict(self) -> dict:
        """Convert to dictionary for DB storage."""
        return {
            "_id": self.id,
            "job_id": self.job_id,
            "page_index": self.page_index,
            "full_text": self.full_text,
            "confidence": self.confidence,
            "blocks": [
                {
                    "text": block.text,
                    "confidence": block.confidence,
                    "bbox": block.bbox,
                    "page_index": block.page_index
                }
                for block in self.blocks
            ],
            "metadata": self.metadata
        }


class OcrJob(BaseModel):
    """OCR job model."""
    id: str = Field(default_factory=lambda: f"job_{datetime.utcnow().timestamp()}", alias="_id")
    uploader_id: str
    status: OcrJobStatus = OcrJobStatus.PENDING
    source_file_path: str
    source_filename: str
    file_type: str
    page_count: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    language: Optional[str] = None
    results_ref: List[str] = []
    
    class Config:
        populate_by_name = True
        use_enum_values = True

    def to_dict(self) -> dict:
        """Convert to dictionary for DB storage."""
        data = {
            "_id": self.id,
            "uploader_id": self.uploader_id,
            "status": self.status,
            "source_file_path": self.source_file_path,
            "source_filename": self.source_filename,
            "file_type": self.file_type,
            "page_count": self.page_count,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error": self.error,
            "language": self.language,
            "results_ref": self.results_ref
        }
        return data


class OcrJobResponse(BaseModel):
    """Response model for OCR job."""
    id: str
    uploader_id: str
    status: str
    original_filename: str
    file_type: str
    total_pages: int
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    
    class Config:
        populate_by_name = True


class OcrJobDetailResponse(OcrJobResponse):
    """Detailed response including results."""
    results: List[OcrResult] = []


class OcrSliceRequest(BaseModel):
    """Request to slice OCR results into dataset items."""
    dataset_type_id: str
    slices: List[Dict[str, Any]]


class BulkUploadRequest(BaseModel):
    """Request for bulk dataset item upload."""
    dataset_type_id: str
    items: List[Dict[str, Any]]


def ocr_job_from_dict(data: dict) -> OcrJob:
    """Convert dictionary to OcrJob."""
    data_copy = data.copy()
    if "created_at" in data_copy and isinstance(data_copy["created_at"], str):
        data_copy["created_at"] = datetime.fromisoformat(data_copy["created_at"])
    if "started_at" in data_copy and data_copy.get("started_at") and isinstance(data_copy["started_at"], str):
        data_copy["started_at"] = datetime.fromisoformat(data_copy["started_at"])
    if "completed_at" in data_copy and data_copy["completed_at"] and isinstance(data_copy["completed_at"], str):
        data_copy["completed_at"] = datetime.fromisoformat(data_copy["completed_at"])
    return OcrJob(**data_copy)


def ocr_result_from_dict(data: dict) -> OcrResult:
    """Convert dictionary to OcrResult."""
    data_copy = data.copy()
    if "blocks" in data_copy:
        data_copy["blocks"] = [OcrBlock(**block) for block in data_copy["blocks"]]
    return OcrResult(**data_copy)


def validate_ocr_job_status_transition(current_status: str, new_status: str) -> OcrJobStatus:
    """Ensure OCR job status transitions follow allowed paths."""
    try:
        current = OcrJobStatus(current_status)
    except Exception:
        current = OcrJobStatus.PENDING

    new = OcrJobStatus(new_status)

    if new not in ALLOWED_OCR_STATUS_TRANSITIONS[current]:
        raise ValueError(f"Invalid OCR job status transition {current.value} -> {new.value}")

    return new
