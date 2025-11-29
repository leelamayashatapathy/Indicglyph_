"""Platform operator routes."""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import csv
import json
import io

from backend.app.models.user_model import UserResponse, UserUpdate
from backend.app.models.payout_model import PayoutResponse
from backend.app.models.dataset_type_model import DatasetTypeCreate, DatasetTypeUpdate, DatasetTypeResponse, dataset_type_to_dict
from backend.app.models.dataset_item_model import DatasetItemResponse
from backend.app.db_adapter import users_db, db_adapter
from backend.app.routes.routes_auth import get_current_user
from backend.app.utils.role_checker import require_roles
from backend.app.services.payout_service import PayoutService
from backend.app.services.audit_service import AuditService
from backend.app.services.item_number_service import item_number_service
from backend.app.config import config

router = APIRouter(prefix="/operator", tags=["operator"])


def _migrate_legacy_dataset_type(dt: dict) -> dict:
    """Migrate legacy dataset type format (fields[].name -> fields[].key, add modality)."""
    # Migrate field name to key
    if "fields" in dt and isinstance(dt["fields"], list):
        for field in dt["fields"]:
            if isinstance(field, dict) and "name" in field and "key" not in field:
                field["key"] = field.pop("name")
    
    # Add modality if missing (default to 'text' for legacy datasets)
    if "modality" not in dt:
        dt["modality"] = "text"
    
    return dt


