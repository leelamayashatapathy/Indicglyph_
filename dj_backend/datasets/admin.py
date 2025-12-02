from django.contrib import admin
from .models import DatasetType, DatasetItem


@admin.register(DatasetType)
class DatasetTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'modality', 'active', 'created_at')
    list_filter = ('modality', 'active', 'created_at')
    search_fields = ('name', 'description')


@admin.register(DatasetItem)
class DatasetItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'dataset_type', 'language', 'review_status', 'finalized', 'created_at')
    list_filter = ('review_status', 'finalized', 'flagged', 'is_gold', 'created_at')
    search_fields = ('id', 'dataset_type__name', 'language')
    raw_id_fields = ('dataset_type',)
