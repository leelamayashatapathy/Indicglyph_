from typing import Any, TypedDict, Literal, cast

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count, Sum

from datasets.models import DatasetItem, DatasetType
from .models import ReviewLog, SystemConfig
from .serializers import ReviewSubmitSerializer, ReviewLogSerializer, FlagItemSerializer


class ReviewSubmitData(TypedDict):
    item_id: Any
    action: Literal["approve", "edit", "skip"]
    changes: dict[str, Any] | None
    skip_data_correct: bool
    skip_feedback: str | None


class FlagItemData(TypedDict):
    item_id: Any
    reason: Literal["offensive", "corrupt", "unclear", "other"]
    note: str | None


class SubmitReviewView(APIView):
    """Submit a review: approve/edit/skip."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ReviewSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = cast(ReviewSubmitData, serializer.validated_data)
        item_id = data["item_id"]
        action = data["action"]
        changes = data.get("changes")
        skip_data_correct = data.get("skip_data_correct", False)
        skip_feedback = data.get("skip_feedback")
        
        # Get item
        item = get_object_or_404(DatasetItem, id=item_id)
        
        # Get system config
        config = SystemConfig.get_config()
        payout_rate_default = float(config.payout_rate_default)
        skip_threshold_default = config.skip_threshold_default
        
        # Calculate payout
        payout_amount = 0.0
        if action in ['approve', 'edit']:
            # Get dataset type payout rate
            dataset_type = item.dataset_type
            payout_rate = float(dataset_type.payout_rate) if dataset_type.payout_rate else payout_rate_default
            payout_amount = payout_rate
        
        with transaction.atomic():
            # Update item
            if action == 'edit' and changes:
                # Merge changes into content
                item.content.update(changes)
            
            # Update review state
            if action == 'skip':
                item.skip_count += 1
                if skip_data_correct:
                    item.correct_skips += 1
                else:
                    item.unchecked_skips += 1
                
                # Add skip feedback
                if skip_feedback:
                    item.skip_feedback.append({
                        'reviewer': request.user.username,
                        'feedback': skip_feedback,
                        'data_correct': skip_data_correct,
                        'timestamp': timezone.now().isoformat()
                    })
            else:
                item.review_count += 1
                if request.user.username not in item.reviewed_by:
                    item.reviewed_by.append(request.user.username)
            
            # Check finalization
            if item.review_count >= config.finalize_review_count:
                item.finalized = True
                item.review_status = 'finalized'
            elif item.skip_count >= skip_threshold_default:
                item.finalized = True
                item.review_status = 'finalized'
            elif item.correct_skips >= config.gold_skip_correct_threshold:
                item.finalized = True
                item.is_gold = True
                item.review_status = 'finalized'
            
            # Release lock
            item.lock_owner = None
            item.lock_time = None
            if not item.finalized:
                item.review_status = 'pending'
            
            item.save()
            
            # Create review log
            review_log = ReviewLog.objects.create(
                reviewer=request.user,
                dataset_item=item,
                action=action,
                changes=changes or {},
                payout_amount=payout_amount,
                skip_data_correct=skip_data_correct,
                skip_feedback=skip_feedback
            )
            
            # Update user balance and reviews_done
            if payout_amount > 0:
                request.user.payout_balance += payout_amount
                request.user.reviews_done += 1
                request.user.save(update_fields=['payout_balance', 'reviews_done'])
        
        return Response({
            'success': True,
            'message': f'Review {action}ed successfully',
            'item_id': str(item.id),
            'payout_amount': float(payout_amount),
            'finalized': item.finalized
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_review_stats(request):
    """Get current user's review statistics."""
    review_logs = ReviewLog.objects.filter(reviewer=request.user)
    total_reviews = review_logs.count()
    approved_count = review_logs.filter(action='approve').count()
    edited_count = review_logs.filter(action='edit').count()
    skipped_count = review_logs.filter(action='skip').count()
    total_earnings = sum(float(log.payout_amount) for log in review_logs)
    
    return Response({
        'total_reviews': total_reviews,
        'approved': approved_count,
        'edited': edited_count,
        'skipped': skipped_count,
        'total_earnings': total_earnings
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_reviews(request):
    """Get current user's review history."""
    review_logs = ReviewLog.objects.filter(reviewer=request.user).order_by('-timestamp')
    serializer = ReviewLogSerializer(review_logs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def flag_item(request):
    """Flag an item as suspicious or inappropriate."""
    serializer = FlagItemSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = cast(FlagItemData, serializer.validated_data)
    item_id = data["item_id"]
    reason = data["reason"]
    note = data.get("note", "")
    
    item = get_object_or_404(DatasetItem, id=item_id)
    
    # Mark as flagged
    item.flagged = True
    
    # Add flag log
    flag_log = {
        'item_id': str(item.id),
        'user_id': request.user.username,
        'reason': reason,
        'note': note,
        'timestamp': timezone.now().isoformat()
    }
    
    flags = item.flags or []
    flags.append(flag_log)
    item.flags = flags
    item.save()
    
    return Response({
        'success': True,
        'message': 'Item flagged successfully',
        'item_id': str(item.id),
        'flagged': True
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assigned_datasets(request):
    """Get assigned dataset types for the current reviewer."""
    user = request.user
    user_languages = user.languages or ['en']
    
    # Get all active dataset types
    dataset_types = DatasetType.objects.filter(active=True)
    
    assigned_datasets = []
    
    for dt in dataset_types:
        dt_languages = dt.languages or ['en']
        
        # Check if there's a language overlap
        if any(lang in user_languages for lang in dt_languages):
            # Get stats for this dataset type
            all_items = DatasetItem.objects.filter(dataset_type=dt)
            user_reviewed = DatasetItem.objects.filter(
                dataset_type=dt,
                reviewed_by__contains=[user.username]
            )
            
            # Calculate stats
            total_items = all_items.count()
            items_reviewed = user_reviewed.count()
            
            # Calculate user earnings from this dataset
            payout_rate = float(dt.payout_rate) if dt.payout_rate else 0.002
            user_earnings = items_reviewed * payout_rate
            
            # Calculate progress percentage
            progress_pct = (items_reviewed / total_items * 100) if total_items > 0 else 0
            
            assigned_datasets.append({
                '_id': str(dt.id),
                'name': dt.name,
                'description': dt.description or '',
                'modality': dt.modality,
                'languages': dt_languages,
                'payout_rate': float(payout_rate),
                'total_items': total_items,
                'items_reviewed': items_reviewed,
                'progress_pct': round(progress_pct, 1),
                'user_earnings': round(user_earnings, 3),
                'review_guidelines': dt.review_guidelines
            })
    
    # Sort by progress (least complete first)
    assigned_datasets.sort(key=lambda x: x['progress_pct'])
    
    return Response(assigned_datasets)
