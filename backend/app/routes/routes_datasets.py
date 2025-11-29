"""Dataset routes."""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from backend.app.db_adapter import db_adapter
from backend.app.models.dataset_type_model import DatasetTypeCreate, DatasetTypeUpdate, DatasetTypeResponse, dataset_type_to_dict
from backend.app.models.dataset_item_model import DatasetItemCreate, DatasetItemResponse, dataset_item_to_dict
from backend.app.routes.routes_auth import get_current_user
from backend.app.services.queue_service import QueueService
from backend.app.services.item_number_service import item_number_service

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/next")
async def get_next_item(
    langs: str = Query(..., description="Comma-separated language codes, e.g., 'en,hi'"),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch next item for review with language filtering.
    Requires authentication.
    """
    # Parse languages
    languages = [lang.strip() for lang in langs.split(",")]
    
    # Get user's ID
    user_id = current_user.get("username")
    user_languages = current_user.get("languages", [])
    
    # Filter by user's languages if they have them set
    if user_languages:
        languages = [lang for lang in languages if lang in user_languages]
    
    # Get system config for lock timeout
    system_config = await db_adapter.get("system_config", "config")
    lock_timeout_sec = system_config.get("lock_timeout_sec", 180) if system_config else 180
    
    # Fetch next item
    item = await QueueService.get_next_item(user_id, languages, lock_timeout_sec)
    
    if not item:
        return {"message": "No items available in queue"}
    
    return item


@router.get("/items/{item_id}")
async def get_dataset_item(item_id: str):
    """Get dataset item by ID."""
    item = await db_adapter.get("dataset_items", item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset item not found"
        )
    return item


@router.post("/items", status_code=status.HTTP_201_CREATED)
async def create_dataset_item(
    item_data: DatasetItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new dataset item (authenticated users)."""
    # Verify dataset type exists
    dataset_type = await db_adapter.get("dataset_types", item_data.dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    
    # Create item with auto-generated item number
    item_dict = item_data.model_dump()
    item_dict["item_number"] = await item_number_service.get_next_number(item_data.dataset_type_id)
    item = dataset_item_to_dict(item_dict)
    item_id = await db_adapter.insert("dataset_items", item)
    
    return {"_id": item_id, "item_number": item["item_number"], "message": "Item created successfully"}


@router.get("/type/{dataset_type_id}")
async def get_dataset_type_schema(
    dataset_type_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get dataset type schema for rendering review widgets (authenticated users)."""
    dataset_type = await db_adapter.get("dataset_types", dataset_type_id)
    if not dataset_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset type not found"
        )
    return dataset_type


@router.get("/stats")
async def get_dataset_stats(
    langs: Optional[str] = Query(None, description="Comma-separated language codes")
):
    """Get dataset/queue statistics."""
    languages = None
    if langs:
        languages = [lang.strip() for lang in langs.split(",")]
    
    return await QueueService.get_queue_stats(languages)
