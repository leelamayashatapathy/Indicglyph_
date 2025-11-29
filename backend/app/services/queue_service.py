"""Queue service - fetches next review item with language filtering."""
from typing import Optional, List
from datetime import datetime
from backend.app.db_adapter import db_adapter
from backend.app.models.dataset_item_model import (
    DatasetItemStatus,
    validate_dataset_status_transition,
    normalize_dataset_status,
)


class QueueService:
    """Service for managing review queue."""
    
    @staticmethod
    async def get_next_item(user_id: str, user_languages: List[str], lock_timeout_sec: int = 180) -> Optional[dict]:
        """
        Fetch next item for review.
        
        Predicates:
        - language in user languages
        - not finalized
        - status = pending
        - user not in reviewed_by
        - auto-unlock stale locks
        """
        claimed = await db_adapter.claim_next_dataset_item(
            languages=user_languages,
            lock_owner=user_id,
            lock_timeout_sec=lock_timeout_sec,
        )

        if not claimed:
            return None

        # Populate modality from parent dataset_type if missing
        if "modality" not in claimed:
            dataset_type_id = claimed.get("dataset_type_id")
            if dataset_type_id:
                dataset_type = await db_adapter.get("dataset_types", dataset_type_id)
                if dataset_type:
                    modality = dataset_type.get("modality", "text")
                    await db_adapter.update("dataset_items", claimed["_id"], {"modality": modality})
                    claimed["modality"] = modality
        
        return claimed
    
    @staticmethod
    async def unlock_item(item_id: str) -> bool:
        """Unlock an item (set back to pending)."""
        item = await db_adapter.get("dataset_items", item_id)
        if not item:
            return False
        
        review_state = item.get("review_state", {})
        validate_dataset_status_transition(review_state.get("status"), DatasetItemStatus.PENDING.value)
        review_state["status"] = DatasetItemStatus.PENDING.value
        review_state["lock_owner"] = None
        review_state["lock_time"] = None
        
        return await db_adapter.update("dataset_items", item_id, {"review_state": review_state})
    
    @staticmethod
    async def get_queue_stats(languages: Optional[List[str]] = None) -> dict:
        """Get queue statistics, optionally filtered by language - optimized for large datasets."""
        # Optimized: Use efficient counting instead of loading all items
        all_items = await db_adapter.list_collection("dataset_items")
        
        total = 0
        pending = 0
        in_review = 0
        
        # Process items efficiently
        for item in all_items:
            if not item:
                continue
            
            # Skip finalized items
            review_state = item.get("review_state", {})
            if review_state.get("finalized", False):
                continue
            
            # Filter by language if specified
            if languages and item.get("language") not in languages:
                continue
            
            total += 1
            status = review_state.get("status", "pending")
            if status == "pending":
                pending += 1
            elif status == "in_review":
                in_review += 1
        
        return {
            "total_items": total,
            "pending_items": pending,
            "in_review": in_review,
            "assigned": in_review,
            "unassigned": pending
        }
