"""Quest recommendation system using collaborative filtering"""
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
import joblib
import logging
from pathlib import Path
from typing import Dict, List
from app.config import settings

logger = logging.getLogger(__name__)


class QuestRecommendationModel:
    """
    Recommends quests to students using hybrid approach:
    - Collaborative filtering (user-based similarity)
    - Content-based filtering (quest attributes)
    """
    
    def __init__(self):
        self.user_similarity_matrix = None
        self.quest_features = None
        self.user_quest_matrix = None
        self.scaler = MinMaxScaler()
        self.user_ids = None
        self.quest_ids = None
    
    def train(self, interactions_df: pd.DataFrame, quest_df: pd.DataFrame) -> Dict:
        """
        Train recommendation model
        
        Args:
            interactions_df: User-quest interactions (user_id, quest_id, rating)
            quest_df: Quest metadata (quest_id, category, difficulty, etc.)
            
        Returns:
            Training metrics
        """
        logger.info("Training recommendation model...")
        
        # Create user-quest matrix
        self.user_quest_matrix = interactions_df.pivot(
            index='user_id',
            columns='quest_id',
            values='rating'
        ).fillna(0)
        
        self.user_ids = self.user_quest_matrix.index.tolist()
        self.quest_ids = self.user_quest_matrix.columns.tolist()
        
        # Calculate user similarity matrix
        self.user_similarity_matrix = cosine_similarity(self.user_quest_matrix)
        
        # Prepare quest features for content-based filtering
        self._prepare_quest_features(quest_df)
        
        # Calculate metrics
        density = (self.user_quest_matrix > 0).sum().sum() / self.user_quest_matrix.size
        
        logger.info(f"Recommendation model trained. Matrix density: {density:.3%}")
        
        return {
            'n_users': len(self.user_ids),
            'n_quests': len(self.quest_ids),
            'matrix_density': float(density),
            'avg_interactions_per_user': float((self.user_quest_matrix > 0).sum(axis=1).mean())
        }
    
    def _prepare_quest_features(self, quest_df: pd.DataFrame):
        """Prepare quest features for content-based filtering"""
        # One-hot encode categorical features
        category_dummies = pd.get_dummies(quest_df['category'], prefix='cat')
        difficulty_dummies = pd.get_dummies(quest_df['difficulty'], prefix='diff')
        
        # Combine features
        features = pd.concat([
            category_dummies,
            difficulty_dummies,
            quest_df[['xp_reward', 'money_reward']].fillna(0)
        ], axis=1)
        
        # Scale numeric features
        numeric_cols = ['xp_reward', 'money_reward']
        features[numeric_cols] = self.scaler.fit_transform(features[numeric_cols])
        
        self.quest_features = features
        self.quest_features.index = quest_df['quest_id']
    
    def recommend(
        self,
        user_id: str,
        n_recommendations: int = None,
        exclude_completed: List[str] = None
    ) -> List[Dict]:
        """
        Generate quest recommendations for a user
        
        Args:
            user_id: User ID to generate recommendations for
            n_recommendations: Number of recommendations (default from settings)
            exclude_completed: Quest IDs to exclude
            
        Returns:
            List of recommended quests with scores
        """
        if n_recommendations is None:
            n_recommendations = settings.recommendation_top_n
        
        if exclude_completed is None:
            exclude_completed = []
        
        # Get collaborative filtering scores
        cf_scores = self._collaborative_filtering_scores(user_id)
        
        # Get content-based scores
        cb_scores = self._content_based_scores(user_id)
        
        # Combine scores (hybrid approach)
        hybrid_scores = 0.7 * cf_scores + 0.3 * cb_scores
        
        # Filter out completed quests
        for quest_id in exclude_completed:
            if quest_id in hybrid_scores:
                hybrid_scores[quest_id] = 0
        
        # Get top N recommendations
        top_quests = sorted(
            hybrid_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:n_recommendations]
        
        recommendations = []
        for quest_id, score in top_quests:
            if score > 0:
                recommendations.append({
                    'quest_id': quest_id,
                    'score': float(score),
                    'reason': self._get_recommendation_reason(score)
                })
        
        return recommendations
    
    def _collaborative_filtering_scores(self, user_id: str) -> Dict[str, float]:
        """Calculate scores using collaborative filtering"""
        if user_id not in self.user_ids:
            # New user - return popularity-based scores
            return self._popularity_scores()
        
        user_idx = self.user_ids.index(user_id)
        
        # Get similar users
        user_similarities = self.user_similarity_matrix[user_idx]
        
        # Calculate weighted scores
        scores = {}
        for quest_id in self.quest_ids:
            quest_idx = self.quest_ids.index(quest_id)
            
            # Skip if user already interacted with this quest
            if self.user_quest_matrix.iloc[user_idx, quest_idx] > 0:
                scores[quest_id] = 0
                continue
            
            # Weighted sum of similar users' ratings
            ratings = self.user_quest_matrix.iloc[:, quest_idx].values
            weighted_sum = np.sum(user_similarities * ratings)
            similarity_sum = np.sum(user_similarities[ratings > 0])
            
            if similarity_sum > 0:
                scores[quest_id] = weighted_sum / similarity_sum
            else:
                scores[quest_id] = 0
        
        return scores
    
    def _content_based_scores(self, user_id: str) -> Dict[str, float]:
        """Calculate scores using content-based filtering"""
        scores = {}
        
        if user_id not in self.user_ids:
            # New user - return average scores
            for quest_id in self.quest_ids:
                scores[quest_id] = 0.5
            return scores
        
        user_idx = self.user_ids.index(user_id)
        
        # Get user's quest preferences
        user_ratings = self.user_quest_matrix.iloc[user_idx]
        liked_quests = user_ratings[user_ratings > 0.7].index.tolist()
        
        if not liked_quests:
            # No strong preferences - return neutral scores
            for quest_id in self.quest_ids:
                scores[quest_id] = 0.5
            return scores
        
        # Calculate similarity to liked quests
        for quest_id in self.quest_ids:
            if quest_id not in self.quest_features.index:
                scores[quest_id] = 0
                continue
            
            similarities = []
            for liked_quest in liked_quests:
                if liked_quest in self.quest_features.index:
                    sim = cosine_similarity(
                        self.quest_features.loc[[quest_id]],
                        self.quest_features.loc[[liked_quest]]
                    )[0][0]
                    similarities.append(sim)
            
            scores[quest_id] = np.mean(similarities) if similarities else 0
        
        return scores
    
    def _popularity_scores(self) -> Dict[str, float]:
        """Calculate popularity-based scores for new users"""
        quest_popularity = self.user_quest_matrix.sum(axis=0)
        max_popularity = quest_popularity.max()
        
        scores = {}
        for quest_id in self.quest_ids:
            if max_popularity > 0:
                scores[quest_id] = quest_popularity[quest_id] / max_popularity
            else:
                scores[quest_id] = 0
        
        return scores
    
    def _get_recommendation_reason(self, score: float) -> str:
        """Generate explanation for recommendation"""
        if score > 0.8:
            return "Highly recommended based on your interests"
        elif score > 0.6:
            return "Similar to quests you've enjoyed"
        elif score > 0.4:
            return "Popular among students like you"
        else:
            return "You might find this interesting"
    
    def save(self, path: str = None):
        """Save model to disk"""
        if not path:
            path = Path(settings.model_path) / "recommendation"
        else:
            path = Path(path)
        
        path.mkdir(parents=True, exist_ok=True)
        
        joblib.dump({
            'user_similarity_matrix': self.user_similarity_matrix,
            'quest_features': self.quest_features,
            'user_quest_matrix': self.user_quest_matrix,
            'scaler': self.scaler,
            'user_ids': self.user_ids,
            'quest_ids': self.quest_ids
        }, path / "model.pkl")
        
        logger.info(f"Model saved to {path}")
    
    def load(self, path: str = None):
        """Load model from disk"""
        if not path:
            path = Path(settings.model_path) / "recommendation"
        else:
            path = Path(path)
        
        data = joblib.load(path / "model.pkl")
        
        self.user_similarity_matrix = data['user_similarity_matrix']
        self.quest_features = data['quest_features']
        self.user_quest_matrix = data['user_quest_matrix']
        self.scaler = data['scaler']
        self.user_ids = data['user_ids']
        self.quest_ids = data['quest_ids']
        
        logger.info(f"Model loaded from {path}")
