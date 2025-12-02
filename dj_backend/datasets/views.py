from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import DatasetType, DatasetItem
from .serializers import (
    DatasetTypeSerializer,
    DatasetItemSerializer,
    DatasetItemCreateSerializer
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


# DatasetType Views
class DatasetTypeListCreateView(generics.ListCreateAPIView):
    """List all dataset types or create a new one."""
    queryset = DatasetType.objects.all()
    serializer_class = DatasetTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = DatasetType.objects.all()
        active = self.request.query_params.get('active', None)
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        return queryset


class DatasetTypeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a dataset type."""
    queryset = DatasetType.objects.all()
    serializer_class = DatasetTypeSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


# DatasetItem Views
class DatasetItemListCreateView(generics.ListCreateAPIView):
    """List all dataset items or create a new one."""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DatasetItemCreateSerializer
        return DatasetItemSerializer
    
    def get_queryset(self):
        queryset = DatasetItem.objects.select_related('dataset_type').all()
        
        # Filtering
        dataset_type_id = self.request.query_params.get('dataset_type_id', None)
        language = self.request.query_params.get('language', None)
        status = self.request.query_params.get('status', None)
        finalized = self.request.query_params.get('finalized', None)
        
        if dataset_type_id:
            queryset = queryset.filter(dataset_type_id=dataset_type_id)
        if language:
            queryset = queryset.filter(language=language)
        if status:
            queryset = queryset.filter(review_status=status)
        if finalized is not None:
            queryset = queryset.filter(finalized=finalized.lower() == 'true')
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            DatasetItemSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class DatasetItemRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a dataset item."""
    queryset = DatasetItem.objects.select_related('dataset_type').all()
    serializer_class = DatasetItemSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


class NextDatasetItemView(APIView):
    """Get next dataset item for review (POST for claiming)."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Claim next available item."""
        languages = request.data.get('languages', [])
        dataset_type_id = request.data.get('dataset_type_id', None)
        
        # Build query
        query = Q(finalized=False) & ~Q(reviewed_by__contains=[request.user.username])
        
        if languages:
            query &= Q(language__in=languages)
        if dataset_type_id:
            query &= Q(dataset_type_id=dataset_type_id)
        
        # Get pending or stale in_review items
        query &= (Q(review_status='pending') | 
                 (Q(review_status='in_review') & Q(lock_time__isnull=True)))
        
        item = DatasetItem.objects.filter(query).order_by('created_at').first()
        
        if not item:
            return Response(
                {'detail': 'No items available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Lock the item
        from django.utils import timezone
        item.review_status = 'in_review'
        item.lock_owner = request.user.username
        item.lock_time = timezone.now()
        item.save()
        
        serializer = DatasetItemSerializer(item)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_dataset_stats(request):
    """Get dataset/queue statistics."""
    languages = request.query_params.get('langs', '').split(',') if request.query_params.get('langs') else None
    languages = [lang.strip() for lang in languages if lang.strip()] if languages else None
    
    queryset = DatasetItem.objects.filter(finalized=False)
    
    if languages:
        queryset = queryset.filter(language__in=languages)
    
    pending = queryset.filter(review_status='pending').count()
    in_review = queryset.filter(review_status='in_review').count()
    total = queryset.count()
    
    return Response({
        'pending': pending,
        'in_review': in_review,
        'total': total,
        'languages': languages or []
    })
