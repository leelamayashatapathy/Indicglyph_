"""Platform operator routes for dataset item management."""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Header
from typing import List, Dict, Any, Optional
import zipfile
import io
import csv
import json
import hashlib

from backend.app.routes.routes_auth import get_current_user
from backend.app.models.dataset_item_model import dataset_item_to_dict, DatasetItemResponse
from backend.app.db_adapter import db_adapter
from backend.app.services.item_number_service import item_number_service

router = APIRouter(prefix="/operator/items", tags=["operator-items"])
MAX_UPLOAD_ITEMS = 1000


def get_operator_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user and verify platform_operator/super_operator access."""
    user_roles = current_user.get("roles", [])
    if not any(role in ["platform_operator", "super_operator"] for role in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Required roles: platform_operator, super_operator"
        )
    return current_user


@router.post("/bulk-upload-zip", status_code=status.HTTP_201_CREATED)
async def bulk_upload_zip(
    dataset_type_id: str,
    language: str = "en",
    file: UploadFile = File(...),
    idempotency_key: Optional[str] = Header(default=None),
    current_user: dict = Depends(get_operator_user)
):
    """
    Bulk upload dataset items from a ZIP file containing CSV or JSONL files.
    
    ZIP file should contain:
    - CSV files: first row as headers matching dataset type field keys
    - JSONL files: one JSON object per line with field keys
    
    All items will use the specified dataset_type_id and language.
    """
    # Verify dataset type exists
    dataset_type = await db_adapter.get("dataset_types", dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    
    # Validate file is a ZIP
    if not file.filename or not file.filename.endswith('.zip'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a ZIP archive"
        )
    
    try:
        # Read ZIP file
        zip_content = await file.read()
        content_fingerprint = hashlib.sha256(zip_content).hexdigest()

        if idempotency_key:
            existing = await db_adapter.get("upload_batches", idempotency_key)
            if existing:
                if (
                    existing.get("fingerprint") == content_fingerprint
                    and existing.get("dataset_type_id") == dataset_type_id
                ):
                    return {
                        "message": "Upload already processed",
                        "created_count": existing.get("created_count", 0),
                        "item_ids": existing.get("item_ids_preview", []),
                        "idempotency_key": idempotency_key,
                    }
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key reused with different payload",
                )

        zip_buffer = io.BytesIO(zip_content)
        
        prepared_items = []
        errors = []
        
        with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
            for file_info in zip_ref.filelist:
                filename = file_info.filename
                
                # Skip directories
                if filename.endswith('/'):
                    continue
                
                # Process CSV files
                if filename.endswith('.csv'):
                    try:
                        with zip_ref.open(filename) as csv_file:
                            text_stream = io.TextIOWrapper(csv_file, encoding="utf-8")
                            reader = csv.DictReader(text_stream)
                            
                            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                                try:
                                    # Remove empty values
                                    content = {k: v for k, v in row.items() if v and k}
                                    
                                    if not content:
                                        continue
                                    
                                    item = dataset_item_to_dict({
                                        "dataset_type_id": dataset_type_id,
                                        "item_number": await item_number_service.get_next_number(dataset_type_id),
                                        "content": content,
                                        "language": language,
                                        "metadata": {
                                            "created_via_bulk_upload": True,
                                            "uploaded_by": current_user["username"],
                                            "source_file": filename,
                                            "source_row": row_num
                                        }
                                    })
                                    
                                    prepared_items.append(item)
                                    if len(prepared_items) > MAX_UPLOAD_ITEMS:
                                        raise HTTPException(
                                            status_code=status.HTTP_400_BAD_REQUEST,
                                            detail=f"Upload exceeds limit of {MAX_UPLOAD_ITEMS} items"
                                        )
                                    
                                except Exception as row_error:
                                    errors.append({
                                        "file": filename,
                                        "row": row_num,
                                        "error": str(row_error)
                                    })
                    except Exception as file_error:
                        errors.append({
                            "file": filename,
                            "error": f"Failed to parse CSV: {str(file_error)}"
                        })
                
                # Process JSONL files
                elif filename.endswith('.jsonl') or filename.endswith('.json'):
                    try:
                        with zip_ref.open(filename) as jsonl_file:
                            text_stream = io.TextIOWrapper(jsonl_file, encoding="utf-8")
                            for line_num, line in enumerate(text_stream, start=1):
                                if not line.strip():
                                    continue
                                
                                try:
                                    data = json.loads(line)
                                    
                                    # Extract content (support both direct content or nested content field)
                                    if "content" in data and isinstance(data["content"], dict):
                                        content = data["content"]
                                    else:
                                        content = data
                                    
                                    item = dataset_item_to_dict({
                                        "dataset_type_id": dataset_type_id,
                                        "item_number": await item_number_service.get_next_number(dataset_type_id),
                                        "content": content,
                                        "language": data.get("language", language),
                                        "metadata": {
                                            "created_via_bulk_upload": True,
                                            "uploaded_by": current_user["username"],
                                            "source_file": filename,
                                            "source_line": line_num
                                        }
                                    })
                                    
                                    prepared_items.append(item)
                                    if len(prepared_items) > MAX_UPLOAD_ITEMS:
                                        raise HTTPException(
                                            status_code=status.HTTP_400_BAD_REQUEST,
                                            detail=f"Upload exceeds limit of {MAX_UPLOAD_ITEMS} items"
                                        )
                                    
                                except json.JSONDecodeError as json_error:
                                    errors.append({
                                        "file": filename,
                                        "line": line_num,
                                        "error": f"Invalid JSON: {str(json_error)}"
                                    })
                                except Exception as line_error:
                                    errors.append({
                                        "file": filename,
                                        "line": line_num,
                                        "error": str(line_error)
                                    })
                    except Exception as file_error:
                        errors.append({
                            "file": filename,
                            "error": f"Failed to parse JSONL: {str(file_error)}"
                        })
        
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ZIP file"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process ZIP file: {str(e)}"
        )

    # Abort if any errors were collected (no partial inserts)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Upload failed validation", "errors": errors[:50]}
        )

    # Write all items in a single transaction for atomicity
    created_items: List[str] = []
    async with db_adapter.transaction() as session:
        for item in prepared_items:
            item_id = await db_adapter.insert_document(session, "dataset_items", item)
            created_items.append(item_id)
        if idempotency_key:
            await db_adapter.upsert_document(session, "upload_batches", {
                "_id": idempotency_key,
                "dataset_type_id": dataset_type_id,
                "language": language,
                "fingerprint": content_fingerprint,
                "created_count": len(created_items),
                "item_ids_preview": created_items[:100],
                "uploaded_by": current_user["username"]
            })

    return {
        "message": f"Successfully uploaded {len(created_items)} items",
        "created_count": len(created_items),
        "item_ids": created_items[:100],
        "idempotency_key": idempotency_key
    }
