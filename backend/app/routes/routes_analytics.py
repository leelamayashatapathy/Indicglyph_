"""Analytics and reporting routes for platform operators."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from collections import defaultdict

from backend.app.routes.routes_auth import get_current_user
from backend.app.db_adapter import db_adapter, users_db

router = APIRouter(prefix="/api/operator/analytics", tags=["Analytics"])


def get_operator_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Verify current user is a platform operator."""
    roles = current_user.get("roles", [])
    if "platform_operator" not in roles and "super_operator" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform operator access required"
        )
    return current_user


def compute_reviewer_stats_from_data(
    users: Dict[str, dict],
    review_logs: List[dict],
    dataset_items: List[dict]
) -> List[Dict[str, Any]]:
    """Aggregate reviewer stats from users, review logs, and dataset items."""
    logs_by_user = defaultdict(list)
    for log in review_logs or []:
        reviewer_id = log.get("reviewer_id")
        if reviewer_id:
            logs_by_user[reviewer_id].append(log)

    items_by_reviewer = defaultdict(list)
    for item in dataset_items or []:
        for reviewer_id in item.get("review_state", {}).get("reviewed_by", []):
            items_by_reviewer[reviewer_id].append(item)

    reviewer_stats: List[Dict[str, Any]] = []
    for username, user_data in (users or {}).items():
        user_logs = logs_by_user.get(username, [])
        items_reviewed = items_by_reviewer.get(username, [])

        total_reviews = len(user_logs)
        payout_balance = user_data.get("payout_balance", 0.0)

        approvals = sum(1 for r in user_logs if r.get("action") == "approve")
        edits = sum(1 for r in user_logs if r.get("action") == "edit")
        skips = sum(1 for r in user_logs if r.get("action") == "skip")

        gold_items_reviewed = [
            item for item in items_reviewed
            if item.get("is_gold", False) or item.get("review_state", {}).get("is_gold", False)
        ]

        flags_submitted = sum(
            1 for item in items_reviewed
            if item.get("flagged", False)
            and any(f.get("reviewer_id") == username for f in item.get("flags", []))
        )

        review_times = [r.get("review_time", 0) for r in user_logs if r.get("review_time")]
        avg_review_time = sum(review_times) / len(review_times) if review_times else 0

        last_review_ts = max(
            [r.get("timestamp") for r in user_logs if r.get("timestamp")],
            default=None
        )

        reviewer_stats.append({
            "username": username,
            "email": user_data.get("email", ""),
            "roles": list(user_data.get("roles", [])),
            "languages": list(user_data.get("languages", [])),
            "total_reviews": total_reviews,
            "approvals": approvals,
            "edits": edits,
            "skips": skips,
            "flags_submitted": flags_submitted,
            "gold_items_reviewed": len(gold_items_reviewed),
            "total_earnings": round(payout_balance, 2),
            "avg_review_time_seconds": round(avg_review_time, 1),
            "last_review": last_review_ts,
            "is_active": user_data.get("is_active", True)
        })

    reviewer_stats.sort(key=lambda x: x["total_reviews"], reverse=True)
    return reviewer_stats


def compute_dataset_analytics_from_data(
    dataset_types: List[dict],
    dataset_items: List[dict],
    review_logs: List[dict]
) -> List[Dict[str, Any]]:
    """Aggregate dataset analytics using review logs and dataset items."""
    items_by_dataset = defaultdict(list)
    for item in dataset_items or []:
        dt_id = item.get("dataset_type_id")
        if dt_id:
            items_by_dataset[dt_id].append(item)

    logs_by_item = defaultdict(list)
    for log in review_logs or []:
        item_id = log.get("dataset_item_id")
        if item_id:
            logs_by_item[item_id].append(log)

    analytics: List[Dict[str, Any]] = []

    for dt in dataset_types:
        if not dt:
            continue

        dt_id = dt["_id"]
        all_items = items_by_dataset.get(dt_id, [])
        total_items = len(all_items)

        if total_items == 0:
            analytics.append({
                "dataset_type_id": dt_id,
                "name": dt.get("name", ""),
                "modality": dt.get("modality", "text"),
                "total_items": 0,
                "finalized_count": 0,
                "finalized_pct": 0,
                "gold_count": 0,
                "gold_pct": 0,
                "flagged_count": 0,
                "flagged_pct": 0,
                "avg_reviews_per_item": 0,
                "avg_skips_per_item": 0,
                "total_payout": 0,
                "unique_reviewers": 0,
                "skip_reasons": {},
                "payout_rate": dt.get("payout_rate", 0.002),
                "languages": list(dt.get("languages", [])),
            })
            continue

        item_ids = {i["_id"] for i in all_items if "_id" in i}
        logs_for_dt = [
            log for item_id in item_ids for log in logs_by_item.get(item_id, [])
        ]

        finalized_items = [i for i in all_items if i.get("review_state", {}).get("finalized", False)]
        gold_items = [
            i for i in all_items
            if i.get("is_gold", False) or i.get("review_state", {}).get("is_gold", False)
        ]
        flagged_items = [i for i in all_items if i.get("flagged", False)]

        log_review_count = len(logs_for_dt)
        review_count_state = sum(i.get("review_state", {}).get("review_count", 0) for i in all_items)
        total_reviews = log_review_count if log_review_count else review_count_state

        log_skip_count = sum(1 for log in logs_for_dt if log.get("action") == "skip")
        skip_count_state = sum(i.get("review_state", {}).get("skip_count", 0) for i in all_items)
        total_skips = log_skip_count if log_review_count else skip_count_state

        unique_reviewers = {
            log.get("reviewer_id") for log in logs_for_dt if log.get("reviewer_id")
        }
        if not unique_reviewers:
            for item in all_items:
                unique_reviewers.update(item.get("review_state", {}).get("reviewed_by", []))

        total_payout = round(
            sum(log.get("payout_amount", 0.0) or 0.0 for log in logs_for_dt),
            2
        )

        skip_reasons = defaultdict(int)
        for item in all_items:
            for feedback in item.get("skip_feedback", []):
                if feedback.get("feedback"):
                    skip_reasons[feedback["feedback"]] += 1

        analytics.append({
            "dataset_type_id": dt_id,
            "name": dt.get("name", ""),
            "modality": dt.get("modality", "text"),
            "languages": list(dt.get("languages", [])),
            "total_items": total_items,
            "finalized_count": len(finalized_items),
            "finalized_pct": round(len(finalized_items) / total_items * 100, 1),
            "gold_count": len(gold_items),
            "gold_pct": round(len(gold_items) / total_items * 100, 1) if total_items > 0 else 0,
            "flagged_count": len(flagged_items),
            "flagged_pct": round(len(flagged_items) / total_items * 100, 1) if total_items > 0 else 0,
            "avg_reviews_per_item": round(total_reviews / total_items, 2) if total_items > 0 else 0,
            "avg_skips_per_item": round(total_skips / total_items, 2) if total_items > 0 else 0,
            "total_payout": total_payout,
            "unique_reviewers": len(unique_reviewers),
            "skip_reasons": dict(skip_reasons),
            "payout_rate": dt.get("payout_rate", 0.002)
        })

    analytics.sort(key=lambda x: x["total_items"], reverse=True)
    return analytics


