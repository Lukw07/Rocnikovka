"""Master training script to train all models"""
import sys
from pathlib import Path
import logging

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.training.train_clustering import train_clustering_model
from app.training.train_recommendation import train_recommendation_model
from app.training.train_churn import train_churn_model
from app.training.train_anomaly import train_anomaly_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_all_models():
    """Train all ML models in sequence"""
    logger.info("=" * 80)
    logger.info("STARTING COMPLETE ML TRAINING PIPELINE")
    logger.info("=" * 80)
    
    models = [
        ("Clustering", train_clustering_model),
        ("Recommendation", train_recommendation_model),
        ("Churn Prediction", train_churn_model),
        ("Anomaly Detection", train_anomaly_model)
    ]
    
    results = {}
    
    for name, train_func in models:
        logger.info(f"\n{'=' * 80}")
        logger.info(f"Training {name} Model")
        logger.info(f"{'=' * 80}")
        
        try:
            train_func()
            results[name] = "SUCCESS"
        except Exception as e:
            logger.error(f"Failed to train {name} model: {e}")
            results[name] = f"FAILED: {str(e)}"
    
    # Print summary
    logger.info("\n" + "=" * 80)
    logger.info("TRAINING SUMMARY")
    logger.info("=" * 80)
    for name, result in results.items():
        status = "✓" if result == "SUCCESS" else "✗"
        logger.info(f"{status} {name}: {result}")
    
    # Check if all succeeded
    all_success = all(r == "SUCCESS" for r in results.values())
    if all_success:
        logger.info("\n✓ ALL MODELS TRAINED SUCCESSFULLY!")
    else:
        logger.warning("\n✗ Some models failed to train. Check logs above.")


if __name__ == "__main__":
    train_all_models()
