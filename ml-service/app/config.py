"""Configuration settings for ML service"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/edurpg"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Models
    model_path: str = "./models"
    retrain_interval_days: int = 7
    
    # API
    api_key: str = "development-key"
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # Logging
    log_level: str = "INFO"
    
    # ML Parameters
    clustering_n_clusters: int = 5
    recommendation_top_n: int = 5
    churn_threshold: float = 0.5
    anomaly_contamination: float = 0.1
    
    # Cache TTL (seconds)
    cache_ttl_prediction: int = 3600  # 1 hour
    cache_ttl_recommendation: int = 1800  # 30 minutes
    cache_ttl_clustering: int = 86400  # 24 hours
    
    class Config:
        env_file = ".env"


settings = Settings()
