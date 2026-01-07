# 🧠 Machine Learning System pro EduRPG

## Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌────────────────┐      ┌──────────────────────────────┐  │
│  │  TypeScript    │─────▶│  Python ML Service           │  │
│  │  API Routes    │◀─────│  (Flask/FastAPI)             │  │
│  └────────────────┘      └──────────────────────────────┘  │
│         │                          │                         │
│         │                          │                         │
│         ▼                          ▼                         │
│  ┌────────────────┐      ┌──────────────────────────────┐  │
│  │   PostgreSQL   │      │  ML Models (scikit-learn)    │  │
│  │   Database     │      │  - Clustering                 │  │
│  └────────────────┘      │  - Prediction                 │  │
│                          │  - Recommendation             │  │
│                          └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## ML Features

### 1. Player Clustering (Segmentace hráčů)
**Algoritmus:** K-Means clustering  
**Data:** XP, level, activity, spending, quest completion rate  
**Výstup:** 4-5 segmentů (Casual, Engaged, Power User, Struggling, etc.)

### 2. Quest Difficulty Prediction
**Algoritmus:** Random Forest  
**Data:** Quest category, student level, past performance  
**Výstup:** Predikovaná difficulty a completion probability

### 3. Personalized Quest Recommendations
**Algoritmus:** Collaborative Filtering + Content-Based  
**Data:** Quest history, student profile, preferences  
**Výstup:** Top 5 doporučených questů pro každého studenta

### 4. Churn Prediction (Risk of Dropout)
**Algoritmus:** Logistic Regression / XGBoost  
**Data:** Activity patterns, streak breaks, engagement metrics  
**Výstup:** Probability of student becoming inactive

### 5. Anomaly Detection
**Algoritmus:** Isolation Forest  
**Data:** Transaction patterns, quest completion times  
**Výstup:** Suspicious activities (cheating, exploits)

## Tech Stack

### Python ML Service
- **Flask/FastAPI** - REST API
- **scikit-learn** - ML algorithms
- **pandas** - data processing
- **numpy** - numerical operations
- **joblib** - model persistence

### Integration
- **HTTP API** - komunikace mezi Next.js a Python
- **PostgreSQL** - sdílená databáze
- **Redis** - caching predictions
- **Docker** - containerization

## Struktura

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app
│   ├── models/
│   │   ├── clustering.py        # K-Means clustering
│   │   ├── prediction.py        # Quest difficulty prediction
│   │   ├── recommendation.py    # Quest recommendations
│   │   ├── churn.py            # Churn prediction
│   │   └── anomaly.py          # Anomaly detection
│   ├── training/
│   │   ├── train_clustering.py
│   │   ├── train_prediction.py
│   │   └── train_recommendation.py
│   ├── data/
│   │   └── preprocessing.py
│   └── utils/
│       └── database.py
├── models/                      # Trained model files (.pkl)
├── notebooks/                   # Jupyter notebooks pro experimenty
├── requirements.txt
├── Dockerfile
└── README.md
```

## Installation

### 1. Python ML Service
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # nebo venv\Scripts\activate na Windows
pip install -r requirements.txt
```

### 2. Training Models
```bash
python app/training/train_clustering.py
python app/training/train_prediction.py
python app/training/train_recommendation.py
```

### 3. Run Service
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Clustering
```http
POST /api/ml/cluster-students
Response: {
  "segments": {
    "casual": ["user1", "user2"],
    "engaged": ["user3"],
    ...
  }
}
```

### Quest Recommendation
```http
POST /api/ml/recommend-quests
Body: { "userId": "xxx", "count": 5 }
Response: {
  "recommendations": [
    { "questId": "q1", "score": 0.95, "reason": "Based on your interests" },
    ...
  ]
}
```

### Difficulty Prediction
```http
POST /api/ml/predict-difficulty
Body: { "questId": "xxx", "userId": "yyy" }
Response: {
  "predictedDifficulty": "MEDIUM",
  "completionProbability": 0.78,
  "estimatedTime": "45 minutes"
}
```

