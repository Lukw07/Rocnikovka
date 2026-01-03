"""Training script for churn prediction model"""
import sys
from pathlib import Path
import logging

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.models.churn import ChurnPredictionModel
from app.utils.database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_churn_model():
    """Train and save churn prediction model"""
    logger.info("Starting churn prediction model training...")
    
    try:
        # Load training data
        logger.info("Loading training data...")
        df = db.get_training_data(days=90)
        
        if df.empty:
            logger.error("No training data available")
            return
        
        logger.info(f"Loaded {len(df)} user records")
        
        # Initialize and train model
        model = ChurnPredictionModel()
        metrics = model.train(df)
        
        # Log metrics
        logger.info("Training metrics:")
        logger.info(f"  Accuracy: {metrics['accuracy']:.3f}")
        logger.info(f"  Precision: {metrics['precision']:.3f}")
        logger.info(f"  Recall: {metrics['recall']:.3f}")
        logger.info(f"  F1 Score: {metrics['f1_score']:.3f}")
        logger.info(f"  Churn rate: {metrics['churn_rate']:.2%}")
        logger.info(f"  Churned users: {metrics['n_churned']}")
        logger.info(f"  Active users: {metrics['n_active']}")
        
        logger.info("\nFeature importance:")
        for feature, importance in list(metrics['feature_importance'].items())[:5]:
            logger.info(f"  {feature}: {importance:.3f}")
        
        # Save model
        model.save()
        logger.info("✓ Churn prediction model trained and saved successfully")
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    train_churn_model()
