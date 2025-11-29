"""OCR service for processing images and documents."""
from typing import Dict, Any, Optional, List
import base64
from pathlib import Path
import logging

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from backend.app.models.ocr_job_model import OcrBlock, OcrResult

logger = logging.getLogger(__name__)


class OCRService:
    """Service for OCR processing."""
    
    def __init__(self):
        """Initialize OCR service."""
        self.tesseract_available = False
        try:
            import pytesseract
            self.pytesseract = pytesseract
            self.tesseract_available = True
            logger.info("Tesseract OCR available")
        except ImportError:
            logger.info("Tesseract not available, using mock OCR")
    
    def process_file(self, file_path: str, job_id: str) -> List[OcrResult]:
        """
        Process a file (image or PDF) with OCR.
        
        Args:
            file_path: Path to the file
            job_id: OCR job ID
        
        Returns:
            List of OcrResult objects
        """
        file_type = Path(file_path).suffix.lower()
        
        if file_type == '.pdf':
            return self.process_pdf_file(file_path, job_id)
        elif file_type in ['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp']:
            result = self.process_image_file(file_path, job_id, 0)
            return [result]
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def process_image_file(self, image_path: str, job_id: str, page_index: int = 0) -> OcrResult:
        """Process a single image file with OCR."""
        if self.tesseract_available:
            return self._process_with_tesseract(image_path, job_id, page_index)
        else:
            return self._process_mock(image_path, job_id, page_index)
    
    def process_pdf_file(self, pdf_path: str, job_id: str) -> List[OcrResult]:
        """Process a PDF file with OCR."""
        try:
            from pdf2image import convert_from_path
            import os
            
            images = convert_from_path(pdf_path)
            results = []
            
            for i, image in enumerate(images):
                temp_path = f"/tmp/ocr_page_{job_id}_{i}.png"
                image.save(temp_path)
                
                result = self.process_image_file(temp_path, job_id, i)
                results.append(result)
                
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            return results
        except ImportError:
            logger.warning("pdf2image not available, using mock PDF processing")
            return [self._process_mock(pdf_path, job_id, 0)]
    
    def _process_with_tesseract(self, image_path: str, job_id: str, page_index: int) -> OcrResult:
        """Process image with Tesseract OCR."""
        if not PIL_AVAILABLE:
            return self._process_mock(image_path, job_id, page_index)
        
        try:
            image = Image.open(image_path)
            
            data = self.pytesseract.image_to_data(
                image,
                output_type=self.pytesseract.Output.DICT
            )
            
            raw_text = self.pytesseract.image_to_string(image)
            
            blocks = []
            n_boxes = len(data['text'])
            for i in range(n_boxes):
                if int(data['conf'][i]) > 0 and data['text'][i].strip():
                    block = OcrBlock(
                        text=data['text'][i],
                        confidence=float(data['conf'][i]) / 100.0,
                        bbox={
                            "x": float(data['left'][i]),
                            "y": float(data['top'][i]),
                            "width": float(data['width'][i]),
                            "height": float(data['height'][i])
                        },
                        page_index=page_index
                    )
                    blocks.append(block)
            
            avg_confidence = sum(b.confidence for b in blocks) / len(blocks) if blocks else 0.0
            return OcrResult(
                job_id=job_id,
                page_index=page_index,
                full_text=raw_text,
                confidence=avg_confidence,
                blocks=blocks,
                metadata={"engine": "tesseract", "image_path": image_path}
            )
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {str(e)}")
            return self._process_mock(image_path, job_id, page_index)
    
    def _process_mock(self, file_path: str, job_id: str, page_index: int) -> OcrResult:
        """Mock OCR processing for testing."""
        filename = Path(file_path).name
        
        mock_text = f"""Sample OCR Text - Page {page_index + 1}
        
This is a mock OCR result for: {filename}

Invoice Number: INV-2025-001
Date: October 23, 2025
Amount: $1,234.56

Customer: John Doe
Address: 123 Main Street
City: San Francisco, CA

Description: Professional Services
Quantity: 10
Unit Price: $123.46
Total: $1,234.56

Thank you for your business!

[Mock OCR Mode - Install Tesseract for real extraction]"""
        
        blocks = []
        for i, line in enumerate(mock_text.split('\n')):
            if line.strip():
                blocks.append(
                    OcrBlock(
                        text=line.strip(),
                        confidence=0.95,
                        bbox={"x": 10, "y": 20 + i * 15, "width": 500, "height": 14},
                        page_index=page_index
                    )
                )
        
        avg_confidence = 0.95
        return OcrResult(
            job_id=job_id,
            page_index=page_index,
            full_text=mock_text,
            confidence=avg_confidence,
            blocks=blocks,
            metadata={"engine": "mock", "note": "Install Tesseract for real OCR"}
        )
    
    @staticmethod
    def process_image(image_data: str, ocr_type: str = "text") -> Dict[str, Any]:
        """
        Process image with OCR.
        
        Args:
            image_data: Base64 encoded image data
            ocr_type: Type of OCR processing (text, table, form, etc.)
        
        Returns:
            Dict with extracted data
        """
        # Placeholder implementation
        # In production, this would integrate with actual OCR service
        # (e.g., Tesseract, Google Vision API, AWS Textract, etc.)
        
        result = {
            "ocr_type": ocr_type,
            "extracted_text": "[OCR processing would happen here]",
            "confidence": 0.95,
            "metadata": {
                "image_size": len(image_data),
                "processing_time_ms": 250
            }
        }
        
        if ocr_type == "table":
            result["tables"] = []
        elif ocr_type == "form":
            result["fields"] = {}
        
        return result
    
    @staticmethod
    def process_document(document_url: str, doc_type: str = "pdf") -> Dict[str, Any]:
        """
        Process document with OCR.
        
        Args:
            document_url: URL or path to document
            doc_type: Type of document (pdf, image, etc.)
        
        Returns:
            Dict with extracted data
        """
        # Placeholder implementation
        result = {
            "doc_type": doc_type,
            "pages": 1,
            "extracted_text": "[Document OCR processing would happen here]",
            "confidence": 0.92,
            "metadata": {
                "document_url": document_url,
                "processing_time_ms": 500
            }
        }
        
        return result
    
    @staticmethod
    def validate_ocr_result(ocr_result: Dict[str, Any]) -> bool:
        """Validate OCR result quality."""
        confidence = ocr_result.get("confidence", 0)
        return confidence >= 0.8
    
    @staticmethod
    def enhance_image_quality(image_data: str) -> str:
        """
        Enhance image quality for better OCR results.
        
        Returns:
            Enhanced image data (base64)
        """
        # Placeholder - would implement image enhancement
        # (contrast, brightness, noise reduction, etc.)
        return image_data


ocr_service = OCRService()
