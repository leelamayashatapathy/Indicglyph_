from rest_framework import serializers
from .models import DatasetType, DatasetItem


class DatasetTypeSerializer(serializers.ModelSerializer):
    """Serializer for DatasetType."""
    
    class Meta:
        model = DatasetType
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class DatasetItemSerializer(serializers.ModelSerializer):
    """Serializer for DatasetItem."""
    dataset_type_name = serializers.CharField(source='dataset_type.name', read_only=True)
    
    class Meta:
        model = DatasetItem
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def to_representation(self, instance):
        """Custom representation to match FastAPI response format."""
        data = super().to_representation(instance)
        # Convert to match FastAPI format
        data['_id'] = str(data.pop('id'))
        data['dataset_type_id'] = str(data.pop('dataset_type'))
        
        # Build review_state object
        data['review_state'] = {
            'status': data.pop('review_status'),
            'review_count': data.pop('review_count'),
            'skip_count': data.pop('skip_count'),
            'correct_skips': data.pop('correct_skips'),
            'unchecked_skips': data.pop('unchecked_skips'),
            'finalized': data.pop('finalized'),
            'reviewed_by': data.pop('reviewed_by'),
            'lock_owner': data.pop('lock_owner'),
            'lock_time': data.pop('lock_time'),
        }
        
        return data


class DatasetItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DatasetItem."""
    
    class Meta:
        model = DatasetItem
        fields = ('dataset_type', 'language', 'content', 'meta', 'modality')
    
    def create(self, validated_data):
        # Auto-populate modality from dataset_type if not provided
        if 'modality' not in validated_data or not validated_data['modality']:
            validated_data['modality'] = validated_data['dataset_type'].modality
        
        return super().create(validated_data)

