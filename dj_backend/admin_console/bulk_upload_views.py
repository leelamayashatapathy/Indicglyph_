from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import zipfile
import csv
import json
import io

from datasets.models import DatasetType, DatasetItem
from datasets.serializers import DatasetItemCreateSerializer
from .permissions import IsPlatformOperator


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPlatformOperator])
def bulk_upload_zip(request):
    """Bulk upload dataset items from ZIP file."""
    if 'file' not in request.FILES:
        return Response(
            {'detail': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    zip_file = request.FILES['file']
    dataset_type_id = request.data.get('dataset_type_id')
    language = request.data.get('language', 'en')
    
    if not dataset_type_id:
        return Response(
            {'detail': 'dataset_type_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    dataset_type = get_object_or_404(DatasetType, id=dataset_type_id)
    
    success_count = 0
    error_count = 0
    errors = []
    
    try:
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            for file_name in zip_ref.namelist():
                try:
                    file_content = zip_ref.read(file_name).decode('utf-8')
                    
                    # Try to parse as JSONL
                    if file_name.endswith('.jsonl'):
                        for line in file_content.split('\n'):
                            if not line.strip():
                                continue
                            try:
                                data = json.loads(line)
                                item_data = {
                                    'dataset_type': str(dataset_type.id),
                                    'language': language,
                                    'content': data,
                                    'modality': dataset_type.modality
                                }
                                serializer = DatasetItemCreateSerializer(data=item_data)
                                if serializer.is_valid():
                                    serializer.save()
                                    success_count += 1
                                else:
                                    error_count += 1
                                    errors.append(f"{file_name}: {serializer.errors}")
                            except json.JSONDecodeError:
                                error_count += 1
                                errors.append(f"{file_name}: Invalid JSON")
                    
                    # Try to parse as CSV
                    elif file_name.endswith('.csv'):
                        csv_reader = csv.DictReader(io.StringIO(file_content))
                        for row in csv_reader:
                            item_data = {
                                'dataset_type': str(dataset_type.id),
                                'language': language,
                                'content': row,
                                'modality': dataset_type.modality
                            }
                            serializer = DatasetItemCreateSerializer(data=item_data)
                            if serializer.is_valid():
                                serializer.save()
                                success_count += 1
                            else:
                                error_count += 1
                                errors.append(f"{file_name}: {serializer.errors}")
                
                except Exception as e:
                    error_count += 1
                    errors.append(f"{file_name}: {str(e)}")
    
    except Exception as e:
        return Response(
            {'detail': f'Failed to process ZIP file: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'success': True,
        'message': f'Uploaded {success_count} items, {error_count} errors',
        'success_count': success_count,
        'error_count': error_count,
        'errors': errors[:10]  # Limit errors
    }, status=status.HTTP_201_CREATED)



