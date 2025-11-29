"""Platform operator OCR routes for job-based workflow."""
import logging
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query

from backend.app.routes.routes_auth import get_current_user
from backend.app.models.ocr_job_model import (
    OcrJob, OcrJobResponse, OcrJobDetailResponse, OcrJobStatus,
    OcrSliceRequest, BulkUploadRequest, ocr_job_from_dict, ocr_result_from_dict,
    validate_ocr_job_status_transition,
)
from backend.app.models.dataset_item_model import dataset_item_to_dict
from backend.app.db_adapter import db_adapter
from backend.app.utils.file_storage import file_storage
from backend.app.services.ocr_service import ocr_service
from backend.app.config import config

router = APIRouter(prefix="/operator/ocr", tags=["operator-ocr"])
logger = logging.getLogger(__name__)


def _job_dict_to_response(job_dict: dict) -> dict:
    """Convert job dictionary to response format matching frontend expectations."""
    return {
        "id": job_dict.get("_id", job_dict.get("id")),
        "uploader_id": job_dict["uploader_id"],
        "status": job_dict["status"],
        "original_filename": job_dict.get("source_filename", job_dict.get("original_filename", "")),
        "file_type": job_dict["file_type"],
        "total_pages": job_dict.get("page_count", job_dict.get("total_pages", 1)),
        "created_at": job_dict["created_at"],
        "completed_at": job_dict.get("completed_at"),
        "error_message": job_dict.get("error", job_dict.get("error_message"))
    }


def get_operator_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user and verify platform_operator/super_operator access."""
    user_roles = current_user.get("roles", [])
    if not any(role in ["platform_operator", "super_operator"] for role in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Required roles: platform_operator, super_operator"
        )
    return current_user


async def run_ocr_job_worker(job_id: str) -> bool:
    """
    Worker entrypoint to process a queued OCR job.
    This is not invoked in HTTP handlers; wire it into a worker process.
    """
    job = await db_adapter.get("ocr_jobs", job_id)
    if not job:
        logger.error("OCR job %s not found", job_id)
        return False

    job_obj = ocr_job_from_dict(job)
    try:
        job_obj.status = validate_ocr_job_status_transition(job_obj.status, OcrJobStatus.PROCESSING.value)
    except ValueError as exc:
        logger.error("OCR job %s cannot start: %s", job_id, exc)
        return False

    job_obj.started_at = datetime.utcnow()
    job_obj.error = None
    await db_adapter.update("ocr_jobs", job_id, job_obj.to_dict())
    logger.info("OCR job started", extra={"job_id": job_id, "uploader": job_obj.uploader_id})

    try:
        loop = asyncio.get_running_loop()
        results = await loop.run_in_executor(None, ocr_service.process_file, job_obj.source_file_path, job_id)

        result_ids = []
        async with db_adapter.transaction() as session:
            for result in results:
                result_dict = result.to_dict()
                result_id = await db_adapter.insert_document(session, "ocr_results", result_dict)
                result_ids.append(result_id)

            job_obj.status = validate_ocr_job_status_transition(job_obj.status, OcrJobStatus.COMPLETED.value)
            job_obj.completed_at = datetime.utcnow()
            job_obj.results_ref = result_ids
            job_obj.page_count = len(results)
            await db_adapter.upsert_document(session, "ocr_jobs", job_obj.to_dict())

        logger.info("OCR job completed", extra={"job_id": job_id, "pages": len(results)})
        return True
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("OCR job %s failed: %s", job_id, exc)
        failed = await db_adapter.get("ocr_jobs", job_id)
        if failed:
            job_failed = ocr_job_from_dict(failed)
            try:
                job_failed.status = validate_ocr_job_status_transition(job_failed.status, OcrJobStatus.FAILED.value)
            except ValueError:
                job_failed.status = OcrJobStatus.FAILED
            job_failed.error = str(exc)
            job_failed.completed_at = datetime.utcnow()
            await db_adapter.update("ocr_jobs", job_id, job_failed.to_dict())
        return False


@router.post("/upload", response_model=OcrJobResponse, status_code=status.HTTP_201_CREATED)
async def upload_for_ocr(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_operator_user)
):
    """Upload file for OCR processing (platform operator only)."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    allowed_types = [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp"]
    
    if not file_storage.validate_file_type(file.filename, allowed_types):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    loop = asyncio.get_running_loop()
    job_id, file_path = await loop.run_in_executor(None, file_storage.save_upload, file.file, file.filename)
    
    file_type = file_storage.get_file_type(file.filename)
    
    job = OcrJob(
        _id=job_id,
        uploader_id=current_user["username"],
        source_file_path=file_path,
        source_filename=file.filename,
        file_type=file_type,
        status=OcrJobStatus.PENDING
    )
    
    await db_adapter.insert("ocr_jobs", job.to_dict())
    logger.info("OCR job created", extra={"job_id": job_id, "uploader": current_user["username"]})
    
    return OcrJobResponse(**_job_dict_to_response(job.to_dict()))


@router.get("/jobs", response_model=List[OcrJobResponse])
async def get_ocr_jobs(
    status_filter: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_operator_user)
):
    """Get all OCR jobs with optional status filter (platform operator only)."""
    def predicate(job: dict) -> bool:
        if status_filter:
            return job.get("status") == status_filter
        return True
    
    jobs = await db_adapter.find("ocr_jobs", predicate)
    jobs_sorted = sorted(jobs, key=lambda x: x.get("created_at", ""), reverse=True)
    sliced = jobs_sorted[offset:offset + limit]
    
    return [OcrJobResponse(**_job_dict_to_response(job)) for job in sliced]


