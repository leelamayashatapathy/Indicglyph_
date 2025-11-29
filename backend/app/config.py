"""Application configuration."""
import os
from typing import List


class Config:
    """Application configuration class."""
    
    # App
    APP_NAME: str = "Data Review Platform"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 2)))  # default 2 hours
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:3000").split(",") if origin.strip()
    ]
    
    # Storage
    STORAGE_TYPE: str = "postgresql"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://datasetforge:datasetforge@localhost:5432/datasetforge")
    
    # Payout settings
    MIN_PAYOUT_THRESHOLD: float = 10.0
    PAYOUT_RATE_PER_REVIEW: float = 0.05

    # Environment marker
    ENV: str = os.getenv("ENV", "dev").lower()


config = Config()

# Hardened defaults: fail fast in non-dev environments if critical settings are unsafe
if config.ENV != "dev":
    if not config.SECRET_KEY:
        raise ValueError("SECRET_KEY must be set for non-dev environments")
    if not config.ALLOWED_ORIGINS or "*" in config.ALLOWED_ORIGINS:
        raise ValueError("CORS_ALLOWED_ORIGINS must be set to a comma-separated list for non-dev environments")
