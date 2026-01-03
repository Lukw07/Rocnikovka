"""Database utilities for data extraction and connection management"""
import pandas as pd
from sqlalchemy import create_engine, text
from typing import Optional, Dict, Any
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Manages database connections and queries"""
    
    def __init__(self):
        self.engine = create_engine(settings.database_url)
    
    def get_training_data(self, days: int = 90) -> pd.DataFrame:
        """
        Extract training data for ML models
        
        Args:
            days: Number of days to look back
            
        Returns:
            DataFrame with user features
        """
        query = text("""
            WITH user_stats AS (
                SELECT 
                    u.id as user_id,
                    u.xp as total_xp,
                    u.level,
                    u.money,
                    u.reputation_points as reputation,
                    COALESCE(COUNT(DISTINCT qc.id), 0) as quests_completed,
                    COALESCE(COUNT(DISTINCT a.id), 0) as achievements_unlocked,
                    COALESCE(SUM(CASE WHEN xa.created_at >= NOW() - INTERVAL ':days days' THEN xa.amount ELSE 0 END), 0) as recent_xp_gained,
                    COALESCE(COUNT(DISTINCT CASE WHEN xa.created_at >= NOW() - INTERVAL ':days days' THEN DATE(xa.created_at) END), 0) as active_days,
                    COALESCE(COUNT(DISTINCT ii.id), 0) as items_owned,
                    COALESCE(COUNT(DISTINCT t.id), 0) as trades_made,
                    COALESCE(COUNT(DISTINCT e.id), 0) as events_participated,
                    COALESCE(MAX(xa.created_at), u.created_at) as last_activity,
                    EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(xa.created_at), u.created_at)))/86400 as days_inactive,
                    u.created_at as account_created
                FROM "User" u
                LEFT JOIN "QuestCompletion" qc ON qc.user_id = u.id
                LEFT JOIN "UserAchievement" ua ON ua.user_id = u.id
                LEFT JOIN "Achievement" a ON a.id = ua.achievement_id
                LEFT JOIN "XPAudit" xa ON xa.user_id = u.id
                LEFT JOIN "InventoryItem" ii ON ii.user_id = u.id
                LEFT JOIN "Trade" t ON (t.sender_id = u.id OR t.receiver_id = u.id) AND t.status = 'COMPLETED'
                LEFT JOIN "EventParticipant" ep ON ep.user_id = u.id
                LEFT JOIN "Event" e ON e.id = ep.event_id AND e.status = 'ACTIVE'
                WHERE u.role = 'STUDENT'
                GROUP BY u.id
            )
            SELECT 
                user_id,
                total_xp,
                level,
                money,
                reputation,
                quests_completed,
                achievements_unlocked,
                recent_xp_gained,
                active_days,
                items_owned,
                trades_made,
                events_participated,
                last_activity,
                days_inactive,
                account_created,
                EXTRACT(EPOCH FROM (NOW() - account_created))/86400 as account_age_days
            FROM user_stats
        """).bindparams(days=days)
        
        try:
            df = pd.read_sql(query, self.engine)
            logger.info(f"Loaded {len(df)} user records for training")
            return df
        except Exception as e:
            logger.error(f"Error loading training data: {e}")
            return pd.DataFrame()
    
    def get_quest_data(self) -> pd.DataFrame:
        """Get quest data for recommendation system"""
        query = text("""
            SELECT 
                q.id as quest_id,
                q.title,
                q.category,
                q.difficulty,
                q.xp_reward,
                q.money_reward,
                COUNT(qc.id) as completion_count,
                AVG(CASE WHEN qc.completed_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (qc.completed_at - qc.started_at))/3600 
                    END) as avg_completion_hours
            FROM "Quest" q
            LEFT JOIN "QuestCompletion" qc ON qc.quest_id = q.id
            WHERE q.status = 'ACTIVE'
            GROUP BY q.id
        """)
        
        try:
            return pd.read_sql(query, self.engine)
        except Exception as e:
            logger.error(f"Error loading quest data: {e}")
            return pd.DataFrame()
    
    def get_user_quest_interactions(self) -> pd.DataFrame:
        """Get user-quest interaction matrix for collaborative filtering"""
        query = text("""
            SELECT 
                qc.user_id,
                qc.quest_id,
                CASE 
                    WHEN qc.completed_at IS NOT NULL THEN 1.0
                    WHEN qc.status = 'IN_PROGRESS' THEN 0.5
                    ELSE 0.0
                END as rating
            FROM "QuestCompletion" qc
            JOIN "User" u ON u.id = qc.user_id
            WHERE u.role = 'STUDENT'
        """)
        
        try:
            return pd.read_sql(query, self.engine)
        except Exception as e:
            logger.error(f"Error loading quest interactions: {e}")
            return pd.DataFrame()
    
    def get_user_activity_timeline(self, user_id: str, days: int = 30) -> pd.DataFrame:
        """Get detailed activity timeline for anomaly detection"""
        query = text("""
            SELECT 
                xa.created_at as timestamp,
                xa.amount as xp_gained,
                xa.reason,
                u.level,
                u.money
            FROM "XPAudit" xa
            JOIN "User" u ON u.id = xa.user_id
            WHERE xa.user_id = :user_id 
                AND xa.created_at >= NOW() - INTERVAL ':days days'
            ORDER BY xa.created_at
        """).bindparams(user_id=user_id, days=days)
        
        try:
            return pd.read_sql(query, self.engine)
        except Exception as e:
            logger.error(f"Error loading activity timeline: {e}")
            return pd.DataFrame()


# Global database instance
db = DatabaseConnection()
