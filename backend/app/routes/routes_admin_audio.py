"""Platform operator routes for audio transcription."""
import logging
import asyncio
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query
from typing import List
from datetime import datetime
from pathlib import Path

from backend.app.models.audio_job_model import (
    AudioJob,
    AudioJobResponse,
    AudioJobDetailResponse,
    AudioSliceRequest,
    audio_job_from_dict,
    audio_transcript_from_dict,
    AudioJobStatus,
    validate_audio_job_status_transition,
)
from backend.app.models.dataset_item_model import dataset_item_to_dict
from backend.app.db_adapter import db_adapter
from backend.app.routes.routes_auth import get_current_user
from backend.app.routes.routes_operator import get_operator_user
from backend.app.utils.file_storage import FileStorageManager
from backend.app.services.asr_service import ASRService
from backend.app.config import config

router = APIRouter(prefix="/operator/audio", tags=["operator-audio"])

file_storage = FileStorageManager(base_path="backend/uploads/audio")
asr_service = ASRService()
logger = logging.getLogger(__name__)


async def run_audio_job_worker(job_id: str, language: str = "en") -> bool:
    """
    Worker entrypoint to process a queued audio job.
    Not invoked from HTTP handlers; wire into a worker process.
    """
    job_data = await db_adapter.get("audio_jobs", job_id)
    if not job_data:
        logger.error("Audio job %s not found", job_id)
        return False

    job = audio_job_from_dict(job_data)
    try:
        job.status = validate_audio_job_status_transition(job.status, AudioJobStatus.TRANSCRIBING.value)
    except ValueError as exc:
        logger.error("Audio job %s cannot start: %s", job_id, exc)
        return False

    job.started_at = datetime.utcnow()
    job.error = None
    job.language = language or job.language or "en"
    await db_adapter.update("audio_jobs", job_id, job.to_dict())
    logger.info("Audio job started", extra={"job_id": job_id, "uploader": job.uploader_id})

    try:
        loop = asyncio.get_running_loop()
        transcript = await loop.run_in_executor(
            None,
            asr_service.transcribe,
            job.source_file_path,
            job_id,
            job.language,
        )

        async with db_adapter.transaction() as session:
            await db_adapter.insert_document(session, "audio_transcripts", transcript.to_dict())
            job.transcript_ref = transcript.id
            job.duration = transcript.duration

            if asr_service.provider == "none":
                job.status = validate_audio_job_status_transition(
                    job.status, AudioJobStatus.WAITING_FOR_MANUAL_TRANSCRIPT.value
                )
            else:
                job.status = validate_audio_job_status_transition(job.status, AudioJobStatus.COMPLETED.value)
                job.completed_at = datetime.utcnow()

            await db_adapter.upsert_document(session, "audio_jobs", job.to_dict())

        logger.info("Audio job completed", extra={"job_id": job_id, "duration": transcript.duration})
        return True
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Audio job %s failed: %s", job_id, exc)
        failed = await db_adapter.get("audio_jobs", job_id)
        if failed:
            job_failed = audio_job_from_dict(failed)
            try:
                job_failed.status = validate_audio_job_status_transition(job_failed.status, AudioJobStatus.FAILED.value)
            except ValueError:
                job_failed.status = AudioJobStatus.FAILED
            job_failed.error = str(exc)
            job_failed.completed_at = datetime.utcnow()
            await db_adapter.update("audio_jobs", job_id, job_failed.to_dict())
        return False


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_audio_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_operator_user)
):
    """Upload audio file for transcription (platform operator only)."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    allowed_types = [".mp3", ".wav", ".m4a", ".ogg", ".flac"]
    
    if not file_storage.validate_file_type(file.filename, allowed_types):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Save file off the event loop
    job_id = f"audio_{datetime.utcnow().timestamp()}"
    loop = asyncio.get_running_loop()
    job_id, file_path = await loop.run_in_executor(None, file_storage.save_upload, file.file, file.filename, job_id)
    
    # Create job
    job = AudioJob(
        _id=job_id,
        uploader_id=current_user["username"],
        source_file_path=file_path,
        source_filename=file.filename or "unknown.mp3",
        file_type=Path(file.filename).suffix.lower() if file.filename else ".mp3",
        status=AudioJobStatus.PENDING
    )
    
    # Save to database
    await db_adapter.insert("audio_jobs", job.to_dict())
    
    return {
        "job_id": job_id,
        "message": "Audio file uploaded successfully",
        "filename": file.filename
    }


@router.get("/jobs", response_model=List[AudioJobResponse])
async def list_audio_jobs(
    status_filter: str = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_operator_user)
):
    """List all audio transcription jobs (platform operator only)."""
    jobs = await db_adapter.list_collection("audio_jobs")
    if status_filter:
        jobs = [j for j in jobs if j.get("status") == status_filter]
    
    jobs_sorted = sorted(jobs, key=lambda x: x.get("created_at", ""), reverse=True)
    sliced = jobs_sorted[offset:offset + limit]

    response = []
    for job_data in sliced:
        job = audio_job_from_dict(job_data)
        response.append(AudioJobResponse(
            id=job.id,
            uploader_id=job.uploader_id,
            status=job.status,
            original_filename=job.source_filename,
            file_type=job.file_type,
            duration=job.duration,
            created_at=job.created_at.isoformat(),
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
            error_message=job.error
        ))
    
    return response


@router.get("/jobs/{job_id}", response_model=AudioJobDetailResponse)
async def get_audio_job(
    job_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Get audio job details (platform operator only)."""
    job_data = await db_adapter.get("audio_jobs", job_id)
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio job not found"
        )
    
    job = audio_job_from_dict(job_data)
    
    # Fetch transcript if available
    transcript = None
    if job.transcript_ref:
        transcript_data = await db_adapter.get("audio_transcripts", job.transcript_ref)
        if transcript_data:
            transcript = audio_transcript_from_dict(transcript_data)
            max_chars = getattr(config, "AUDIO_TRANSCRIPT_PREVIEW_CHARS", 2000) if 'config' in globals() else 2000
            if transcript.text and len(transcript.text) > max_chars:
                transcript.text = transcript.text[:max_chars] + "..."
                transcript.metadata = {**transcript.metadata, "truncated": True}
    
    return AudioJobDetailResponse(
        id=job.id,
        uploader_id=job.uploader_id,
        status=job.status,
        original_filename=job.source_filename,
        file_type=job.file_type,
        duration=job.duration,
        created_at=job.created_at.isoformat(),
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        error_message=job.error,
        transcript=transcript
    )


