"""
Migration helper to consolidate legacy `balance` fields into `payout_balance`.

This is intentionally not executed automatically. A human operator can run:
`python -m backend.scripts.migrate_payout_balance`
to normalize all users. The function is idempotent and safe to re-run.
"""
import asyncio
import logging
from typing import Tuple

from backend.app.db_adapter import users_db
from backend.app.models.user_model import User

logger = logging.getLogger(__name__)


async def migrate_payout_balance() -> Tuple[int, int]:
    """
    Scan all users, fold legacy `balance` into `payout_balance`, and persist.

    Returns:
        Tuple of (total_users_seen, users_updated)
    """
    all_users = await users_db.get_all()
    total_seen = 0
    updated = 0

    for username, user_data in (all_users or {}).items():
        if not user_data:
            continue

        total_seen += 1
        normalized = User.normalize_payout_fields(user_data)

        if normalized != user_data:
            await users_db.set(username, normalized)
            updated += 1
            logger.info("Normalized payout fields for user %s", username)

    logger.info("Payout balance migration complete. Total: %s, Updated: %s", total_seen, updated)
    return total_seen, updated


if __name__ == "__main__":
    # Manual execution entrypoint; do not call automatically in production pipelines.
    asyncio.run(migrate_payout_balance())
