from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, F
from django.http import StreamingHttpResponse
from django.utils import timezone
import csv
import json
import io

from users.models import User
from datasets.models import DatasetType, DatasetItem
from reviews.models import Payout, SystemConfig, ReviewLog
from datasets.serializers import DatasetTypeSerializer, DatasetItemSerializer, DatasetItemCreateSerializer
from users.serializers import UserSerializer
from .permissions import IsPlatformOperator


# User Management
class UserListView(generics.ListAPIView):
    """List all users (platform operator only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsPlatformOperator]


class UserUpdateView(generics.UpdateAPIView):
    """Update user (platform operator only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsPlatformOperator]
    lookup_field = 'username'
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        current_user = request.user
        
        # Prevent self-privilege downgrade
        if user.username == current_user.username:
            new_roles = request.data.get('roles', [])
            current_roles = current_user.roles or []
            
            if ('platform_operator' in current_roles or 'super_operator' in current_roles):
                if 'platform_operator' not in new_roles and 'super_operator' not in new_roles:
                    return Response(
                        {'detail': 'Cannot remove platform operator privileges from your own account.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        return super().update(request, *args, **kwargs)


class UserDeleteView(generics.DestroyAPIView):
    """Delete user (platform operator only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsPlatformOperator]
    lookup_field = 'username'


# Payout Management
class PayoutListView(generics.ListAPIView):
    """List all payouts (platform operator only)."""
    permission_classes = [IsAuthenticated, IsPlatformOperator]
    
    def get_queryset(self):
        queryset = Payout.objects.select_related('user').all()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        payouts = []
        for payout in queryset:
            payouts.append({
                'payout_id': payout.payout_id,
                'username': payout.user.username,
                'amount': float(payout.amount),
                'status': payout.status,
                'payment_method': payout.payment_method,
                'requested_at': payout.requested_at.isoformat(),
                'processed_at': payout.processed_at.isoformat() if payout.processed_at else None,
                'notes': payout.notes
            })
        return Response(payouts)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def process_payout(request, payout_id):
    """Process a payout (platform operator only)."""
    payout = get_object_or_404(Payout, payout_id=payout_id)
    new_status = request.data.get('status')
    notes = request.data.get('notes', '')
    
    if new_status not in ['processing', 'completed', 'failed', 'cancelled']:
        return Response(
            {'detail': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    payout.status = new_status
    if new_status in ['completed', 'failed', 'cancelled']:
        payout.processed_at = timezone.now()
    payout.notes = notes
    payout.save()
    
    # If cancelled or failed, refund the amount
    if new_status in ['cancelled', 'failed']:
        payout.user.payout_balance += payout.amount
        payout.user.save(update_fields=['payout_balance'])
    
    return Response({
        'payout_id': payout.payout_id,
        'username': payout.user.username,
        'amount': float(payout.amount),
        'status': payout.status,
        'payment_method': payout.payment_method,
        'requested_at': payout.requested_at.isoformat(),
        'processed_at': payout.processed_at.isoformat() if payout.processed_at else None,
        'notes': payout.notes
    })


# System Config
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def get_system_config(request):
    """Get system configuration."""
    config = SystemConfig.get_config()
    
    # Ensure available_languages exists
    if not config.available_languages:
        config.available_languages = [
            {"code": "en", "name": "English"},
            {"code": "hi", "name": "Hindi"},
            {"code": "es", "name": "Spanish"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
            {"code": "zh", "name": "Chinese"},
            {"code": "ar", "name": "Arabic"},
            {"code": "bn", "name": "Bengali"},
            {"code": "mr", "name": "Marathi"},
            {"code": "ta", "name": "Tamil"},
            {"code": "te", "name": "Telugu"},
            {"code": "gu", "name": "Gujarati"},
            {"code": "kn", "name": "Kannada"},
            {"code": "ml", "name": "Malayalam"},
            {"code": "pa", "name": "Punjabi"},
            {"code": "or", "name": "Odia"},
        ]
        config.save()
    
    return Response({
        'payout_rate_default': float(config.payout_rate_default),
        'skip_threshold_default': config.skip_threshold_default,
        'lock_timeout_sec': config.lock_timeout_sec,
        'finalize_review_count': config.finalize_review_count,
        'gold_skip_correct_threshold': config.gold_skip_correct_threshold,
        'max_unchecked_skips_before_prompt': config.max_unchecked_skips_before_prompt,
        'available_languages': config.available_languages
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def update_system_config(request):
    """Update system configuration."""
    config = SystemConfig.get_config()
    
    # Update fields
    if 'payout_rate_default' in request.data:
        config.payout_rate_default = request.data['payout_rate_default']
    if 'skip_threshold_default' in request.data:
        config.skip_threshold_default = request.data['skip_threshold_default']
    if 'lock_timeout_sec' in request.data:
        config.lock_timeout_sec = request.data['lock_timeout_sec']
    if 'finalize_review_count' in request.data:
        config.finalize_review_count = request.data['finalize_review_count']
    if 'gold_skip_correct_threshold' in request.data:
        config.gold_skip_correct_threshold = request.data['gold_skip_correct_threshold']
    if 'max_unchecked_skips_before_prompt' in request.data:
        config.max_unchecked_skips_before_prompt = request.data['max_unchecked_skips_before_prompt']
    if 'available_languages' in request.data:
        config.available_languages = request.data['available_languages']
    
    config.save()
    
    return Response({
        'payout_rate_default': float(config.payout_rate_default),
        'skip_threshold_default': config.skip_threshold_default,
        'lock_timeout_sec': config.lock_timeout_sec,
        'finalize_review_count': config.finalize_review_count,
        'gold_skip_correct_threshold': config.gold_skip_correct_threshold,
        'max_unchecked_skips_before_prompt': config.max_unchecked_skips_before_prompt,
        'available_languages': config.available_languages
    })


# Stats
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def get_operator_stats(request):
    """Get platform statistics."""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_balance = User.objects.aggregate(total=Sum('payout_balance'))['total'] or 0
    total_reviews = User.objects.aggregate(total=Sum('reviews_done'))['total'] or 0
    
    # Queue stats
    pending_items = DatasetItem.objects.filter(review_status='pending', finalized=False).count()
    in_review_items = DatasetItem.objects.filter(review_status='in_review', finalized=False).count()
    finalized_items = DatasetItem.objects.filter(finalized=True).count()
    
    return Response({
        'users': {
            'total': total_users,
            'active': active_users
        },
        'queue': {
            'pending': pending_items,
            'in_review': in_review_items,
            'finalized': finalized_items
        },
        'totals': {
            'total_balance_outstanding': float(total_balance),
            'total_reviews_completed': total_reviews
        }
    })


# Dataset Type Management (already in datasets app, but need operator endpoints)
class DatasetTypeCreateView(generics.CreateAPIView):
    """Create dataset type (platform operator only)."""
    queryset = DatasetType.objects.all()
    serializer_class = DatasetTypeSerializer
    permission_classes = [IsAuthenticated, IsPlatformOperator]


class DatasetTypeListView(generics.ListAPIView):
    """List dataset types (platform operator only)."""
    queryset = DatasetType.objects.all()
    serializer_class = DatasetTypeSerializer
    permission_classes = [IsAuthenticated, IsPlatformOperator]


class DatasetTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get/Update/Delete dataset type (platform operator only)."""
    queryset = DatasetType.objects.all()
    serializer_class = DatasetTypeSerializer
    permission_classes = [IsAuthenticated, IsPlatformOperator]
    lookup_field = 'id'


# Dataset Items Management
class DatasetItemListView(generics.ListAPIView):
    """List dataset items with filters (platform operator only)."""
    serializer_class = DatasetItemSerializer
    permission_classes = [IsAuthenticated, IsPlatformOperator]
    
    def get_queryset(self):
        queryset = DatasetItem.objects.select_related('dataset_type').all()
        
        dataset_type_id = self.request.query_params.get('dataset_type_id')
        language = self.request.query_params.get('language')
        status_filter = self.request.query_params.get('status')
        finalized = self.request.query_params.get('finalized')
        
        if dataset_type_id:
            queryset = queryset.filter(dataset_type_id=dataset_type_id)
        if language:
            queryset = queryset.filter(language=language)
        if status_filter:
            queryset = queryset.filter(review_status=status_filter)
        if finalized is not None:
            queryset = queryset.filter(finalized=finalized.lower() == 'true')
        
        return queryset


# Export
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def export_dataset_items(request):
    """Export dataset items to CSV/JSONL."""
    format_type = request.data.get('format', 'csv')
    dataset_type_id = request.data.get('dataset_type_id')
    language = request.data.get('language')
    finalized = request.data.get('finalized')
    
    queryset = DatasetItem.objects.select_related('dataset_type').all()
    
    if dataset_type_id:
        queryset = queryset.filter(dataset_type_id=dataset_type_id)
    if language:
        queryset = queryset.filter(language=language)
    if finalized is not None:
        queryset = queryset.filter(finalized=finalized.lower() == 'true')
    
    if format_type == 'csv':
        response = StreamingHttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="dataset_items.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['id', 'item_number', 'dataset_type', 'language', 'content', 'status', 'finalized'])
        
        for item in queryset[:10000]:  # Limit to 10k rows
            writer.writerow([
                str(item.id),
                item.item_number or '',
                item.dataset_type.name,
                item.language,
                json.dumps(item.content),
                item.review_status,
                item.finalized
            ])
        
        return response
    
    else:  # JSONL
        response = StreamingHttpResponse(content_type='application/jsonl')
        response['Content-Disposition'] = 'attachment; filename="dataset_items.jsonl"'
        
        for item in queryset[:10000]:
            data = {
                '_id': str(item.id),
                'item_number': item.item_number,
                'dataset_type_id': str(item.dataset_type.id),
                'language': item.language,
                'content': item.content,
                'review_status': item.review_status,
                'finalized': item.finalized
            }
            response.write(json.dumps(data) + '\n')
        
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def migrate_item_numbers(request):
    """Migrate item numbers for existing items."""
    from django.db import transaction
    
    dataset_type_id = request.data.get('dataset_type_id')
    
    if dataset_type_id:
        dataset_type = get_object_or_404(DatasetType, id=dataset_type_id)
        items = DatasetItem.objects.filter(dataset_type=dataset_type).order_by('created_at')
    else:
        items = DatasetItem.objects.all().order_by('created_at')
    
    updated_count = 0
    
    with transaction.atomic():
        # Group by dataset type
        current_numbers = {}
        
        for item in items:
            dt_id = str(item.dataset_type.id)
            if dt_id not in current_numbers:
                current_numbers[dt_id] = 0
            
            current_numbers[dt_id] += 1
            item.item_number = current_numbers[dt_id]
            item.save(update_fields=['item_number'])
            updated_count += 1
    
    return Response({
        'message': f'Migrated {updated_count} item numbers',
        'updated_count': updated_count
    })