@router.get("/reviewers")
async def get_reviewer_stats(current_user: dict = Depends(get_operator_user)) -> List[Dict[str, Any]]:
    """
    Get comprehensive statistics for all reviewers.
    Returns review counts, accuracy, earnings, and activity metrics.
    """
    all_users = await users_db.get_all() or {}
    review_logs = await db_adapter.list_collection("review_logs") or []
    dataset_items = await db_adapter.list_collection("dataset_items") or []

    reviewer_stats = compute_reviewer_stats_from_data(all_users, review_logs, dataset_items)
    return reviewer_stats


@router.get("/datasets")
async def get_dataset_analytics(
    dataset_type_id: Optional[str] = None,
    current_user: dict = Depends(get_operator_user)
) -> List[Dict[str, Any]]:
    """
    Get comprehensive analytics for datasets.
    Returns progress, quality metrics, and performance data.
    """
    if dataset_type_id:
        dt = await db_adapter.get("dataset_types", dataset_type_id)
        if not dt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset type '{dataset_type_id}' not found"
            )
        dataset_types = [dt]
    else:
        dataset_types = await db_adapter.list_collection("dataset_types") or []

    dataset_items = await db_adapter.list_collection("dataset_items") or []
    review_logs = await db_adapter.list_collection("review_logs") or []

    if dataset_type_id:
        dataset_items = [
            item for item in dataset_items or []
            if item and item.get("dataset_type_id") == dataset_type_id
        ]
        review_logs = [
            log for log in review_logs or []
            if log and log.get("dataset_item_id") in {i.get("_id") for i in dataset_items}
        ]

    analytics = compute_dataset_analytics_from_data(dataset_types, dataset_items, review_logs)
    return analytics


@router.get("/flagged-items")
async def get_flagged_items(
    dataset_type_id: Optional[str] = None,
    language: Optional[str] = None,
    reason: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0,
    current_user: dict = Depends(get_operator_user)
) -> Dict[str, Any]:
    """
    Get all flagged items with filters for review.
    Returns flagged items with original content and reviewer feedback.
    """
    # Build predicate
    def predicate(item: dict) -> bool:
        if not item.get("flagged", False):
            return False
        
        if dataset_type_id and item.get("dataset_type_id") != dataset_type_id:
            return False
        
        if language and item.get("language") != language:
            return False
        
        if reason:
            # Check if any flag has this reason
            flags = item.get("flags", [])
            if not any(f.get("reason") == reason for f in flags):
                return False
        
        return True
    
    result = await db_adapter.query_collection(
        "dataset_items",
        filters={"dataset_type_id": dataset_type_id, "language": language, "flagged": True},
        sort_by="created_at",
        sort_dir="desc",
        limit=limit,
        offset=offset
    )

    flagged_items = result["items"]
    total_count = result["total"]

    # Enrich with dataset type name
    enriched_items = []
    for item in flagged_items:
        dt_id = item.get("dataset_type_id")
        dt = await db_adapter.get("dataset_types", dt_id)
        flags = list(item.get("flags", []))
        if reason:
            flags = [f for f in flags if f.get("reason") == reason]
            if not flags:
                continue
        enriched_items.append({
            "_id": item["_id"],
            "dataset_type_id": dt_id,
            "dataset_type_name": dt.get("name") if dt else "Unknown",
            "modality": dt.get("modality", "text") if dt else "text",
            "language": item.get("language"),
            "content": item.get("content", {}),
            "flags": flags,
            "review_state": item.get("review_state", {}),
            "created_at": item.get("created_at"),
            "flagged_at": max([f.get("timestamp", "") for f in flags], default=None)
        })
    
    return {
        "items": enriched_items,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total_count
    }
