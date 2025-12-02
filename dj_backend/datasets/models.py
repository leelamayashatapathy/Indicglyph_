from django.db import models
from django.utils import timezone
import uuid


class DatasetType(models.Model):
    """Dataset Type model - defines schema for datasets."""
    
    MODALITY_CHOICES = [
        ('ocr', 'OCR'),
        ('voice', 'Voice'),
        ('text', 'Text'),
        ('conversation', 'Conversation'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    modality = models.CharField(max_length=20, choices=MODALITY_CHOICES, default='text')
    fields = models.JSONField(default=list, help_text="List of field definitions")
    languages = models.JSONField(default=list, help_text="List of supported language codes")
    payout_rate = models.DecimalField(max_digits=10, decimal_places=4, default=0.002)
    active = models.BooleanField(default=True)
    review_guidelines = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'dataset_types'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class DatasetItem(models.Model):
    """Dataset Item model - individual items for review."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('finalized', 'Finalized'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item_number = models.IntegerField(null=True, blank=True, help_text="Sequential number per dataset type")
    dataset_type = models.ForeignKey(DatasetType, on_delete=models.CASCADE, related_name='items')
    language = models.CharField(max_length=10)
    modality = models.CharField(max_length=20, default='text')
    content = models.JSONField(default=dict, help_text="Item content fields")
    meta = models.JSONField(default=dict, help_text="Metadata")
    
    # Review state
    review_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    review_count = models.IntegerField(default=0)
    skip_count = models.IntegerField(default=0)
    correct_skips = models.IntegerField(default=0)
    unchecked_skips = models.IntegerField(default=0)
    finalized = models.BooleanField(default=False)
    reviewed_by = models.JSONField(default=list, help_text="List of reviewer usernames")
    lock_owner = models.CharField(max_length=100, null=True, blank=True)
    lock_time = models.DateTimeField(null=True, blank=True)
    
    # Flags
    is_gold = models.BooleanField(default=False)
    flagged = models.BooleanField(default=False)
    skip_feedback = models.JSONField(default=list, help_text="Skip feedback from reviewers")
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Flags metadata
    flags = models.JSONField(default=list, help_text="List of flag objects")
    
    class Meta:
        db_table = 'dataset_items'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['dataset_type', 'review_status']),
            models.Index(fields=['language', 'review_status']),
            models.Index(fields=['finalized']),
        ]
    
    def __str__(self):
        return f"{self.dataset_type.name} - Item {self.item_number or self.id}"
