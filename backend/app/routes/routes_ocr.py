"""OCR routes."""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import Dict, Any

from backend.app.routes.routes_auth import get_current_user
from backend.app.services.ocr_service import OCRService

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/process-image")
def process_image_ocr(
    image_data: str,
    ocr_type: str = "text",
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Process image with OCR."""
    try:
        result = OCRService.process_image(image_data, ocr_type)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )


@router.post("/process-document")
def process_document_ocr(
    document_url: str,
    doc_type: str = "pdf",
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Process document with OCR."""
    try:
        result = OCRService.process_document(document_url, doc_type)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document OCR processing failed: {str(e)}"
        )


@router.post("/validate")
def validate_ocr_result(
    ocr_result: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, bool]:
    """Validate OCR result quality."""
    is_valid = OCRService.validate_ocr_result(ocr_result)
    return {
        "is_valid": is_valid,
        "confidence": ocr_result.get("confidence", 0)
    }


@router.post("/enhance-image")
def enhance_image(
    image_data: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, str]:
    """Enhance image quality for better OCR."""
    enhanced = OCRService.enhance_image_quality(image_data)
    return {
        "enhanced_image_data": enhanced,
        "message": "Image enhanced successfully"
    }
