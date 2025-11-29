"""ASR (Automatic Speech Recognition) service with provider switching."""
import os
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any
from backend.app.models.audio_job_model import AudioTranscript


class ASRService:
    """ASR service with provider switching (faster-whisper or none)."""
    
    def __init__(self):
        """Initialize ASR service."""
        self.provider = os.getenv("AUDIO_ASR_PROVIDER", "none")
        self.model_size = os.getenv("WHISPER_MODEL", "tiny")
        self._model = None
    
    def _get_audio_duration(self, file_path: str) -> float:
        """Get audio duration using ffprobe."""
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    file_path
                ],
                capture_output=True,
                text=True,
                check=True
            )
            return float(result.stdout.strip())
        except Exception as e:
            print(f"Warning: Could not get audio duration: {e}")
            return 0.0
    
    def _init_whisper_model(self):
        """Initialize faster-whisper model (lazy loading)."""
        if self._model is None and self.provider == "whispercpp":
            try:
                from faster_whisper import WhisperModel
                
                # Use CPU with int8 for production efficiency
                device = "cpu"
                compute_type = "int8"
                
                print(f"Loading Whisper model: {self.model_size} on {device} with {compute_type}")
                self._model = WhisperModel(
                    self.model_size,
                    device=device,
                    compute_type=compute_type
                )
                print(f"Whisper model loaded successfully")
            except ImportError:
                raise ImportError(
                    "faster-whisper not installed. Install with: pip install faster-whisper"
                )
            except Exception as e:
                raise RuntimeError(f"Failed to initialize Whisper model: {e}")
        
        return self._model
    
    def transcribe(
        self,
        file_path: str,
        job_id: str,
        language: str = "en"
    ) -> AudioTranscript:
        """
        Transcribe audio file.
        
        Args:
            file_path: Path to audio file
            job_id: Audio job ID
            language: Target language code
        
        Returns:
            AudioTranscript object
        """
        duration = self._get_audio_duration(file_path)
        
        if self.provider == "none":
            # Manual transcript path: return empty transcript
            return AudioTranscript(
                job_id=job_id,
                text="",
                language=language,
                duration=duration,
                confidence=0.0,
                segments=[],
                metadata={"provider": "none", "note": "Manual transcription required"}
            )
        
        elif self.provider == "whispercpp":
            # Use faster-whisper for transcription
            model = self._init_whisper_model()
            
            try:
                segments_list, info = model.transcribe(
                    file_path,
                    language=language if language != "auto" else None,
                    beam_size=5,
                    vad_filter=True
                )
                
                # Collect segments
                segments = []
                full_text = []
                
                for segment in segments_list:
                    segments.append({
                        "start": segment.start,
                        "end": segment.end,
                        "text": segment.text.strip(),
                        "confidence": getattr(segment, "avg_logprob", 0.0)
                    })
                    full_text.append(segment.text.strip())
                
                transcript_text = " ".join(full_text)
                detected_language = info.language if hasattr(info, "language") else language
                avg_confidence = info.language_probability if hasattr(info, "language_probability") else 0.0
                
                return AudioTranscript(
                    job_id=job_id,
                    text=transcript_text,
                    language=detected_language,
                    duration=duration,
                    confidence=avg_confidence,
                    segments=segments,
                    metadata={
                        "provider": "whispercpp",
                        "model": self.model_size,
                        "detected_language": detected_language
                    }
                )
            
            except Exception as e:
                raise RuntimeError(f"Transcription failed: {e}")
        
        else:
            raise ValueError(f"Unknown ASR provider: {self.provider}")
