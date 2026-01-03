"""Churn prediction model to identify students at risk of dropping out"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import logging
from pathlib import Path
from typing import Dict
from app.config import settings

logger = logging.getLogger(__name__)


class ChurnPredictionModel:
    """
    Predicts probability of student churn (becoming inactive)
    
    Risk indicators:
    - Decreased activity frequency
    - Streak breaks
    - Low engagement with content
    - Long periods of inactivity
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'days_inactive',
            'active_days',
            'quests_completed',
            'recent_xp_gained',
            'total_xp',
            'level',
            'achievements_unlocked',
            'events_participated',
            'account_age_days'
        ]
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare features for training/prediction"""
        df = df.fillna(0)
        X = df[self.feature_names].values
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled
    
    def create_labels(self, df: pd.DataFrame) -> np.ndarray:
        """
        Create churn labels based on inactivity
        Label = 1 if churned (inactive > 14 days), 0 otherwise
        """
        return (df['days_inactive'] > 14).astype(int).values
    
    def train(self, df: pd.DataFrame) -> Dict:
        """
        Train churn prediction model
        
        Args:
            df: Training data with user features
            
        Returns:
            Training metrics
        """
        logger.info("Training churn prediction model...")
        
        # Prepare features and labels
        X = self.prepare_features(df)
        y = self.create_labels(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            class_weight='balanced'
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
            'churn_rate': float(y.mean()),
            'n_churned': int(y.sum()),
            'n_active': int((y == 0).sum())
        }
        
        # Feature importance
        feature_importance = dict(zip(
            self.feature_names,
            self.model.feature_importances_
        ))
        metrics['feature_importance'] = {
            k: float(v) for k, v in sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )
        }
        
        logger.info(f"Churn model trained. Accuracy: {metrics['accuracy']:.3f}, F1: {metrics['f1_score']:.3f}")
        
        return metrics
    
    def predict(self, user_features: Dict) -> Dict:
        """
        Predict churn probability for a user
        
        Args:
            user_features: Dictionary with user feature values
            
        Returns:
            Churn prediction with risk level and recommendations
        """
        if not self.model:
            raise ValueError("Model not trained. Call train() first.")
        
        # Prepare features
        feature_values = [user_features.get(f, 0) for f in self.feature_names]
        X = np.array(feature_values).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        
        # Predict
        churn_proba = self.model.predict_proba(X_scaled)[0][1]
        
        # Determine risk level
        if churn_proba < 0.3:
            risk_level = "LOW"
        elif churn_proba < 0.6:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        # Generate recommendations
        recommendations = self._generate_recommendations(user_features, churn_proba)
        
        return {
            'churn_probability': float(churn_proba),
            'risk_level': risk_level,
            'recommendations': recommendations
        }
    
    def _generate_recommendations(self, features: Dict, churn_proba: float) -> list:
        """Generate personalized recommendations to reduce churn risk"""
        recommendations = []
        
        # Check specific risk factors
        days_inactive = features.get('days_inactive', 0)
        quests_completed = features.get('quests_completed', 0)
        events_participated = features.get('events_participated', 0)
        
        if days_inactive > 7:
            recommendations.append({
                'action': 'SEND_REMINDER',
                'message': 'Send personalized reminder about progress',
                'priority': 'HIGH'
            })
        
        if quests_completed < 5:
            recommendations.append({
                'action': 'SUGGEST_EASY_QUESTS',
                'message': 'Recommend easy quests to build confidence',
                'priority': 'MEDIUM'
            })
        
        if events_participated == 0:
            recommendations.append({
                'action': 'INVITE_TO_EVENT',
                'message': 'Invite to upcoming special event',
                'priority': 'MEDIUM'
            })
        
        if churn_proba > 0.7:
            recommendations.append({
                'action': 'TEACHER_INTERVENTION',
                'message': 'Alert teacher for personal check-in',
                'priority': 'HIGH'
            })
            recommendations.append({
                'action': 'SPECIAL_REWARD',
                'message': 'Offer special comeback bonus',
                'priority': 'HIGH'
            })
        
        return recommendations
    
    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Predict churn for multiple users"""
        if not self.model:
            raise ValueError("Model not trained. Call train() first.")
        
        X = self.prepare_features(df)
        probas = self.model.predict_proba(X)[:, 1]
        
        df['churn_probability'] = probas
        df['risk_level'] = pd.cut(
            probas,
            bins=[0, 0.3, 0.6, 1.0],
            labels=['LOW', 'MEDIUM', 'HIGH']
        )
        
        return df
    
    def save(self, path: str = None):
        """Save model and scaler to disk"""
        if not path:
            path = Path(settings.model_path) / "churn"
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
