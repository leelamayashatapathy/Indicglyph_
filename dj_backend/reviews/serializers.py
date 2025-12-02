from rest_framework import serializers
from .models import ReviewLog, Payout
from datasets.models import DatasetItem


class ReviewSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a review."""
    item_id = serializers.UUIDField()
    action = serializers.ChoiceField(choices=['approve', 'edit', 'skip'])
    changes = serializers.DictField(required=False, allow_null=True)
    skip_data_correct = serializers.BooleanField(default=False)
    skip_feedback = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ReviewLogSerializer(serializers.ModelSerializer):
    """Serializer for ReviewLog."""
    
    class Meta:
        model = ReviewLog
        fields = '__all__'
        read_only_fields = ('id', 'timestamp')
    
    def to_representation(self, instance):
        """Convert to match FastAPI format."""
        data = super().to_representation(instance)
        data['_id'] = str(data.pop('id'))
        data['reviewer_id'] = instance.reviewer.username
        data['dataset_item_id'] = str(instance.dataset_item.id)
        return data


class FlagItemSerializer(serializers.Serializer):
    """Serializer for flagging an item."""
    item_id = serializers.UUIDField()
    reason = serializers.ChoiceField(choices=['offensive', 'corrupt', 'unclear', 'other'])
    note = serializers.CharField(required=False, allow_null=True, allow_blank=True)



