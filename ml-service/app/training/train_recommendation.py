"""Training script for recommendation model"""
import sys
from pathlib import Path
import logging

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.models.recommendation import QuestRecommendationModel
from app.utils.database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_recommendation_model():
    """Train and save recommendation model"""
    logger.info("Starting recommendation model training...")
    
    try:
        # Load training data
        logger.info("Loading quest data...")
        quest_df = db.get_quest_data()
        
        logger.info("Loading user-quest interactions...")
        interactions_df = db.get_user_quest_interactions()
        
        if quest_df.empty or interactions_df.empty:
            logger.error("No training data available")
            return
        
        logger.info(f"Loaded {len(quest_df)} quests and {len(interactions_df)} interactions")
        
        # Initialize and train model
        model = QuestRecommendationModel()
        metrics = model.train(interactions_df, quest_df)
        
        # Log metrics
        logger.info("Training metrics:")
        logger.info(f"  Number of users: {metrics['n_users']}")
        logger.info(f"  Number of quests: {metrics['n_quests']}")
        logger.info(f"  Matrix density: {metrics['matrix_density']:.2%}")
        logger.info(f"  Avg interactions/user: {metrics['avg_interactions_per_user']:.1f}")
        
        # Save model
        model.save()
        logger.info("✓ Recommendation model trained and saved successfully")
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    train_recommendation_model()