@router.get("/jobs/stats")
async def get_audio_job_stats(current_user: dict = Depends(get_operator_user)):
    """Basic counts for audio jobs by status plus recent failures."""
    jobs = await db_adapter.list_collection("audio_jobs")
    counts = {}
    for job in jobs:
        status = job.get("status", "unknown")
        counts[status] = counts.get(status, 0) + 1
    recent_failures = [
        {"_id": job.get("_id"), "error": job.get("error"), "completed_at": job.get("completed_at")}
        for job in sorted(jobs, key=lambda j: j.get("completed_at") or "", reverse=True)
        if job.get("status") == AudioJobStatus.FAILED
    ][:10]
    return {"counts": counts, "recent_failures": recent_failures}


@router.post("/jobs/{job_id}/transcribe")
async def transcribe_audio_job(
    job_id: str,
    language: str = "en",
    current_user: dict = Depends(get_operator_user)
):
    """Trigger transcription for an audio job (platform operator only)."""
    job_data = await db_adapter.get("audio_jobs", job_id)
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio job not found"
        )
    
    job = audio_job_from_dict(job_data)
    
    if job.status not in [AudioJobStatus.PENDING, AudioJobStatus.FAILED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job cannot be transcribed in status: {job.status}"
        )
    
    job.language = language or job.language
    job.error = None
    job.completed_at = None
    job.started_at = None
    job.status = AudioJobStatus.PENDING
    await db_adapter.update("audio_jobs", job_id, job.to_dict())
    logger.info("Audio job enqueued", extra={"job_id": job_id, "language": job.language})

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Job queued for transcription. Process via worker.",
        "provider": asr_service.provider
    }


@router.post("/jobs/{job_id}/slice")
async def slice_audio_to_items(
    job_id: str,
    request: AudioSliceRequest,
    current_user: dict = Depends(get_operator_user)
):
    """Slice audio transcript into dataset items (platform operator only)."""
    job_data = await db_adapter.get("audio_jobs", job_id)
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio job not found"
        )
    
    job = audio_job_from_dict(job_data)
    
    if not job.transcript_ref:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job has no transcript. Run transcription first."
        )
    
    # Verify dataset type exists
    dataset_type = await db_adapter.get("dataset_types", request.dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    
    # Fetch transcript
    transcript_data = await db_adapter.get("audio_transcripts", job.transcript_ref)
    if not transcript_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found"
        )
    
    transcript = audio_transcript_from_dict(transcript_data)
    
    # Create dataset item (1 item per audio file for now)
    item = {
        "dataset_type_id": request.dataset_type_id,
        "language": request.language or transcript.language,
        "content": {
            "audio_url": job.source_file_path,
            "transcript": transcript.text,
            "duration": transcript.duration,
            "confidence": transcript.confidence
        },
        "review_state": {
            "review_count": 0,
            "skip_count": 0,
            "flags": [],
            "is_finalized": False,
            "is_gold_standard": False
        }
    }
    
    item_dict = dataset_item_to_dict(item)
    item_id = await db_adapter.insert("dataset_items", item_dict)
    
    return {
        "message": "Audio sliced into dataset items",
        "items_created": 1,
        "item_ids": [item_id]
    }


@router.post("/jobs/{job_id}/cancel")
async def cancel_audio_job(
    job_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Cancel a pending audio job (platform operator only)."""
    job_data = await db_adapter.get("audio_jobs", job_id)
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio job not found"
        )
    
    job = audio_job_from_dict(job_data)
    
    if job.status != AudioJobStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job in status: {job.status}"
        )
    
    try:
        job.status = validate_audio_job_status_transition(job.status, AudioJobStatus.CANCELLED.value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    job.started_at = job.started_at or datetime.utcnow()
    job.completed_at = datetime.utcnow()
    await db_adapter.update("audio_jobs", job_id, job.to_dict())
    
    return {"message": "Audio job cancelled"}


@router.delete("/jobs/{job_id}")
async def delete_audio_job(
    job_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Delete an audio job and its files (platform operator only)."""
    job_data = await db_adapter.get("audio_jobs", job_id)
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio job not found"
        )
    
    # Delete files
    file_storage.delete_job_files(job_id)
    
    # Delete transcript if exists
    job = audio_job_from_dict(job_data)
    if job.transcript_ref:
        await db_adapter.delete("audio_transcripts", job.transcript_ref)
    
    # Delete job
    await db_adapter.delete("audio_jobs", job_id)
    
    return {"message": "Audio job deleted"}
