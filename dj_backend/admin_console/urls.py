from django.urls import path
from .views import (
    UserListView,
    UserUpdateView,
    UserDeleteView,
    PayoutListView,
    process_payout,
    get_system_config,
    update_system_config,
    get_operator_stats,
    DatasetTypeCreateView,
    DatasetTypeListView,
    DatasetTypeDetailView,
    DatasetItemListView,
    export_dataset_items,
    migrate_item_numbers,
)
from .bulk_upload_views import bulk_upload_zip

app_name = 'operator'

urlpatterns = [
    # Users
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<str:username>/', UserUpdateView.as_view(), name='user-update'),
    path('users/<str:username>/delete/', UserDeleteView.as_view(), name='user-delete'),
    
    # Payouts
    path('payouts/', PayoutListView.as_view(), name='payout-list'),
    path('payouts/<str:payout_id>/process/', process_payout, name='payout-process'),
    
    # Stats
    path('stats/', get_operator_stats, name='stats'),
    
    # System Config
    path('system-config/', get_system_config, name='system-config-get'),
    path('system-config/update/', update_system_config, name='system-config-update'),
    
    # Dataset Types
    path('dataset-type/', DatasetTypeCreateView.as_view(), name='dataset-type-create'),
    path('dataset-type/list/', DatasetTypeListView.as_view(), name='dataset-type-list'),
    path('dataset-type/<uuid:id>/', DatasetTypeDetailView.as_view(), name='dataset-type-detail'),
    
    # Dataset Items
    path('dataset-items/', DatasetItemListView.as_view(), name='dataset-items-list'),
    path('export/', export_dataset_items, name='export'),
    path('migrate-item-numbers/', migrate_item_numbers, name='migrate-item-numbers'),
    path('items/bulk-upload-zip/', bulk_upload_zip, name='bulk-upload-zip'),
]

