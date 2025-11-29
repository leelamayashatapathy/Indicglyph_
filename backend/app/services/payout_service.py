"""Payout service for handling user payouts."""
import logging
from typing import List, Optional
from datetime import datetime
from backend.app.db_adapter import payouts_db, users_db
from backend.app.models.payout_model import Payout, PayoutStatus
from backend.app.models.user_model import User
from backend.app.config import config

logger = logging.getLogger(__name__)


class PayoutService:
    """Service for managing payouts."""
    
    @staticmethod
    async def _load_and_normalize_user(username: str) -> User:
        """Load user, normalize payout fields, and persist if needed."""
        user_data = await users_db.get(username)
        if not user_data:
            raise ValueError("User not found")

        normalized = User.normalize_payout_fields(user_data)
        if normalized != user_data:
            logger.warning("Persisting normalized payout fields for user %s", username)
            await users_db.set(username, normalized)

        return User.from_dict(normalized)

    @staticmethod
    async def create_payout_request(username: str, amount: float, payment_method: str = "bank_transfer") -> Payout:
        """Create a new payout request."""
        user = await PayoutService._load_and_normalize_user(username)
        
        # Check balance
        if user.payout_balance < amount:
            raise ValueError(f"Insufficient balance. Available: {user.payout_balance}")
        
        # Check minimum threshold
        if amount < config.MIN_PAYOUT_THRESHOLD:
            raise ValueError(f"Minimum payout amount is {config.MIN_PAYOUT_THRESHOLD}")
        
        # Create payout
        payout = Payout(
            username=username,
            amount=amount,
            payment_method=payment_method
        )
        
        # Deduct from user payout_balance
        user.payout_balance -= amount
        await users_db.set(username, user.to_dict())
        
        # Save payout
        await payouts_db.set(payout.payout_id, payout.to_dict())
        
        return payout
    
    @staticmethod
    async def get_payout(payout_id: str) -> Optional[Payout]:
        """Get payout by ID."""
        payout_data = await payouts_db.get(payout_id)
        if payout_data:
            return Payout.from_dict(payout_data)
        return None
    
    @staticmethod
    async def list_user_payouts(username: str) -> List[Payout]:
        """List all payouts for a user."""
        all_payouts = await payouts_db.get_all()
        user_payouts = []
        
        for payout_data in all_payouts.values():
            if payout_data.get("username") == username:
                user_payouts.append(Payout.from_dict(payout_data))
        
        return sorted(user_payouts, key=lambda p: p.requested_at, reverse=True)
    
    @staticmethod
    async def list_all_payouts(status: Optional[str] = None) -> List[Payout]:
        """List all payouts, optionally filtered by status."""
        all_payouts = await payouts_db.get_all()
        payouts = []
        
        for payout_data in all_payouts.values():
            if status is None or payout_data.get("status") == status:
                payouts.append(Payout.from_dict(payout_data))
        
        return sorted(payouts, key=lambda p: p.requested_at, reverse=True)
    
    @staticmethod
    async def process_payout(payout_id: str, status: str, notes: Optional[str] = None) -> Payout:
        """Process a payout (admin only)."""
        payout = await PayoutService.get_payout(payout_id)
        if not payout:
            raise ValueError("Payout not found")
        
        payout.status = status
        payout.processed_at = datetime.utcnow().isoformat()
        if notes:
            payout.notes = notes
        
        # If failed or cancelled, refund user balance
        if status in [PayoutStatus.FAILED.value, PayoutStatus.CANCELLED.value]:
            try:
                user = await PayoutService._load_and_normalize_user(payout.username)
                user.payout_balance += payout.amount
                await users_db.set(payout.username, user.to_dict())
            except ValueError:
                logger.error("Unable to refund payout for missing user %s", payout.username)
        
        await payouts_db.set(payout_id, payout.to_dict())
        return payout
