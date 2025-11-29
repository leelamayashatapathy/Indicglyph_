"""Unit tests for analytics aggregation helpers (not executed here)."""
import os
import sys

# Ensure project root is on sys.path for absolute imports when running tests directly.
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.routes.routes_analytics import (
    compute_reviewer_stats_from_data,
    compute_dataset_analytics_from_data,
)


def test_reviewer_stats_use_review_logs_and_payout_balance():
    users = {
        "alice": {
            "username": "alice",
            "email": "alice@example.com",
            "roles": ["reviewer"],
            "languages": ["en"],
            "payout_balance": 1.5,
        }
    }
    review_logs = [
        {
            "reviewer_id": "alice",
            "dataset_item_id": "item1",
            "action": "approve",
            "payout_amount": 0.2,
            "timestamp": "2025-01-01T00:00:00Z",
        },
        {
            "reviewer_id": "alice",
            "dataset_item_id": "item1",
            "action": "skip",
            "payout_amount": 0.0,
            "timestamp": "2025-01-02T00:00:00Z",
        },
    ]
    dataset_items = [
        {
            "_id": "item1",
            "review_state": {"reviewed_by": ["alice"], "is_gold": True},
            "flagged": True,
            "flags": [{"reviewer_id": "alice", "reason": "format"}],
        }
    ]

    stats = compute_reviewer_stats_from_data(users, review_logs, dataset_items)
    assert stats[0]["username"] == "alice"
    assert stats[0]["total_reviews"] == 2
    assert stats[0]["skips"] == 1
    assert stats[0]["total_earnings"] == 1.5
    assert stats[0]["gold_items_reviewed"] == 1
    assert stats[0]["flags_submitted"] == 1


def test_dataset_analytics_use_logs_for_payouts_and_counts():
    dataset_types = [
        {
            "_id": "dt1",
            "name": "Test DT",
            "modality": "text",
            "payout_rate": 0.5,
            "languages": ["en"],
        }
    ]
    dataset_items = [
        {
            "_id": "item1",
            "dataset_type_id": "dt1",
            "review_state": {"review_count": 1, "skip_count": 0, "reviewed_by": ["alice"]},
            "flagged": False,
            "skip_feedback": [],
        },
        {
            "_id": "item2",
            "dataset_type_id": "dt1",
            "review_state": {"review_count": 0, "skip_count": 2, "reviewed_by": []},
            "flagged": False,
            "skip_feedback": [],
        },
    ]
    review_logs = [
        {"dataset_item_id": "item1", "reviewer_id": "alice", "action": "approve", "payout_amount": 0.3},
        {"dataset_item_id": "item1", "reviewer_id": "bob", "action": "skip", "payout_amount": 0.0},
    ]

    analytics = compute_dataset_analytics_from_data(dataset_types, dataset_items, review_logs)
    assert len(analytics) == 1
    stats = analytics[0]
    assert stats["total_items"] == 2
    assert stats["total_payout"] == 0.3
    assert stats["unique_reviewers"] == 2
    assert stats["avg_reviews_per_item"] == round(len(review_logs) / 2, 2)
    assert stats["avg_skips_per_item"] == round(1 / 2, 2)
