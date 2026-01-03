"""Anomaly detection model for identifying suspicious activities"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import logging
from pathlib import Path
from typing import Dict, List
from app.config import settings

logger = logging.getLogger(__name__)


class AnomalyDetectionModel:
    """
    Detects anomalous behavior patterns that may indicate:
    - Cheating or exploits
    - Unusual XP gains
    - Suspicious trading patterns
    - Account sharing
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'xp_per_day',
            'quests_per_day',
            'money_earned_rate',
            'achievement_rate',
            'trade_frequency',
            'activity_variance',
            'session_length_avg'
        ]
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Calculate derived features for anomaly detection"""
        df = df.copy()
        
        # Calculate rates and ratios
        df['xp_per_day'] = df['recent_xp_gained'] / (df['active_days'] + 1)
        df['quests_per_day'] = df['quests_completed'] / (df['account_age_days'] + 1)
        df['money_earned_rate'] = df['money'] / (df['account_age_days'] + 1)
        df['achievement_rate'] = df['achievements_unlocked'] / (df['account_age_days'] + 1)
        df['trade_frequency'] = df['trades_made'] / (df['account_age_days'] + 1)
        
        # Activity variance (indicator of suspicious patterns)
        df['activity_variance'] = df['recent_xp_gained'] / (df['total_xp'] + 1)
        
        # Session length (estimate from activity patterns)
        df['session_length_avg'] = df['total_xp'] / (df['active_days'] + 1)
        
        # Fill missing values
        df = df.fillna(0)
        
        # Replace infinities
        df = df.replace([np.inf, -np.inf], 0)
        
        X = df[self.feature_names].values
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled
    
    def train(self, df: pd.DataFrame) -> Dict:
        """
        Train anomaly detection model
        
        Args:
            df: Training data with user features
            
        Returns:
            Training metrics
        """
        logger.info("Training anomaly detection model...")
        
        # Prepare features
        X = self.prepare_features(df)
        
        # Train Isolation Forest
        self.model = IsolationForest(
            contamination=settings.anomaly_contamination,
            random_state=42,
            n_estimators=100,
            max_samples='auto'
        )
        
        predictions = self.model.fit_predict(X)
        
        # Calculate metrics
        n_anomalies = (predictions == -1).sum()
        anomaly_rate = n_anomalies / len(predictions)
        
        logger.info(f"Anomaly detection trained. Found {n_anomalies} anomalies ({anomaly_rate:.2%})")
        
        return {
            'n_samples': len(df),
            'n_anomalies': int(n_anomalies),
            'anomaly_rate': float(anomaly_rate),
            'contamination': settings.anomaly_contamination
        }
    
    def predict(self, user_features: Dict) -> Dict:
        """
        Check if user activity is anomalous
        
        Args:
            user_features: Dictionary with user feature values
            
        Returns:
            Anomaly detection result with score and details
        """
        if not self.model:
            raise ValueError("Model not trained. Call train() first.")
        
        # Calculate derived features
        active_days = max(user_features.get('active_days', 1), 1)
        account_age = max(user_features.get('account_age_days', 1), 1)
        
        features = {
            'xp_per_day': user_features.get('recent_xp_gained', 0) / active_days,
            'quests_per_day': user_features.get('quests_completed', 0) / account_age,
            'money_earned_rate': user_features.get('money', 0) / account_age,
            'achievement_rate': user_features.get('achievements_unlocked', 0) / account_age,
            'trade_frequency': user_features.get('trades_made', 0) / account_age,
            'activity_variance': user_features.get('recent_xp_gained', 0) / max(user_features.get('total_xp', 1), 1),
            'session_length_avg': user_features.get('total_xp', 0) / active_days
        }
        
        # Prepare features
        feature_values = [features[f] for f in self.feature_names]
        X = np.array(feature_values).reshape(1, -1)
        
        # Replace infinities
        X = np.nan_to_num(X, nan=0, posinf=0, neginf=0)
        
        X_scaled = self.scaler.transform(X)
        
        # Predict
        prediction = self.model.predict(X_scaled)[0]
        score = self.model.score_samples(X_scaled)[0]
        
        is_anomaly = prediction == -1
        
        # Analyze specific anomalies
        anomalies = self._analyze_anomalies(features, is_anomaly)
        
        return {
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(score),
            'confidence': float(abs(score)),
            'anomalies_detected': anomalies
        }
    
    def _analyze_anomalies(self, features: Dict, is_anomaly: bool) -> List[Dict]:
        """Identify specific types of anomalies"""
        anomalies = []
        
        if not is_anomaly:
            return anomalies
        
        # Check for unusual XP gain
        if features['xp_per_day'] > 5000:  # Threshold based on game balance
            anomalies.append({
                'type': 'UNUSUAL_XP_GAIN',
                'severity': 'HIGH',
                'description': f"XP gain rate ({features['xp_per_day']:.0f}/day) is unusually high",
                'value': features['xp_per_day']
            })
        
        # Check for excessive quest completion
        if features['quests_per_day'] > 10:
            anomalies.append({
                'type': 'EXCESSIVE_QUEST_COMPLETION',
                'severity': 'MEDIUM',
                'description': f"Quest completion rate ({features['quests_per_day']:.1f}/day) is suspicious",
                'value': features['quests_per_day']
            })
        
        # Check for unusual trading activity
        if features['trade_frequency'] > 5:
            anomalies.append({
                'type': 'UNUSUAL_TRADING',
                'severity': 'MEDIUM',
                'description': f"Trading frequency ({features['trade_frequency']:.1f}/day) is unusually high",
                'value': features['trade_frequency']
            })
        
        # Check for sudden activity spike
        if features['activity_variance'] > 0.8:
            anomalies.append({
                'type': 'SUDDEN_ACTIVITY_SPIKE',
                'severity': 'LOW',
                'description': "Recent activity shows unusual spike compared to historical patterns",
                'value': features['activity_variance']
            })
        
        # Check for extreme session length
        if features['session_length_avg'] > 10000:
            anomalies.append({
                'type': 'EXTREME_SESSION_LENGTH',
                'severity': 'MEDIUM',
                'description': "Average session XP gain suggests unusually long sessions",
                'value': features['session_length_avg']
            })
        
        return anomalies
    
    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect anomalies for multiple users"""
        if not self.model:
            raise ValueError("Model not trained. Call train() first.")
        
        X = self.prepare_features(df)
        predictions = self.model.predict(X)
        scores = self.model.score_samples(X)
        
        df['is_anomaly'] = predictions == -1
        df['anomaly_score'] = scores
        
        return df
    
    def save(self, path: str = None):
        """Save model and scaler to disk"""
        if not path:
            path = Path(settings.model_path) / "anomaly"
        else:
            path = Path(path)
        
        path.mkdir(parents=True, exist_ok=True)
        
        joblib.dump(self.model, path / "model.pkl")
        joblib.dump(self.scaler, path / "scaler.pkl")
        
        logger.info(f"Model saved to {path}")
    
    def load(self, path: str = None):
        """Load model and scaler from disk"""
        if not path:
            path = Path(settings.model_path) / "churn"
        else:
            path = Path(path)
        
        self.model = joblib.load(path / "model.pkl")
        self.scaler = joblib.load(path / "scaler.pkl")
        
        logger.info(f"Model loaded from {path}")