@router.get("/jobs/stats")
async def get_ocr_job_stats(current_user: dict = Depends(get_operator_user)):
    """Return basic counts of OCR jobs by status for observability."""
    jobs = await db_adapter.list_collection("ocr_jobs")
    counts = {}
    for job in jobs:
        status = job.get("status", "unknown")
        counts[status] = counts.get(status, 0) + 1
    recent_failures = [
        {"_id": job.get("_id"), "error": job.get("error"), "completed_at": job.get("completed_at")}
        for job in sorted(jobs, key=lambda j: j.get("completed_at") or "", reverse=True)
        if job.get("status") == OcrJobStatus.FAILED
    ][:10]
    return {"counts": counts, "recent_failures": recent_failures}


@router.get("/jobs/{job_id}", response_model=OcrJobDetailResponse)
async def get_ocr_job_detail(
    job_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Get detailed OCR job information including results (platform operator only)."""
    job = await db_adapter.get("ocr_jobs", job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OCR job not found"
        )
    
    results = []
    for result_id in job.get("results_ref", []):
        result_data = await db_adapter.get("ocr_results", result_id)
        if result_data:
            res_obj = ocr_result_from_dict(result_data)
            max_chars = getattr(config, "OCR_RESULT_PREVIEW_CHARS", 2000)
            if res_obj.full_text and len(res_obj.full_text) > max_chars:
                res_obj.full_text = res_obj.full_text[:max_chars] + "..."
                res_obj.metadata = {**res_obj.metadata, "truncated": True}
            results.append(res_obj)
    
    response_data = _job_dict_to_response(job)
    response_data["results"] = results
    return OcrJobDetailResponse(**response_data)


@router.post("/jobs/{job_id}/slice", status_code=status.HTTP_201_CREATED)
async def slice_ocr_to_dataset_items(
    job_id: str,
    request: OcrSliceRequest,
    current_user: dict = Depends(get_operator_user)
):
    """Slice OCR results into dataset items (platform operator only)."""
    job = await db_adapter.get("ocr_jobs", job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OCR job not found"
        )
    
    if job.get("status") != OcrJobStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only slice completed OCR jobs"
        )
    
    dataset_type = await db_adapter.get("dataset_types", request.dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    
    created_items = []
    for slice_data in request.slices:
        item_content = slice_data.get("content", {})
        item_content["source_job_id"] = job_id
        item_content["source_filename"] = job.get("source_filename")
        
        item = dataset_item_to_dict({
            "dataset_type_id": request.dataset_type_id,
            "content": item_content,
            "language": slice_data.get("language", "en"),
            "metadata": {
                "created_from_ocr": True,
                "ocr_job_id": job_id,
                "page_index": slice_data.get("page_index", 0)
            }
        })
        
        item_id = await db_adapter.insert("dataset_items", item)
        created_items.append({"id": item_id, "content": item_content})
    
    return {
        "message": f"Created {len(created_items)} dataset items from OCR job",
        "items": created_items
    }


@router.post("/jobs/{job_id}/retry", response_model=OcrJobResponse)
async def retry_ocr_job(
    job_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Retry a failed OCR job (platform operator only)."""
    job = await db_adapter.get("ocr_jobs", job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OCR job not found"
        )
    
    job_obj = ocr_job_from_dict(job)
    
    if job_obj.status not in [OcrJobStatus.FAILED, OcrJobStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only retry failed or cancelled jobs"
        )
    
    try:
        job_obj.status = validate_ocr_job_status_transition(job_obj.status, OcrJobStatus.PENDING.value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc)
        ) from exc
    job_obj.error = None
    job_obj.completed_at = None
    job_obj.started_at = None
    await db_adapter.update("ocr_jobs", job_id, job_obj.to_dict())
    
    return OcrJobResponse(**_job_dict_to_response(job_obj.to_dict()))


@router.post("/jobs/{job_id}/cancel", response_model=OcrJobResponse)
async def cancel_ocr_job(
    job_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Cancel a pending OCR job (platform operator only)."""
    job = await db_adapter.get("ocr_jobs", job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OCR job not found"
        )
    
    job_obj = ocr_job_from_dict(job)
    
    if job_obj.status != OcrJobStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending jobs"
        )
    
    try:
        job_obj.status = validate_ocr_job_status_transition(job_obj.status, OcrJobStatus.CANCELLED.value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc)
        ) from exc
    job_obj.completed_at = datetime.utcnow()
    job_obj.started_at = job_obj.started_at or datetime.utcnow()
    await db_adapter.update("ocr_jobs", job_id, job_obj.to_dict())
    
    return OcrJobResponse(**_job_dict_to_response(job_obj.to_dict()))


@router.post("/bulk-upload", status_code=status.HTTP_201_CREATED)
async def bulk_upload_dataset_items(
    request: BulkUploadRequest,
    current_user: dict = Depends(get_operator_user)
):
    """Bulk upload dataset items (CSV/JSON) (platform operator only)."""
    dataset_type = await db_adapter.get("dataset_types", request.dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    
    created_items = []
    for item_data in request.items:
        item = dataset_item_to_dict({
            "dataset_type_id": request.dataset_type_id,
            "content": item_data.get("content", {}),
            "language": item_data.get("language", "en"),
            "metadata": {
                "created_via_bulk_upload": True,
                "uploaded_by": current_user["username"]
            }
        })
        
        item_id = await db_adapter.insert("dataset_items", item)
        created_items.append(item_id)
    
    return {
        "message": f"Successfully uploaded {len(created_items)} items",
        "item_ids": created_items
    }