### Churn Prediction
```http
POST /api/ml/predict-churn
Body: { "userId": "xxx" }
Response: {
  "churnProbability": 0.32,
  "riskLevel": "LOW",
  "recommendedActions": ["Send reminder", "Offer special quest"]
}
```

### Anomaly Detection
```http
POST /api/ml/detect-anomalies
Body: { "userId": "xxx", "period": "7d" }
Response: {
  "anomalies": [
    {
      "type": "unusual_xp_gain",
      "score": 0.85,
      "description": "XP gain 5x higher than normal"
    }
  ]
}
```

## Integration s Next.js

### TypeScript Client
```typescript
// app/lib/ml/ml-client.ts
export class MLClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  async recommendQuests(userId: string, count: number = 5) {
    const response = await fetch(`${this.baseUrl}/api/ml/recommend-quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, count }),
    });
    return response.json();
  }

  async predictChurn(userId: string) {
    const response = await fetch(`${this.baseUrl}/api/ml/predict-churn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  }

  async detectAnomalies(userId: string, period: string = '7d') {
    const response = await fetch(`${this.baseUrl}/api/ml/detect-anomalies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, period }),
    });
    return response.json();
  }
}
```

## Training Pipeline

### 1. Data Collection
```python
# Každý den se automaticky sbírají data
from app.utils.database import get_training_data

data = get_training_data(days=90)
# Features: xp, level, quests_completed, activity_days, etc.
```

### 2. Feature Engineering
```python
features = [
    'total_xp',
    'average_level',
    'quests_completed',
    'active_days',
    'spending_rate',
    'quest_variety',
    'guild_participation',
    'achievement_count',
]
```

### 3. Model Training
```python
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier

# Clustering
kmeans = KMeans(n_clusters=5, random_state=42)
kmeans.fit(X)

# Prediction
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)
```

### 4. Model Evaluation
```python
from sklearn.metrics import accuracy_score, silhouette_score

# Clustering quality
silhouette = silhouette_score(X, labels)

# Prediction accuracy
accuracy = accuracy_score(y_test, predictions)
```

### 5. Model Persistence
```python
import joblib

joblib.dump(kmeans, 'models/clustering_model.pkl')
joblib.dump(rf, 'models/prediction_model.pkl')
```

## Deployment

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  ml-service:
    build: ./ml-service
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/edurpg
    depends_on:
      - db
```

## Monitoring

### Model Performance Dashboard
- Accuracy metrics
- Prediction latency
- Model drift detection
- Retraining triggers

### Logging
```python
import logging

logger = logging.getLogger(__name__)
logger.info(f"Prediction made: {prediction}, confidence: {confidence}")
```

## Best Practices

### 1. Regular Retraining
- Retrain models weekly with fresh data
- A/B test new models vs. old

### 2. Feature Scaling
- Normalize features before clustering
- StandardScaler for continuous variables

### 3. Cross-Validation
- K-fold cross-validation during training
- Prevent overfitting

### 4. Caching
- Cache predictions for 1 hour
- Invalidate on user actions

### 5. Fallbacks
- If ML service down, use rule-based fallback
- Graceful degradation

## Roadmap

### Phase 1: Foundation ✅
- [ ] Setup Python ML service
- [ ] Implement clustering
- [ ] Basic recommendations
- [ ] Integration with Next.js

### Phase 2: Advanced Models
- [ ] Quest difficulty prediction
- [ ] Churn prediction
- [ ] Anomaly detection

### Phase 3: Text Generation
- [ ] Fine-tune GPT-2 for quest generation
- [ ] Story generation for events

### Phase 4: Reinforcement Learning
- [ ] Dynamic difficulty adjustment
- [ ] Reward optimization
- [ ] Economy balancing

## Resources

- **scikit-learn docs**: https://scikit-learn.org
- **FastAPI docs**: https://fastapi.tiangolo.com
- **ML best practices**: https://developers.google.com/machine-learning/guides
