"""Student clustering model using K-Means"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib
import logging
from pathlib import Path
from typing import Dict, List, Tuple
from app.config import settings

logger = logging.getLogger(__name__)


class StudentClusteringModel:
    """
    Clusters students into segments based on behavior and performance.
    
    Segments typically include:
    - Casual: Low engagement, infrequent activity
    - Engaged: Regular activity, moderate progress
    - Power User: High activity, high achievements
    - Struggling: Active but low completion rate
    - Inactive: No recent activity
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'total_xp',
            'level',
            'quests_completed',
            'active_days',
            'achievements_unlocked',
            'recent_xp_gained',
            'items_owned',
            'trades_made',
            'events_participated',
            'days_inactive',
            'account_age_days'
        ]
        self.segment_labels = {
            0: "Casual",
            1: "Engaged",
            2: "Power User",
            3: "Struggling",
            4: "Inactive"
        }
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare and scale features for clustering"""
        # Fill missing values
        df = df.fillna(0)
        
        # Select features
        X = df[self.feature_names].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled
    
    def train(self, df: pd.DataFrame) -> Dict:
        """
        Train clustering model
        
        Args:
            df: Training data with user features
            
        Returns:
            Training metrics
        """
        logger.info("Training clustering model...")
        
        # Prepare features
        X = self.prepare_features(df)
        
        # Train K-Means
        self.model = KMeans(
            n_clusters=settings.clustering_n_clusters,
            random_state=42,
            n_init=10,
            max_iter=300
        )
        
        labels = self.model.fit_predict(X)
        
        # Calculate quality metrics
        silhouette = silhouette_score(X, labels)
        inertia = self.model.inertia_
        
        # Analyze clusters
        df['cluster'] = labels
        cluster_stats = self._analyze_clusters(df)
        
        logger.info(f"Clustering complete. Silhouette score: {silhouette:.3f}")
        
        return {
            'silhouette_score': float(silhouette),
            'inertia': float(inertia),
            'n_clusters': settings.clustering_n_clusters,
            'cluster_stats': cluster_stats
        }
    
    def predict(self, user_features: Dict) -> Dict:
        """
        Predict cluster for a single user
        
        Args:
            user_features: Dictionary with user feature values
            
        Returns:
            Cluster prediction with confidence
        """
        if not self.model:
            raise ValueError("Model not trained. Call train() first.")
        
        # Prepare features
        feature_values = [user_features.get(f, 0) for f in self.feature_names]
        X = np.array(feature_values).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        
        # Predict cluster
        cluster = self.model.predict(X_scaled)[0]
        
        # Calculate distance to cluster center (confidence)
        distances = self.model.transform(X_scaled)[0]
        confidence = 1 - (distances[cluster] / np.sum(distances))
        
        return {
            'cluster_id': int(cluster),
            'cluster_name': self.segment_labels.get(cluster, f"Cluster {cluster}"),
            'confidence': float(confidence),
            'characteristics': self._get_cluster_characteristics(cluster)
        }
    
    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Predict clusters for multiple users"""
        if not self.model:
            raise ValueError("Model not trained. Call train() first.")
        
        X = self.prepare_features(df)
        clusters = self.model.predict(X)
        
        df['cluster'] = clusters
        df['cluster_name'] = df['cluster'].map(self.segment_labels)
        
        return df
    
    def _analyze_clusters(self, df: pd.DataFrame) -> Dict:
        """Analyze characteristics of each cluster"""
        stats = {}
        
        for cluster_id in range(settings.clustering_n_clusters):
            cluster_df = df[df['cluster'] == cluster_id]
            
            if len(cluster_df) == 0:
                continue
            
            stats[cluster_id] = {
                'name': self.segment_labels.get(cluster_id, f"Cluster {cluster_id}"),
                'count': len(cluster_df),
                'avg_xp': float(cluster_df['total_xp'].mean()),
                'avg_level': float(cluster_df['level'].mean()),
                'avg_quests': float(cluster_df['quests_completed'].mean()),
                'avg_active_days': float(cluster_df['active_days'].mean()),
                'characteristics': self._get_cluster_characteristics(cluster_id)
            }
        
        return stats
    
    def _get_cluster_characteristics(self, cluster_id: int) -> List[str]:
        """Get human-readable characteristics for a cluster"""
        characteristics_map = {
            0: ["Low engagement", "Infrequent activity", "Minimal progress"],
            1: ["Regular activity", "Steady progress", "Balanced participation"],
            2: ["High engagement", "Frequent activity", "Maximum achievements"],
            3: ["Active but struggling", "Low completion rate", "Needs support"],
            4: ["Inactive", "No recent activity", "Risk of dropout"]
        }
        
        return characteristics_map.get(cluster_id, ["Unknown pattern"])
    
    def save(self, path: str = None):
        """Save model and scaler to disk"""
        if not path:
            path = Path(settings.model_path) / "clustering"
        else:
            path = Path(path)
        
        path.mkdir(parents=True, exist_ok=True)
        
        joblib.dump(self.model, path / "model.pkl")
        joblib.dump(self.scaler, path / "scaler.pkl")
        
        logger.info(f"Model saved to {path}")
    
    def load(self, path: str = None):
        """Load model and scaler from disk"""
        if not path:
            path = Path(settings.model_path) / "clustering"
        else:
            path = Path(path)
        
        self.model = joblib.load(path / "model.pkl")
        self.scaler = joblib.load(path / "scaler.pkl")
        
        logger.info(f"Model loaded from {path}")
