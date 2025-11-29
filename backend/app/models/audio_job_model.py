"""Audio transcription job models."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AudioJobStatus(str, Enum):
    """Audio job status enumeration."""
    PENDING = "pending"
    TRANSCRIBING = "transcribing"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING_FOR_MANUAL_TRANSCRIPT = "waiting_for_manual_transcript"
    CANCELLED = "cancelled"


ALLOWED_AUDIO_STATUS_TRANSITIONS = {
    AudioJobStatus.PENDING: {AudioJobStatus.PENDING, AudioJobStatus.TRANSCRIBING, AudioJobStatus.CANCELLED},
    AudioJobStatus.TRANSCRIBING: {
        AudioJobStatus.TRANSCRIBING,
        AudioJobStatus.COMPLETED,
        AudioJobStatus.FAILED,
        AudioJobStatus.WAITING_FOR_MANUAL_TRANSCRIPT,
    },
    AudioJobStatus.WAITING_FOR_MANUAL_TRANSCRIPT: {
        AudioJobStatus.WAITING_FOR_MANUAL_TRANSCRIPT,
        AudioJobStatus.COMPLETED,
        AudioJobStatus.FAILED,
    },
    AudioJobStatus.COMPLETED: {AudioJobStatus.COMPLETED},
    AudioJobStatus.FAILED: {AudioJobStatus.FAILED, AudioJobStatus.PENDING},
    AudioJobStatus.CANCELLED: {AudioJobStatus.CANCELLED, AudioJobStatus.PENDING},
}


class AudioTranscript(BaseModel):
    """Transcript for audio file."""
    id: str = Field(default_factory=lambda: f"transcript_{datetime.utcnow().timestamp()}")
    job_id: str
    text: str = ""
    language: str = "en"
    duration: float = 0.0
    confidence: float = 0.0
    segments: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}

    def to_dict(self) -> dict:
        """Convert to dictionary for DB storage."""
        return {
            "_id": self.id,
            "job_id": self.job_id,
            "text": self.text,
            "language": self.language,
            "duration": self.duration,
            "confidence": self.confidence,
            "segments": self.segments,
            "metadata": self.metadata
        }


class AudioJob(BaseModel):
    """Audio transcription job model."""
    id: str = Field(default_factory=lambda: f"job_{datetime.utcnow().timestamp()}", alias="_id")
    uploader_id: str
    status: AudioJobStatus = AudioJobStatus.PENDING
    source_file_path: str
    source_filename: str
    file_type: str
    duration: float = 0.0
    language: Optional[str] = "en"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    transcript_ref: Optional[str] = None
    
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
            "duration": self.duration,
            "language": self.language,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error": self.error,
            "transcript_ref": self.transcript_ref
        }
        return data


class AudioJobResponse(BaseModel):
    """Response model for audio job."""
    id: str
    uploader_id: str
    status: str
    original_filename: str
    file_type: str
    duration: float
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    
    class Config:
        populate_by_name = True


class AudioJobDetailResponse(AudioJobResponse):
    """Detailed response including transcript."""
    transcript: Optional[AudioTranscript] = None


class AudioSliceRequest(BaseModel):
    """Request to slice audio transcripts into dataset items."""
    dataset_type_id: str
    language: str = "en"


def audio_job_from_dict(data: dict) -> AudioJob:
    """Convert dictionary to AudioJob."""
    data_copy = data.copy()
    if "created_at" in data_copy and isinstance(data_copy["created_at"], str):
        data_copy["created_at"] = datetime.fromisoformat(data_copy["created_at"])
    if "completed_at" in data_copy and data_copy["completed_at"] and isinstance(data_copy["completed_at"], str):
        data_copy["completed_at"] = datetime.fromisoformat(data_copy["completed_at"])
    if "started_at" in data_copy and data_copy.get("started_at") and isinstance(data_copy["started_at"], str):
        data_copy["started_at"] = datetime.fromisoformat(data_copy["started_at"])
    return AudioJob(**data_copy)


def audio_transcript_from_dict(data: dict) -> AudioTranscript:
    """Convert dictionary to AudioTranscript."""
    return AudioTranscript(**data)


def validate_audio_job_status_transition(current_status: str, new_status: str) -> AudioJobStatus:
    """Ensure audio job status transitions are valid."""
    try:
        current = AudioJobStatus(current_status)
    except Exception:
        current = AudioJobStatus.PENDING

    new = AudioJobStatus(new_status)

    if new not in ALLOWED_AUDIO_STATUS_TRANSITIONS[current]:
        raise ValueError(f"Invalid audio job status transition {current.value} -> {new.value}")

    return new
