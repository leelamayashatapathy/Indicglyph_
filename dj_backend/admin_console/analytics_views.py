from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.http import HttpResponse

from users.models import User
from datasets.models import DatasetType, DatasetItem
from reviews.models import ReviewLog
from .permissions import IsPlatformOperator


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def get_reviewer_analytics(request):
    """Get reviewer analytics."""
    reviewers = User.objects.filter(
        Q(roles__contains=['reviewer']) | Q(roles__contains=['user'])
    ).annotate(
        total_reviews=Count('review_logs'),
        total_earnings=Sum('review_logs__payout_amount')
    )
    
    data = []
    for reviewer in reviewers:
        data.append({
            'username': reviewer.username,
            'email': reviewer.email,
            'total_reviews': reviewer.total_reviews or 0,
            'total_earnings': float(reviewer.total_earnings or 0),
            'payout_balance': float(reviewer.payout_balance),
            'reviews_done': reviewer.reviews_done
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def get_dataset_analytics(request):
    """Get dataset analytics."""
    dataset_types = DatasetType.objects.all()
    
    data = []
    for dt in dataset_types:
        items = DatasetItem.objects.filter(dataset_type=dt)
        total_items = items.count()
        finalized_items = items.filter(finalized=True).count()
        pending_items = items.filter(review_status='pending', finalized=False).count()
        flagged_items = items.filter(flagged=True).count()
        
        data.append({
            'dataset_type_id': str(dt.id),
            'name': dt.name,
            'modality': dt.modality,
            'total_items': total_items,
            'finalized_items': finalized_items,
            'pending_items': pending_items,
            'flagged_items': flagged_items,
            'completion_rate': round((finalized_items / total_items * 100) if total_items > 0 else 0, 2)
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def get_flagged_items(request):
    """Get flagged items."""
    items = DatasetItem.objects.filter(flagged=True).select_related('dataset_type')
    
    data = []
    for item in items:
        data.append({
            '_id': str(item.id),
            'dataset_type_id': str(item.dataset_type.id),
            'dataset_type_name': item.dataset_type.name,
            'language': item.language,
            'content': item.content,
            'flags': item.flags or [],
            'review_status': item.review_status,
            'finalized': item.finalized
        })
    
    return Response(data)

