from django.contrib import admin
from .models import ReviewLog, Payout, SystemConfig, HomepageContent


@admin.register(ReviewLog)
class ReviewLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'reviewer', 'action', 'payout_amount', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('reviewer__username', 'dataset_item__id')
    raw_id_fields = ('reviewer', 'dataset_item')


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('payout_id', 'user', 'amount', 'status', 'requested_at')
    list_filter = ('status', 'requested_at')
    search_fields = ('user__username', 'payout_id')
    raw_id_fields = ('user',)


@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'payout_rate_default', 'finalize_review_count', 'updated_at')


@admin.register(HomepageContent)
class HomepageContentAdmin(admin.ModelAdmin):
    list_display = ('id', 'updated_at')
