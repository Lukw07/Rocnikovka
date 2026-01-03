/**
 * TypeScript client for ML Service API
 */

export interface UserFeatures {
  user_id: string;
  total_xp?: number;
  level?: number;
  money?: number;
  reputation?: number;
  quests_completed?: number;
  achievements_unlocked?: number;
  recent_xp_gained?: number;
  active_days?: number;
  items_owned?: number;
  trades_made?: number;
  events_participated?: number;
  days_inactive?: number;
  account_age_days?: number;
}

export interface ClusterResult {
  cluster_id: number;
  cluster_name: string;
  confidence: number;
  characteristics: string[];
}

export interface QuestRecommendation {
  quest_id: string;
  score: number;
  reason: string;
}

export interface ChurnPrediction {
  user_id: string;
  churn_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: Array<{
    action: string;
    message: string;
    priority: string;
  }>;
}

export interface AnomalyDetection {
  user_id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  confidence: number;
  anomalies_detected: Array<{
    type: string;
    severity: string;
    description: string;
    value: number;
  }>;
}

export interface ModelsStatus {
  clustering: {
    loaded: boolean;
    n_clusters: number | null;
  };
  recommendation: {
    loaded: boolean;
    n_users: number;
    n_quests: number;
  };
  churn: {
    loaded: boolean;
    threshold: number;
  };
  anomaly: {
    loaded: boolean;
    contamination: number;
  };
}

export class MLServiceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.apiKey = apiKey || process.env.ML_SERVICE_API_KEY || 'development-key';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `ML Service error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get cluster prediction for a student
   */
  async clusterStudent(features: UserFeatures): Promise<ClusterResult> {
    return this.request<ClusterResult>('/api/ml/cluster-student', {
      method: 'POST',
      body: JSON.stringify(features),
    });
  }

  /**
   * Get quest recommendations for a student
   */
  async recommendQuests(
    userId: string,
    nRecommendations: number = 5,
    excludeCompleted: string[] = []
  ): Promise<{ user_id: string; recommendations: QuestRecommendation[] }> {
    return this.request('/api/ml/recommend-quests', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        n_recommendations: nRecommendations,
        exclude_completed: excludeCompleted,
      }),
    });
  }

  /**
   * Predict churn probability for a student
   */
  async predictChurn(
    userId: string,
    userFeatures: UserFeatures
  ): Promise<ChurnPrediction> {
    return this.request<ChurnPrediction>('/api/ml/predict-churn', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        user_features: userFeatures,
      }),
    });
  }

  /**
   * Detect anomalies in student behavior
   */
  async detectAnomalies(
    userId: string,
    userFeatures: UserFeatures
  ): Promise<AnomalyDetection> {
    return this.request<AnomalyDetection>('/api/ml/detect-anomalies', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        user_features: userFeatures,
      }),
    });
  }

  /**
   * Get batch predictions for multiple students
   */
  async batchPredictions(users: UserFeatures[]): Promise<{
    total_users: number;
    predictions: Array<{
      user_id: string;
      cluster: ClusterResult;
      churn: ChurnPrediction;
      anomaly: AnomalyDetection;
    }>;
  }> {
    return this.request('/api/ml/batch-predictions', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
  }

  /**
   * Check health status of ML service
   */
  async healthCheck(): Promise<{
    status: string;
    models_loaded: Record<string, boolean>;
  }> {
    return this.request('/health');
  }

  /**
   * Get models status
   */
  async getModelsStatus(): Promise<ModelsStatus> {
    return this.request<ModelsStatus>('/api/ml/models/status');
  }

  /**
   * Clear ML service cache
   */
  async clearCache(pattern: string = '*'): Promise<{ message: string }> {
    return this.request(`/api/ml/cache/clear?pattern=${pattern}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const mlClient = new MLServiceClient();