# Composable dependency that gets user and checks platform operator roles
def get_operator_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user and verify platform_operator/super_operator access."""
    user_roles = current_user.get("roles", [])
    if not any(role in ["platform_operator", "super_operator"] for role in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Required roles: platform_operator, super_operator"
        )
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(current_user: dict = Depends(get_operator_user)):
    """List all users (platform operator only)."""
    all_users = await users_db.get_all()
    return [UserResponse(**user_data) for user_data in all_users.values()]


@router.put("/users/{username}", response_model=UserResponse)
async def update_user(
    username: str, 
    user_update: UserUpdate, 
    current_user: dict = Depends(get_operator_user)
):
    """Update user (platform operator only)."""
    user_data = await users_db.get(username)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-privilege downgrade: operators cannot remove their own operator role
    if username == current_user.get("username"):
        update_data = user_update.model_dump(exclude_unset=True)
        if "roles" in update_data:
            current_roles = current_user.get("roles", [])
            new_roles = update_data["roles"]
            
            # Check if trying to remove platform_operator/super_operator role from self
            if ("platform_operator" in current_roles or "super_operator" in current_roles):
                if "platform_operator" not in new_roles and "super_operator" not in new_roles:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Cannot remove platform operator privileges from your own account. Use another operator account to modify your roles."
                    )
    
    # Update fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        user_data[field] = value
    
    await users_db.set(username, user_data)
    
    # Audit log
    await AuditService.log_action(
        admin_username=current_user.get("username"),
        action="update",
        resource_type="user",
        resource_id=username,
        details={"updated_fields": list(update_data.keys())}
    )
    
    return UserResponse(**user_data)


@router.delete("/users/{username}")
async def delete_user(
    username: str, 
    current_user: dict = Depends(get_operator_user)
):
    """Delete user (platform operator only)."""
    if not await users_db.exists(username):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await users_db.delete(username)
    return {"message": f"User {username} deleted"}


@router.get("/payouts", response_model=List[PayoutResponse])
async def list_all_payouts(
    status: Optional[str] = None, 
    current_user: dict = Depends(get_operator_user)
):
    """List all payouts (platform operator only)."""
    payouts = await PayoutService.list_all_payouts(status)
    return [PayoutResponse(**p.to_dict()) for p in payouts]


@router.post("/payouts/{payout_id}/process")
async def process_payout(
    payout_id: str, 
    status: str, 
    notes: Optional[str] = None, 
    current_user: dict = Depends(get_operator_user)
):
    """Process a payout (platform operator only)."""
    try:
        payout = await PayoutService.process_payout(payout_id, status, notes)
        return PayoutResponse(**payout.to_dict())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stats")
async def get_operator_stats(current_user: dict = Depends(get_operator_user)):
    """Get platform statistics (platform operator only)."""
    from backend.app.services.queue_service import QueueService
    
    all_users = await users_db.get_all()
    queue_stats = await QueueService.get_queue_stats()
    
    total_users = len(all_users)
    active_users = sum(1 for u in all_users.values() if u.get("is_active", True))
    total_balance = sum(u.get("payout_balance", 0.0) for u in all_users.values())
    total_reviews = sum(u.get("reviews_done", 0) for u in all_users.values())
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "queue": queue_stats,
        "totals": {
            "total_balance_outstanding": total_balance,
            "total_reviews_completed": total_reviews
        }
    }


@router.get("/system-config")
async def get_system_config(current_user: dict = Depends(get_operator_user)):
    """Get system configuration (platform operator only)."""
    config = await db_adapter.get("system_config", "config")
    if not config:
        return {
            "payout_rate_default": 0.002,
            "skip_threshold_default": 5,
            "lock_timeout_sec": 180,
            "finalize_review_count": 3,
            "gold_skip_correct_threshold": 5,
            "max_unchecked_skips_before_prompt": 2,
            "available_languages": [
                {"code": "en", "name": "English"},
                {"code": "hi", "name": "Hindi"},
                {"code": "es", "name": "Spanish"},
                {"code": "fr", "name": "French"},
                {"code": "de", "name": "German"},
                {"code": "zh", "name": "Chinese"},
                {"code": "ar", "name": "Arabic"},
                {"code": "bn", "name": "Bengali"},
                {"code": "mr", "name": "Marathi"},
                {"code": "ta", "name": "Tamil"},
                {"code": "te", "name": "Telugu"},
                {"code": "gu", "name": "Gujarati"},
                {"code": "kn", "name": "Kannada"},
                {"code": "ml", "name": "Malayalam"},
                {"code": "pa", "name": "Punjabi"},
                {"code": "or", "name": "Odia"},
            ]
        }
    
    # Ensure new fields exist with defaults
    if "gold_skip_correct_threshold" not in config:
        config["gold_skip_correct_threshold"] = 5
    if "max_unchecked_skips_before_prompt" not in config:
        config["max_unchecked_skips_before_prompt"] = 2
    if "available_languages" not in config:
        config["available_languages"] = [
            {"code": "en", "name": "English"},
            {"code": "hi", "name": "Hindi"},
            {"code": "es", "name": "Spanish"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
            {"code": "zh", "name": "Chinese"},
            {"code": "ar", "name": "Arabic"},
            {"code": "bn", "name": "Bengali"},
            {"code": "mr", "name": "Marathi"},
            {"code": "ta", "name": "Tamil"},
            {"code": "te", "name": "Telugu"},
            {"code": "gu", "name": "Gujarati"},
            {"code": "kn", "name": "Kannada"},
            {"code": "ml", "name": "Malayalam"},
            {"code": "pa", "name": "Punjabi"},
            {"code": "or", "name": "Odia"},
        ]
    
    return config


@router.put("/system-config")
async def update_system_config(config_data: dict, current_user: dict = Depends(get_operator_user)):
    """Update system configuration (platform operator only)."""
    existing_config = await db_adapter.get("system_config", "config") or {}
    
    # Merge updates
    existing_config.update(config_data)
    
    # Save to database
    await db_adapter.update("system_config", "config", existing_config)
    
    # Audit log
    await AuditService.log_action(
        admin_username=current_user.get("username"),
        action="update",
        resource_type="system_config",
        resource_id="config",
        details={"updated_keys": list(config_data.keys())}
    )
    
    return existing_config


@router.post("/dataset-type", response_model=DatasetTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset_type(
    dataset_type: DatasetTypeCreate,
    current_user: dict = Depends(get_operator_user)
):
    """Create a new dataset type (platform operator only)."""
    # Check if name already exists
    existing_types = await db_adapter.find("dataset_types", lambda dt: dt.get("name") == dataset_type.name)
    if existing_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset type with name '{dataset_type.name}' already exists"
        )
    
    # Validate field key uniqueness
    field_keys = [f.key for f in dataset_type.fields]
    if len(field_keys) != len(set(field_keys)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field keys must be unique within a dataset type"
        )
    
    # Create dataset type
    dt_dict = dataset_type_to_dict(dataset_type.model_dump())
    dt_id = await db_adapter.insert("dataset_types", dt_dict)
    
    # Audit log
    await AuditService.log_action(
        admin_username=current_user.get("username"),
        action="create",
        resource_type="dataset_type",
        resource_id=dt_id,
        details={"name": dataset_type.name, "modality": dataset_type.modality}
    )
    
    # Return the created dataset type
    created = await db_adapter.get("dataset_types", dt_id)
    return DatasetTypeResponse(**created)


@router.get("/dataset-type", response_model=List[DatasetTypeResponse])
async def list_dataset_types(current_user: dict = Depends(get_operator_user)):
    """List all dataset types (platform operator only)."""
    dataset_types = await db_adapter.list_collection("dataset_types")
    migrated = [_migrate_legacy_dataset_type(dt) for dt in dataset_types]
    return [DatasetTypeResponse(**dt) for dt in migrated]


@router.get("/dataset-type/{dataset_type_id}", response_model=DatasetTypeResponse)
async def get_dataset_type(
    dataset_type_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Get a specific dataset type by ID (platform operator only)."""
    dataset_type = await db_adapter.get("dataset_types", dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    dataset_type = _migrate_legacy_dataset_type(dataset_type)
    return DatasetTypeResponse(**dataset_type)


@router.put("/dataset-type/{dataset_type_id}", response_model=DatasetTypeResponse)
async def update_dataset_type(
    dataset_type_id: str,
    dataset_type_update: DatasetTypeUpdate,
    current_user: dict = Depends(get_operator_user)
):
    """Update a dataset type (platform operator only)."""
    existing = await db_adapter.get("dataset_types", dataset_type_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    
    # Migrate legacy format before updating
    existing = _migrate_legacy_dataset_type(existing)
    
    # Get update data
    update_data = dataset_type_update.model_dump(exclude_unset=True)
    
    # If name is being updated, check for conflicts
    if "name" in update_data and update_data["name"] != existing.get("name"):
        conflicts = await db_adapter.find("dataset_types", 
                                   lambda dt: dt.get("name") == update_data["name"] and dt.get("_id") != dataset_type_id)
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dataset type with name '{update_data['name']}' already exists"
            )
    
    # Validate field key uniqueness if fields are being updated
    if "fields" in update_data:
        field_keys = [f["key"] if isinstance(f, dict) else f.key for f in update_data["fields"]]
        if len(field_keys) != len(set(field_keys)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Field keys must be unique within a dataset type"
            )
        # Convert FieldSchema objects to dicts
        update_data["fields"] = [f.model_dump() if hasattr(f, "model_dump") else f for f in update_data["fields"]]
    
    # Merge updates
    existing.update(update_data)
    
    # Save to database
    await db_adapter.update("dataset_types", dataset_type_id, existing)
    
    # Return updated dataset type
    updated = await db_adapter.get("dataset_types", dataset_type_id)
    return DatasetTypeResponse(**updated)


@router.delete("/dataset-type/{dataset_type_id}")
async def delete_dataset_type(
    dataset_type_id: str,
    current_user: dict = Depends(get_operator_user)
):
    """Delete a dataset type (platform operator only). Prevents deletion if items exist."""
    dataset_type = await db_adapter.get("dataset_types", dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    
    # Migrate legacy format for consistent handling
    dataset_type = _migrate_legacy_dataset_type(dataset_type)
    
    # Check if any items exist for this dataset type
    existing_items = await db_adapter.find("dataset_items", 
                                    lambda item: item.get("dataset_type_id") == dataset_type_id)
    if existing_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete dataset type. {len(existing_items)} items exist. Set active=false instead."
        )
    
    # Safe to delete
    await db_adapter.delete("dataset_types", dataset_type_id)
    return {"message": f"Dataset type '{dataset_type.get('name')}' deleted"}


@router.get("/dataset-items")
async def list_dataset_items(
    dataset_type_id: Optional[str] = None,
    language: Optional[str] = None,
    status: Optional[str] = None,
    finalized: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_operator_user)
):
    """
    List dataset items with optional filters, search, sorting, and pagination (platform operator only).
    Returns items paginated to prevent performance issues.
    
    Query params:
    - search: Search in item content (case-insensitive)
    - sort_by: Field to sort by (created_at, item_number, review_count)
    - sort_order: Sort direction (asc, desc)
    """
    max_limit = 200
    limit = min(limit, max_limit)

    if search:
        # Legacy fallback with in-Python search
        def predicate(item: dict) -> bool:
            if dataset_type_id and item.get("dataset_type_id") != dataset_type_id:
                return False
            if language and item.get("language") != language:
                return False
            if status and item.get("review_state", {}).get("status") != status:
                return False
            if finalized is not None and item.get("review_state", {}).get("finalized", False) != finalized:
                return False
            search_lower = search.lower()
            content = item.get("content", {})
            content_str = " ".join(str(v).lower() for v in content.values() if v)
            return search_lower in content_str

        all_items = await db_adapter.find("dataset_items", predicate)
        reverse = (sort_order == "desc")
        if sort_by == "item_number":
            all_items.sort(key=lambda x: x.get("item_number") or 0, reverse=reverse)
        elif sort_by == "review_count":
            all_items.sort(key=lambda x: x.get("review_state", {}).get("review_count", 0), reverse=reverse)
        elif sort_by == "created_at":
            all_items.sort(key=lambda x: x.get("created_at", ""), reverse=reverse)
        total_count = len(all_items)
        paginated_items = all_items[offset:offset + limit]
        pending_count = sum(1 for item in all_items if item.get("review_state", {}).get("status") == "pending")
        finalized_count = sum(1 for item in all_items if item.get("review_state", {}).get("finalized", False))
    else:
        query_filters = {
            "dataset_type_id": dataset_type_id,
            "language": language,
            "status": status,
            "finalized": finalized,
        }
        result = await db_adapter.query_collection(
            "dataset_items",
            filters=query_filters,
            sort_by=sort_by or "created_at",
            sort_dir=sort_order or "desc",
            limit=limit,
            offset=offset
        )
        paginated_items = result["items"]
        total_count = result["total"]
        pending_count = await db_adapter.count_documents("dataset_items", {**query_filters, "status": "pending"})
        finalized_count = await db_adapter.count_documents("dataset_items", {**query_filters, "finalized": True})
    
    # Normalize modality for legacy items missing this field
    normalized_items = []
    for item in paginated_items:
        if item.get("modality") is None:
            item["modality"] = "text"
        normalized_items.append(item)

    return {
        "items": [DatasetItemResponse(**item) for item in normalized_items],
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total_count,
        "stats": {
            "total": total_count,
            "pending": pending_count,
            "finalized": finalized_count
        }
    }


