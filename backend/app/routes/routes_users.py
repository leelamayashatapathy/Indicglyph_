"""User routes."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

from backend.app.models.user_model import UserResponse, User
from backend.app.models.payout_model import PayoutRequest, PayoutResponse, Payout
from backend.app.db_adapter import users_db, db_adapter
from backend.app.routes.routes_auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/balance")
async def get_my_balance(current_user: dict = Depends(get_current_user)):
    """Get current user's balance."""
    user_data = await users_db.get(current_user["username"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    normalized = User.normalize_payout_fields(user_data)
    if normalized != user_data:
        await users_db.set(current_user["username"], normalized)
    
    payout_balance = normalized.get("payout_balance", 0.0)

    return {
        "username": normalized["username"],
        "payout_balance": payout_balance,
        "balance": payout_balance,
        "reviews_completed": normalized.get("reviews_done", 0)
    }


@router.get("/me/stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
    """Get current user's statistics."""
    from backend.app.services.review_service import ReviewService
    
    stats = await ReviewService.get_user_stats(current_user["username"])
    user_data = await users_db.get(current_user["username"])
    user_data = User.normalize_payout_fields(user_data or {})
    if user_data:
        await users_db.set(current_user["username"], user_data)

    return {
        **stats,
        "payout_balance": user_data.get("payout_balance", 0.0),
        "balance": user_data.get("payout_balance", 0.0)
    }


@router.get("/{username}", response_model=UserResponse)
async def get_user(username: str, current_user: dict = Depends(get_current_user)):
    """Get user by username (authenticated users only)."""
    user_data = await users_db.get(username)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**user_data)


@router.post("/request-payout", response_model=PayoutResponse, status_code=status.HTTP_201_CREATED)
async def request_payout(
    payout_request: PayoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Request a payout (reviewer)."""
    # Get user balance
    user_data = await users_db.get(current_user["username"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    normalized = User.normalize_payout_fields(user_data)
    if normalized != user_data:
        await users_db.set(current_user["username"], normalized)
    
    balance = normalized.get("payout_balance", 0.0)
    
    # Check if sufficient balance
    if balance < payout_request.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: ${balance:.2f}, Requested: ${payout_request.amount:.2f}"
        )
    
    # Create payout
    payout = Payout(
        username=current_user["username"],
        amount=payout_request.amount,
        payment_method=payout_request.payment_method or "bank_transfer",
        payment_details=payout_request.payment_details
    )
    
    # Save payout
    await db_adapter.insert("payouts", payout.to_dict())
    
    # Deduct from user balance (reserve it)
    normalized["payout_balance"] = balance - payout_request.amount
    await users_db.set(current_user["username"], normalized)
    
    return PayoutResponse(**payout.to_dict())
