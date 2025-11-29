"""Dashboard routes for reviewers."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.app.routes.routes_auth import get_current_user
from backend.app.db_adapter import db_adapter

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/assigned-datasets")
async def get_assigned_datasets(current_user: dict = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Get assigned dataset types for the current reviewer.
    Returns progress, stats, and metadata for each assigned dataset.
    """
    # Get full user data from database using username from token
    username = current_user.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing username"
        )
    
    from backend.app.db_adapter import users_db
    user_data = await users_db.get(username)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_id = user_data["username"]  # Use username as user_id for consistency
    user_languages = user_data.get("languages", ["en"])
    
    # Get all active dataset types
    all_dataset_types = await db_adapter.find("dataset_types", lambda dt: dt.get("active", True))
    
    # Filter dataset types by language match
    assigned_datasets = []
    
    for dt in all_dataset_types:
        dt_languages = dt.get("languages", ["en"])
        
        # Check if there's a language overlap
        if any(lang in user_languages for lang in dt_languages):
            # Get stats for this dataset type
            all_items = await db_adapter.find(
                "dataset_items",
                lambda item: item.get("dataset_type_id") == dt["_id"]
            )
            
            # Get items reviewed by this user
            user_reviewed = await db_adapter.find(
                "dataset_items",
                lambda item: (
                    item.get("dataset_type_id") == dt["_id"] and
                    user_id in item.get("review_state", {}).get("reviewed_by", [])
                )
            )
            
            # Calculate stats
            total_items = len(all_items)
            items_reviewed = len(user_reviewed)
            
            # Calculate user earnings from this dataset
            user_earnings = items_reviewed * dt.get("payout_rate", 0.002)
            
            # Calculate progress percentage
            progress_pct = (items_reviewed / total_items * 100) if total_items > 0 else 0
            
            assigned_datasets.append({
                "_id": dt["_id"],
                "name": dt["name"],
                "description": dt.get("description", ""),
                "modality": dt.get("modality", "text"),
                "languages": dt_languages,
                "payout_rate": dt.get("payout_rate", 0.002),
                "total_items": total_items,
                "items_reviewed": items_reviewed,
                "progress_pct": round(progress_pct, 1),
                "user_earnings": round(user_earnings, 3),
                "review_guidelines": dt.get("review_guidelines")
            })
    
    # Sort by progress (least complete first to encourage completion)
    assigned_datasets.sort(key=lambda x: x["progress_pct"])
    
    return assigned_datasets
