"""Review service - handles approve/edit/skip with payout logic."""
from typing import Optional
from datetime import datetime
from backend.app.db_adapter import db_adapter, users_db
from backend.app.models.review_log_model import review_log_to_dict
from backend.app.models.dataset_item_model import (
    DatasetItemStatus,
    validate_dataset_status_transition,
)


class ReviewService:
    """Service for managing reviews."""
    
    @staticmethod
    async def submit_review(
        item_id: str,
        reviewer_id: str,
        action: str,  # approve|edit|skip
        changes: Optional[dict] = None,
        payout_rate_default: float = 0.002,
        skip_threshold_default: int = 5,
        skip_data_correct: bool = False,
        skip_feedback: Optional[str] = None
    ) -> dict:
        """
        Submit review for an item.
        
        - approve: increment review_count, add payout
        - edit: merge changes into content, increment review_count, add payout
        - skip: increment skip_count, no payout
        
        Finalize if review_count >= 3 or skip_count >= skip_threshold
        """
        async with db_adapter.transaction() as session:
            # Lock item for update
            item = await db_adapter.get_for_update(session, "dataset_items", item_id)
            if not item:
                raise ValueError("Item not found")
            
            review_state = item.get("review_state", {})
            current_status = review_state.get("status")
            
            # Check if already finalized
            if review_state.get("finalized", False):
                raise ValueError("Item already finalized")
            
            # Check if user already reviewed (idempotency)
            reviewed_by = review_state.get("reviewed_by", [])
            if reviewer_id in reviewed_by:
                raise ValueError("You already reviewed this item")
            
            payout_amount = 0.0
            
            # Get dataset type for payout rate (or use default)
            dataset_type = await db_adapter.get("dataset_types", item.get("dataset_type_id", ""))
            payout_rate = dataset_type.get("payout_rate", payout_rate_default) if dataset_type else payout_rate_default
            
            # Handle action
            if action == "skip":
                # Get system config for gold threshold
                config = await db_adapter.get("system_config", "config") or {}
                gold_skip_threshold = config.get("gold_skip_correct_threshold", 5)
                
                # Increment skip_count
                skip_count = review_state.get("skip_count", 0) + 1
                review_state["skip_count"] = skip_count
                
                # Track correct skips vs unchecked skips
                if skip_data_correct:
                    correct_skips = review_state.get("correct_skips", 0) + 1
                    review_state["correct_skips"] = correct_skips
                    
                    # Auto-finalize to gold if threshold reached
                    if correct_skips >= gold_skip_threshold:
                        review_state["finalized"] = True
                        validate_dataset_status_transition(current_status, DatasetItemStatus.FINALIZED.value)
                        review_state["status"] = DatasetItemStatus.FINALIZED.value
                        item["is_gold"] = True
                else:
                    unchecked_skips = review_state.get("unchecked_skips", 0) + 1
                    review_state["unchecked_skips"] = unchecked_skips
                
                # Store skip feedback if provided
                if skip_feedback:
                    skip_feedback_list = item.get("skip_feedback", [])
                    skip_feedback_list.append({
                        "reviewer_id": reviewer_id,
                        "feedback": skip_feedback,
                        "timestamp": datetime.utcnow().isoformat(),
                        "data_correct": skip_data_correct
                    })
                    item["skip_feedback"] = skip_feedback_list
                
                new_status = DatasetItemStatus.FINALIZED if review_state.get("finalized") else DatasetItemStatus.PENDING
                validate_dataset_status_transition(current_status, new_status.value)
                review_state["status"] = new_status.value
                review_state["lock_owner"] = None
                review_state["lock_time"] = None
                
                # Add to reviewed_by if not already there
                if reviewer_id not in reviewed_by:
                    reviewed_by.append(reviewer_id)
                
                # Finalize if skip threshold reached (original logic)
                if skip_count >= skip_threshold_default and not review_state.get("finalized"):
                    review_state["finalized"] = True
                    validate_dataset_status_transition(review_state.get("status"), DatasetItemStatus.FINALIZED.value)
                    review_state["status"] = DatasetItemStatus.FINALIZED.value
            
            elif action in ["approve", "edit"]:
                # If edit, merge changes into content
                if action == "edit" and changes:
                    content = item.get("content", {})
                    content.update(changes)
                    item["content"] = content
                
                # Increment review_count
                review_count = review_state.get("review_count", 0) + 1
                review_state["review_count"] = review_count
                
                # Add to reviewed_by
                if reviewer_id not in reviewed_by:
                    reviewed_by.append(reviewer_id)
                
                # Add payout
                payout_amount = payout_rate
                
                # Finalize if review_count >= 3
                if review_count >= 3:
                    review_state["finalized"] = True
                    validate_dataset_status_transition(current_status, DatasetItemStatus.FINALIZED.value)
                    review_state["status"] = DatasetItemStatus.FINALIZED.value
                else:
                    validate_dataset_status_transition(current_status, DatasetItemStatus.PENDING.value)
                    review_state["status"] = DatasetItemStatus.PENDING.value
                
                review_state["lock_owner"] = None
                review_state["lock_time"] = None
            
            else:
                raise ValueError(f"Invalid action: {action}")
            
            review_state["reviewed_by"] = reviewed_by
            item["review_state"] = review_state
            
            # Update item within transaction
            await db_adapter.upsert_document(session, "dataset_items", item)
            
            # Create review log within transaction
            review_log = review_log_to_dict({
                "reviewer_id": reviewer_id,
                "dataset_item_id": item_id,
                "action": action,
                "changes": changes or {},
                "payout_amount": payout_amount,
                "skip_data_correct": skip_data_correct if action == "skip" else None,
                "skip_feedback": skip_feedback if action == "skip" else None
            })
            review_log_id = await db_adapter.insert_document(session, "review_logs", review_log)
            
            # Update user payout_balance and reviews_done atomically
            user = await db_adapter.get_for_update(session, "user", reviewer_id)
            if not user:
                raise ValueError("User not found")
            current_balance = user.get("payout_balance", 0.0)
            current_reviews = user.get("reviews_done", 0)
            if payout_amount > 0:
                user["payout_balance"] = current_balance + payout_amount
                user["reviews_done"] = current_reviews + 1
                await db_adapter.upsert_document(session, "user", user)
            
            return {
                "review_log_id": review_log_id,
                "action": action,
                "payout_amount": payout_amount,
                "item_finalized": review_state.get("finalized", False),
                "is_gold": item.get("is_gold", False),
                "review_count": review_state.get("review_count", 0),
                "skip_count": review_state.get("skip_count", 0),
                "correct_skips": review_state.get("correct_skips", 0),
                "unchecked_skips": review_state.get("unchecked_skips", 0)
            }
    
    @staticmethod
    async def get_user_stats(user_id: str) -> dict:
        """Get review statistics for a user."""
        def predicate(log: dict) -> bool:
            return log.get("reviewer_id") == user_id
        
        user_reviews = await db_adapter.find("review_logs", predicate)
        
        total_reviews = len(user_reviews)
        approvals = sum(1 for r in user_reviews if r.get("action") in ["approve", "edit"])
        skips = sum(1 for r in user_reviews if r.get("action") == "skip")
        total_earned = sum(r.get("payout_amount", 0.0) for r in user_reviews)
        
        return {
            "total_reviews": total_reviews,
            "approvals": approvals,
            "skips": skips,
            "total_earned": total_earned
        }
