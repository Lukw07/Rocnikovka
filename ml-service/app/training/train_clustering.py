"""Training script for clustering model"""
import sys
from pathlib import Path
import logging

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.models.clustering import StudentClusteringModel
from app.utils.database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_clustering_model():
    """Train and save clustering model"""
    logger.info("Starting clustering model training...")
    
    try:
        # Load training data
        logger.info("Loading training data...")
        df = db.get_training_data(days=90)
        
        if df.empty:
            logger.error("No training data available")
            return
        
        logger.info(f"Loaded {len(df)} user records")
        
        # Initialize and train model
        model = StudentClusteringModel()
        metrics = model.train(df)
        
        # Log metrics
        logger.info("Training metrics:")
        logger.info(f"  Silhouette score: {metrics['silhouette_score']:.3f}")
        logger.info(f"  Inertia: {metrics['inertia']:.2f}")
        logger.info(f"  Number of clusters: {metrics['n_clusters']}")
        
        logger.info("\nCluster statistics:")
        for cluster_id, stats in metrics['cluster_stats'].items():
            logger.info(f"  {stats['name']} ({stats['count']} students):")
            logger.info(f"    Avg XP: {stats['avg_xp']:.0f}")
            logger.info(f"    Avg Level: {stats['avg_level']:.1f}")
            logger.info(f"    Avg Quests: {stats['avg_quests']:.1f}")
        
        # Save model
        model.save()
        logger.info("✓ Clustering model trained and saved successfully")
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    train_clustering_model()
