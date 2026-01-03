"""Training script for anomaly detection model"""
import sys
from pathlib import Path
import logging

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.models.anomaly import AnomalyDetectionModel
from app.utils.database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_anomaly_model():
    """Train and save anomaly detection model"""
    logger.info("Starting anomaly detection model training...")
    
    try:
        # Load training data
        logger.info("Loading training data...")
        df = db.get_training_data(days=90)
        
        if df.empty:
            logger.error("No training data available")
            return
        
        logger.info(f"Loaded {len(df)} user records")
        
        # Initialize and train model
        model = AnomalyDetectionModel()
        metrics = model.train(df)
        
        # Log metrics
        logger.info("Training metrics:")
        logger.info(f"  Total samples: {metrics['n_samples']}")
        logger.info(f"  Anomalies detected: {metrics['n_anomalies']}")
        logger.info(f"  Anomaly rate: {metrics['anomaly_rate']:.2%}")
        logger.info(f"  Contamination parameter: {metrics['contamination']}")
        
        # Save model
        model.save()
        logger.info("✓ Anomaly detection model trained and saved successfully")
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    train_anomaly_model()
