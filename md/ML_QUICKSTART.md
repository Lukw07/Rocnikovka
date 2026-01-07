# 🚀 ML System Quick Start

## 5-Minute Setup

```bash
# 1. Setup Python Service
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env

# 2. Edit .env (DŮLEŽITÉ!)
# DATABASE_URL=postgresql://user:pass@localhost:5432/edurpg

# 3. Train Models (2-5 minut)
python app/training/train_all.py

# 4. Start Service
uvicorn app.main:app --reload --port 8000

# 5. Test
curl http://localhost:8000/health
```

## Použití v Next.js

### Student - Quest Recommendations

```typescript
// GET /api/ml/quest-recommendations
// Vrátí 5 personalizovaných questů
const response = await fetch('/api/ml/quest-recommendations');
const { recommendations } = await response.json();

recommendations.forEach(quest => {
  console.log(quest.title, quest.ml_score, quest.ml_reason);
});
```

### Teacher - Churn Dashboard

```typescript
// GET /api/ml/churn-predictions
const response = await fetch('/api/ml/churn-predictions');
const { risk_counts, predictions } = await response.json();

console.log(`HIGH risk: ${risk_counts.HIGH}`);
console.log(`MEDIUM risk: ${risk_counts.MEDIUM}`);

// Zobraz students at risk
predictions.filter(p => p.risk_level === 'HIGH').forEach(student => {
  console.log(student.user_id, student.churn_probability);
  student.recommendations.forEach(rec => {
    console.log(`- ${rec.message}`);
  });
});
```

### TypeScript Direct Usage

```typescript
import { mlClient } from '@/app/lib/ml/ml-client';
import { extractUserFeatures } from '@/app/lib/ml/feature-extraction';

// Get student segment
const features = await extractUserFeatures(userId);
const cluster = await mlClient.clusterStudent(features);
console.log(cluster.cluster_name); // "Engaged", "Power User", etc.

// Get recommendations
const recs = await mlClient.recommendQuests(userId, 5);

// Predict churn
const churn = await mlClient.predictChurn(userId, features);
if (churn.risk_level === 'HIGH') {
  alert('Student at risk!');
}

// Detect anomalies
const anomaly = await mlClient.detectAnomalies(userId, features);
if (anomaly.is_anomaly) {
  console.log('Suspicious activity detected');
}
```

## Docker (Production)

```bash
# Start everything
docker-compose up -d

# Train models in container
docker exec -it edurpg-ml-service python app/training/train_all.py

# Check status
docker logs edurpg-ml-service -f
```

## ML Dashboard

**URL:** http://localhost:3000/dashboard/ml (Teacher only)

**Features:**
- ML service status monitor
- Churn predictions with risk levels
- Recommended interventions
- Model loading status

## API Endpoints

### Health & Status
```bash
GET /health                    # Basic health check
GET /api/ml/models/status      # Detailed model status
```

### Predictions
```bash
POST /api/ml/cluster-student          # Student segmentation
POST /api/ml/recommend-quests         # Quest recommendations
POST /api/ml/predict-churn            # Churn prediction
POST /api/ml/detect-anomalies         # Anomaly detection
POST /api/ml/batch-predictions        # All predictions for multiple users
```

### Cache Management
```bash
DELETE /api/ml/cache/clear?pattern=*  # Clear cache
```

## Retraining

```bash
# Weekly (recommended)
cd ml-service
python app/training/train_all.py

# Individual models
python app/training/train_clustering.py
python app/training/train_recommendation.py
python app/training/train_churn.py
python app/training/train_anomaly.py
```

## Troubleshooting

### Service not starting
```bash
# Check Python version
python --version  # Need 3.11+

# Check dependencies
pip install -r requirements.txt

# Check DATABASE_URL
echo %DATABASE_URL%
```

### Models not loaded
```bash
# Train models
python app/training/train_all.py

# Check models directory
dir models\  # Should contain clustering/, recommendation/, churn/, anomaly/
```

### Poor predictions
```bash
# Clear cache
curl -X DELETE -H "X-API-Key: development-key" \
  http://localhost:8000/api/ml/cache/clear

# Retrain with fresh data
python app/training/train_all.py
```

### Connection errors
```bash
# Test PostgreSQL
psql -h localhost -U edurpg_user -d edurpg

# Test Redis
redis-cli ping
```

## Key Files

| File | Purpose |
|------|---------|
| `ml-service/app/main.py` | FastAPI application |
| `ml-service/app/models/*.py` | ML model implementations |
| `ml-service/app/training/*.py` | Training scripts |
| `app/lib/ml/ml-client.ts` | TypeScript HTTP client |
| `app/api/ml/*/route.ts` | Next.js API routes |
| `app/dashboard/ml/page.tsx` | ML dashboard |

## Environment Variables

### ML Service (.env)
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/edurpg
REDIS_URL=redis://localhost:6379/0
API_KEY=your-secret-key
```

### Next.js (.env)
```bash
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_API_KEY=your-secret-key
```

## Performance

- **Training:** 15-30 seconds (all models)
- **Prediction latency:** <50ms per request
- **Cache hit rate:** 80-90%
- **Throughput:** 1000+ predictions/sec

## Models Overview

| Model | Algorithm | Use Case | Output |
|-------|-----------|----------|--------|
| Clustering | K-Means | Student segmentation | 5 segments |
| Recommendation | Collaborative + Content | Personalized quests | Top 5 quests |
| Churn | Random Forest | Dropout prediction | Risk level + actions |
| Anomaly | Isolation Forest | Fraud detection | Suspicious flags |

---

**Pro kompletní dokumentaci viz:**
- `ML_SYSTEM_DOCUMENTATION.md` - Architektura
- `ml-service/README.md` - Detailní setup
- `ML_IMPLEMENTATION_COMPLETE.md` - Implementační summary
