"""File storage utilities for OCR uploads."""
import os
import shutil
from pathlib import Path
from typing import Optional, BinaryIO
import uuid


class FileStorageManager:
    """Manages file storage for OCR uploads."""
    
    def __init__(self, base_path: str = "backend/uploads"):
        """Initialize file storage manager."""
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def save_upload(
        self, 
        file_content: BinaryIO, 
        filename: str, 
        job_id: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Save uploaded file.
        
        Args:
            file_content: File binary content
            filename: Original filename
            job_id: Optional job ID (will generate if not provided)
        
        Returns:
            Tuple of (job_id, file_path)
        """
        if not job_id:
            job_id = f"job_{uuid.uuid4().hex[:12]}"
        
        job_dir = self.base_path / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        
        safe_filename = self._sanitize_filename(filename)
        file_path = job_dir / safe_filename
        
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file_content, f)
        
        return job_id, str(file_path)
    
    def get_file_path(self, job_id: str, filename: str) -> Optional[Path]:
        """Get file path for a job."""
        file_path = self.base_path / job_id / filename
        return file_path if file_path.exists() else None
    
    def delete_job_files(self, job_id: str) -> bool:
        """Delete all files for a job."""
        job_dir = self.base_path / job_id
        if job_dir.exists():
            shutil.rmtree(job_dir)
            return True
        return False
    
    def get_job_directory(self, job_id: str) -> Path:
        """Get directory for a job."""
        return self.base_path / job_id
    
    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal."""
        filename = os.path.basename(filename)
        filename = filename.replace(" ", "_")
        allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
        sanitized = "".join(c for c in filename if c in allowed_chars)
        return sanitized or "upload"
    
    @staticmethod
    def validate_file_type(filename: str, allowed_types: list[str]) -> bool:
        """Validate file type by extension."""
        ext = Path(filename).suffix.lower()
        return ext in allowed_types
    
    @staticmethod
    def get_file_type(filename: str) -> str:
        """Get file type from filename."""
        ext = Path(filename).suffix.lower()
        type_map = {
            ".pdf": "pdf",
            ".png": "image",
            ".jpg": "image",
            ".jpeg": "image",
            ".tiff": "image",
            ".tif": "image",
            ".bmp": "image"
        }
        return type_map.get(ext, "unknown")


file_storage = FileStorageManager()
