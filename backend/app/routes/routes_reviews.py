"""Review routes."""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from backend.app.models.review_log_model import ReviewSubmit
from backend.app.routes.routes_auth import get_current_user
from backend.app.services.review_service import ReviewService
from backend.app.db_adapter import db_adapter

router = APIRouter(prefix="/review", tags=["reviews"])


@router.post("/submit")
async def submit_review(
    review_data: ReviewSubmit,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a review: approve/edit/skip.
    
    - approve: increment review_count, add payout
    - edit: merge changes into content, increment review_count, add payout  
    - skip: increment skip_count, no payout
    """
    # Get system config for defaults
    system_config = await db_adapter.get("system_config", "config")
    payout_rate_default = system_config.get("payout_rate_default", 0.002) if system_config else 0.002
    skip_threshold_default = system_config.get("skip_threshold_default", 5) if system_config else 5
    
    try:
        result = await ReviewService.submit_review(
            item_id=review_data.item_id,
            reviewer_id=current_user["username"],
            action=review_data.action,
            changes=review_data.changes,
            payout_rate_default=payout_rate_default,
            skip_threshold_default=skip_threshold_default,
            skip_data_correct=review_data.skip_data_correct,
            skip_feedback=review_data.skip_feedback
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stats")
async def get_review_stats(current_user: dict = Depends(get_current_user)):
    """Get current user's review statistics."""
    return await ReviewService.get_user_stats(current_user["username"])


@router.get("/my-reviews")
async def get_my_reviews(current_user: dict = Depends(get_current_user)):
    """Get current user's review history."""
    def predicate(log: dict) -> bool:
        return log.get("reviewer_id") == current_user["username"]
    
    reviews = await db_adapter.find("review_logs", predicate)
    return sorted(reviews, key=lambda r: r.get("timestamp", ""), reverse=True)


class FlagItemRequest(BaseModel):
    """Schema for flagging an item."""
    item_id: str
    reason: str = Field(..., description="offensive|corrupt|unclear|other")
    note: Optional[str] = None


@router.post("/flag")
async def flag_item(
    flag_data: FlagItemRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Flag an item as suspicious or inappropriate.
    
    Reasons: offensive, corrupt, unclear, other
    """
    try:
        # Get item
        item = await db_adapter.get("dataset_items", flag_data.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        # Mark item as flagged
        item["flagged"] = True
        
        # Add flag log
        flag_log = {
            "item_id": flag_data.item_id,
            "user_id": current_user["username"],
            "reason": flag_data.reason,
            "note": flag_data.note or "",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store flag in item's metadata
        flags = item.get("flags", [])
        flags.append(flag_log)
        item["flags"] = flags
        
        # Update item
        await db_adapter.update("dataset_items", flag_data.item_id, item)
        
        return {
            "success": True,
            "message": "Item flagged successfully",
            "item_id": flag_data.item_id,
            "flagged": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to flag item: {str(e)}"
        )
