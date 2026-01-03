"""FastAPI main application"""
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from pathlib import Path

from app.config import settings
from app.models.clustering import StudentClusteringModel
from app.models.recommendation import QuestRecommendationModel
from app.models.churn import ChurnPredictionModel
from app.models.anomaly import AnomalyDetectionModel
from app.utils.cache import cache

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EduRPG ML Service",
    description="Machine Learning API for EduRPG gamification platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models at startup
clustering_model = StudentClusteringModel()
recommendation_model = QuestRecommendationModel()
churn_model = ChurnPredictionModel()
anomaly_model = AnomalyDetectionModel()


@app.on_event("startup")
async def startup_event():
    """Load ML models on startup"""
    logger.info("Loading ML models...")
    
    models_path = Path(settings.model_path)
    
    try:
        if (models_path / "clustering").exists():
            clustering_model.load()
            logger.info("✓ Clustering model loaded")
        else:
            logger.warning("✗ Clustering model not found")
        
        if (models_path / "recommendation").exists():
            recommendation_model.load()
            logger.info("✓ Recommendation model loaded")
        else:
            logger.warning("✗ Recommendation model not found")
        
        if (models_path / "churn").exists():
            churn_model.load()
            logger.info("✓ Churn model loaded")
        else:
            logger.warning("✗ Churn model not found")
        
        if (models_path / "anomaly").exists():
            anomaly_model.load()
            logger.info("✓ Anomaly model loaded")
        else:
            logger.warning("✗ Anomaly model not found")
        
        logger.info("ML service ready!")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")


# Authentication dependency
async def verify_api_key(x_api_key: str = Header(None)):
    """Verify API key from header"""
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


# Pydantic models for request/response
class UserFeatures(BaseModel):
    user_id: str
    total_xp: float = 0
    level: int = 0
    money: float = 0
    reputation: int = 0
    quests_completed: int = 0
    achievements_unlocked: int = 0
    recent_xp_gained: float = 0
    active_days: int = 0
    items_owned: int = 0
    trades_made: int = 0
    events_participated: int = 0
    days_inactive: float = 0
    account_age_days: float = 1


class ClusterRequest(BaseModel):
    users: List[UserFeatures]


class RecommendationRequest(BaseModel):
    user_id: str
    n_recommendations: Optional[int] = 5
    exclude_completed: Optional[List[str]] = []


class ChurnRequest(BaseModel):
    user_id: str
    user_features: UserFeatures


class AnomalyRequest(BaseModel):
    user_id: str
    user_features: UserFeatures


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "EduRPG ML Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": {
            "clustering": clustering_model.model is not None,
            "recommendation": recommendation_model.model is not None,
            "churn": churn_model.model is not None,
            "anomaly": anomaly_model.model is not None
        }
    }


@app.post("/api/ml/cluster-student")
async def cluster_student(
    features: UserFeatures,
    api_key: str = Depends(verify_api_key)
):
    """
    Predict cluster for a single student
    
    Returns cluster assignment with characteristics
    """
    try:
        # Check cache
        cache_key = f"cluster:{features.user_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Predict
        user_dict = features.dict()
        result = clustering_model.predict(user_dict)
        
        # Cache result
        cache.set(cache_key, result, settings.cache_ttl_clustering)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Clustering error: {e}")
        raise HTTPException(status_code=500, detail="Clustering failed")


@app.post("/api/ml/recommend-quests")
async def recommend_quests(
    request: RecommendationRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Generate quest recommendations for a student
    
    Returns list of recommended quests with scores
    """
    try:
        # Check cache
        cache_key = f"recommendations:{request.user_id}:{request.n_recommendations}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Generate recommendations
        recommendations = recommendation_model.recommend(
            user_id=request.user_id,
            n_recommendations=request.n_recommendations,
            exclude_completed=request.exclude_completed
        )
        
        result = {
            "user_id": request.user_id,
            "recommendations": recommendations
        }
        
        # Cache result
        cache.set(cache_key, result, settings.cache_ttl_recommendation)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail="Recommendation failed")


@app.post("/api/ml/predict-churn")
async def predict_churn(
    request: ChurnRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Predict churn probability for a student
    
    Returns churn probability, risk level, and recommendations
    """
    try:
        # Check cache
        cache_key = f"churn:{request.user_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Predict
        user_dict = request.user_features.dict()
        result = churn_model.predict(user_dict)
        result['user_id'] = request.user_id
        
        # Cache result
        cache.set(cache_key, result, settings.cache_ttl_prediction)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Churn prediction error: {e}")
        raise HTTPException(status_code=500, detail="Churn prediction failed")


@app.post("/api/ml/detect-anomalies")
async def detect_anomalies(
    request: AnomalyRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Detect anomalous behavior for a student
    
    Returns anomaly detection results with specific anomaly types
    """
    try:
        # Check cache
        cache_key = f"anomaly:{request.user_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Detect anomalies
        user_dict = request.user_features.dict()
        result = anomaly_model.predict(user_dict)
        result['user_id'] = request.user_id
        
        # Cache result
        cache.set(cache_key, result, settings.cache_ttl_prediction)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Anomaly detection error: {e}")
        raise HTTPException(status_code=500, detail="Anomaly detection failed")


@app.post("/api/ml/batch-predictions")
async def batch_predictions(
    request: ClusterRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Run all predictions for multiple students in batch
    
    Returns comprehensive ML insights for all students
    """
    try:
        results = []
        
        for user_features in request.users:
            user_dict = user_features.dict()
            user_id = user_features.user_id
            
            # Run all predictions
            cluster = clustering_model.predict(user_dict)
            churn = churn_model.predict(user_dict)
            anomaly = anomaly_model.predict(user_dict)
            
            results.append({
                "user_id": user_id,
                "cluster": cluster,
                "churn": churn,
                "anomaly": anomaly
            })
        
        return {
            "total_users": len(results),
            "predictions": results
        }
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail="Batch prediction failed")


@app.delete("/api/ml/cache/clear")
async def clear_cache(
    pattern: Optional[str] = "*",
    api_key: str = Depends(verify_api_key)
):
    """Clear cached predictions"""
    try:
        cache.clear_pattern(pattern)
        return {"message": f"Cache cleared for pattern: {pattern}"}
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")


@app.get("/api/ml/models/status")
async def models_status(api_key: str = Depends(verify_api_key)):
    """Get status of all loaded models"""
    return {
        "clustering": {
            "loaded": clustering_model.model is not None,
            "n_clusters": settings.clustering_n_clusters if clustering_model.model else None
        },
        "recommendation": {
            "loaded": recommendation_model.model is not None,
            "n_users": len(recommendation_model.user_ids) if recommendation_model.user_ids else 0,
            "n_quests": len(recommendation_model.quest_ids) if recommendation_model.quest_ids else 0
        },
        "churn": {
            "loaded": churn_model.model is not None,
            "threshold": settings.churn_threshold
        },
        "anomaly": {
            "loaded": anomaly_model.model is not None,
            "contamination": settings.anomaly_contamination
        }
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