class ExportFilters(BaseModel):
    """Filters for data export."""
    is_gold: Optional[bool] = None
    flagged: Optional[bool] = None
    language: Optional[List[str]] = None
    dataset_type_id: Optional[str] = None
    finalized: Optional[bool] = None
    reviewed_after: Optional[str] = None
    reviewed_before: Optional[str] = None
    reviewer_id: Optional[str] = None


class ExportRequest(BaseModel):
    """Request schema for data export."""
    format: str = Field(..., description="csv or jsonl")
    filters: ExportFilters = Field(default_factory=ExportFilters)
    fields: Optional[List[str]] = Field(default=None, description="Optional list of fields/content keys to include")


@router.post("/export")
async def export_dataset_items(
    export_request: ExportRequest,
    current_user: dict = Depends(get_operator_user)
):
    """
    Export dataset items in CSV or JSONL format with filters (platform operator only).
    
    Returns a downloadable file with filtered dataset items.
    """
    # Validate format
    if export_request.format not in ["csv", "jsonl"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Must be 'csv' or 'jsonl'"
        )
    
    filters = export_request.filters
    projection_fields = set(export_request.fields or [])
    
    query_filters = {
        "dataset_type_id": filters.dataset_type_id,
        "language": filters.language,
        "finalized": filters.finalized,
        "status": None,
        "flagged": filters.flagged,
        "is_gold": filters.is_gold,
    }

    result = await db_adapter.query_collection(
        "dataset_items",
        filters=query_filters,
        sort_by="created_at",
        sort_dir="desc",
        limit=getattr(config, "EXPORT_ROW_LIMIT", 5000),
        offset=0
    )
    items = result["items"]
    max_rows = getattr(config, "EXPORT_ROW_LIMIT", 5000)
    capped = result["total"] > len(items)
    
    # Generate filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"export_{timestamp}.{export_request.format}"

    def include_field(field_name: str) -> bool:
        if not projection_fields:
            return True
        return field_name in projection_fields
    
    # Generate file content
    if export_request.format == "csv":
        if not items:
            def empty_csv():
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["_id", "dataset_type_id", "language", "content", "review_state", "is_gold", "flagged"])
                yield output.getvalue()
            return StreamingResponse(
                empty_csv(),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f'attachment; filename=\"{filename}\"'
                }
            )

        all_content_keys = set()
        for item in items:
            content = item.get("content", {})
            all_content_keys.update(content.keys())

        def csv_stream():
            output = io.StringIO()
            first_row = True
            fieldnames = None
            for item in items:
                flattened = {}
                # Root fields
                root_fields = {
                    "_id": item.get("_id", ""),
                    "dataset_type_id": item.get("dataset_type_id", ""),
                    "language": item.get("language", ""),
                    "is_gold": item.get("is_gold", False),
                    "flagged": item.get("flagged", False),
                    "review_count": item.get("review_state", {}).get("review_count", 0),
                    "skip_count": item.get("review_state", {}).get("skip_count", 0),
                    "correct_skips": item.get("review_state", {}).get("correct_skips", 0),
                    "finalized": item.get("review_state", {}).get("finalized", False),
                    "status": item.get("review_state", {}).get("status", ""),
                }
                for k, v in root_fields.items():
                    if include_field(k):
                        flattened[k] = v
                content = item.get("content", {})
                for key in sorted(all_content_keys):
                    field_key = f"content.{key}"
                    if include_field(field_key):
                        flattened[f"content_{key}"] = content.get(key, "")

                if first_row:
                    fieldnames = list(flattened.keys())
                    writer = csv.DictWriter(output, fieldnames=fieldnames)
                    writer.writeheader()
                    first_row = False
                else:
                    writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writerow(flattened)
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

        return StreamingResponse(
            csv_stream(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Export-Capped": str(capped).lower()
            }
        )
    
    else:  # jsonl format
        def jsonl_stream():
            for item in items:
                if not projection_fields:
                    yield json.dumps(item, ensure_ascii=False) + "\n"
                else:
                    content = item.get("content", {})
                    filtered = {}
                    for field in projection_fields:
                        if field.startswith("content."):
                            content_key = field.split("content.", 1)[1]
                            filtered[field] = content.get(content_key)
                        else:
                            filtered[field] = item.get(field)
                    if "_id" not in filtered:
                        filtered["_id"] = item.get("_id")
                    yield json.dumps(filtered, ensure_ascii=False) + "\n"
        return StreamingResponse(
            jsonl_stream(),
            media_type="application/x-ndjson",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Export-Capped": str(capped).lower()
            }
        )


@router.post("/migrate-item-numbers")
async def migrate_item_numbers(current_user: dict = Depends(get_operator_user)):
    """
    One-time migration to assign sequential item numbers to existing items.
    Groups items by dataset type and assigns numbers chronologically.
    """
    try:
        updated_count = await item_number_service.assign_numbers_to_existing_items()
        return {
            "message": f"Successfully assigned item numbers to {updated_count} items",
            "updated_count": updated_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )
