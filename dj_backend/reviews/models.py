from django.db import models
from django.utils import timezone
from django.conf import settings
import uuid


class ReviewLog(models.Model):
    """Review log model - tracks all review actions."""
    
    ACTION_CHOICES = [
        ('approve', 'Approve'),
        ('edit', 'Edit'),
        ('skip', 'Skip'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='review_logs')
    dataset_item = models.ForeignKey('datasets.DatasetItem', on_delete=models.CASCADE, related_name='review_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    changes = models.JSONField(default=dict, help_text="Changes made during edit")
    payout_amount = models.DecimalField(max_digits=10, decimal_places=4, default=0.00)
    skip_data_correct = models.BooleanField(default=False)
    skip_feedback = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'review_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['reviewer', 'timestamp']),
            models.Index(fields=['dataset_item', 'action']),
        ]
    
    def __str__(self):
        return f"{self.reviewer.username} - {self.action} - {self.dataset_item.id}"


class Payout(models.Model):
    """Payout model - tracks reviewer payouts."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payout_id = models.CharField(max_length=100, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, default='bank_transfer')
    payment_details = models.JSONField(default=dict)
    requested_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'payouts'
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'requested_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - ${self.amount} - {self.status}"


class SystemConfig(models.Model):
    """System configuration model."""
    
    id = models.CharField(primary_key=True, max_length=50, default='config')
    payout_rate_default = models.DecimalField(max_digits=10, decimal_places=4, default=0.002)
    skip_threshold_default = models.IntegerField(default=5)
    lock_timeout_sec = models.IntegerField(default=180)
    finalize_review_count = models.IntegerField(default=3)
    gold_skip_correct_threshold = models.IntegerField(default=5)
    max_unchecked_skips_before_prompt = models.IntegerField(default=2)
    available_languages = models.JSONField(default=list, help_text="List of {code, name} objects")
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_config'
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configurations'
    
    def __str__(self):
        return 'System Configuration'
    
    @classmethod
    def get_config(cls):
        """Get or create system config."""
        config, _ = cls.objects.get_or_create(id='config')
        return config


class HomepageContent(models.Model):
    """Homepage content model for CMS."""
    
    id = models.CharField(primary_key=True, max_length=50, default='content')
    hero = models.JSONField(default=dict)
    testimonials = models.JSONField(default=list)
    sponsors = models.JSONField(default=list)
    footer = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'homepage_content'
        verbose_name = 'Homepage Content'
        verbose_name_plural = 'Homepage Content'
    
    def __str__(self):
        return 'Homepage Content'
    
    @classmethod
    def get_content(cls):
        """Get or create homepage content."""
        content, _ = cls.objects.get_or_create(id='content')
        return content
