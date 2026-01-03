"""Model initialization module"""
from app.models.clustering import StudentClusteringModel
from app.models.recommendation import QuestRecommendationModel
from app.models.churn import ChurnPredictionModel
from app.models.anomaly import AnomalyDetectionModel

__all__ = [
    'StudentClusteringModel',
    'QuestRecommendationModel',
    'ChurnPredictionModel',
    'AnomalyDetectionModel'
]
