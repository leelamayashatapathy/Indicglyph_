from django.urls import path
from .views import (
    DatasetTypeListCreateView,
    DatasetTypeRetrieveUpdateDestroyView,
    DatasetItemListCreateView,
    DatasetItemRetrieveUpdateDestroyView,
    NextDatasetItemView,
    get_dataset_stats,
)

app_name = 'datasets'

urlpatterns = [
    # Dataset Types
    path('types/', DatasetTypeListCreateView.as_view(), name='dataset-type-list'),
    path('types/<uuid:id>/', DatasetTypeRetrieveUpdateDestroyView.as_view(), name='dataset-type-detail'),
    path('type/<uuid:id>/', DatasetTypeRetrieveUpdateDestroyView.as_view(), name='dataset-type-detail-alt'),
    
    # Dataset Items
    path('items/', DatasetItemListCreateView.as_view(), name='dataset-item-list'),
    path('items/<uuid:id>/', DatasetItemRetrieveUpdateDestroyView.as_view(), name='dataset-item-detail'),
    path('next/', NextDatasetItemView.as_view(), name='next-item'),
    path('stats/', get_dataset_stats, name='stats'),
]

