# 🧠 EduRPG Machine Learning System

## Přehled

Kompletní ML systém pro EduRPG s **reálnými machine learning modely**:

- ✅ **Student Clustering** (K-Means) - segmentace studentů
- ✅ **Quest Recommendations** (Collaborative Filtering) - personalizované doporučení
- ✅ **Churn Prediction** (Random Forest) - predikce rizika odchodu
- ✅ **Anomaly Detection** (Isolation Forest) - detekce podvodů

## 🚀 Rychlý Start

### 1. Setup Python ML Service

```bash
cd ml-service

# Vytvoř virtual environment
python -m venv venv

# Aktivuj (Windows)
venv\Scripts\activate

# Aktivuj (Linux/Mac)
source venv/bin/activate

# Instaluj dependencies
pip install -r requirements.txt

# Zkopíruj .env
copy .env.example .env
```

### 2. Natrénuj Modely

```bash
# Zkontroluj, že PostgreSQL běží a obsahuje data
# Spusť training všech modelů
python app/training/train_all.py
```

Trénování trvá 2-5 minut a vytvoří soubory v `models/`:
- `clustering/model.pkl` + `scaler.pkl`
- `recommendation/model.pkl`
- `churn/model.pkl` + `scaler.pkl`
- `anomaly/model.pkl` + `scaler.pkl`

### 3. Spusť ML Service

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production (Docker)
docker-compose up -d ml-service
```

### 4. Přidej ENV do Next.js

Do `.env`:
```bash
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_API_KEY=development-key
```

### 5. Otestuj API

```bash
# Health check
curl http://localhost:8000/health

# Models status
curl -H "X-API-Key: development-key" \
  http://localhost:8000/api/ml/models/status
```

## 📊 ML Features

### 1. Student Clustering

**Segmentuje studenty do 5 kategorií:**

- **Casual** - Nízká aktivita, příležitostná účast
- **Engaged** - Pravidelná aktivita, stabilní progres
- **Power User** - Vysoká aktivita, maximum achievementů
- **Struggling** - Aktivní ale s nízkou úspěšností
- **Inactive** - Žádná nedávná aktivita

**API Usage:**
```typescript
import { mlClient } from '@/app/lib/ml/ml-client';

const cluster = await mlClient.clusterStudent({
  user_id: 'xxx',
  total_xp: 5000,
  level: 10,
  quests_completed: 25,
  // ... další features
});

console.log(cluster.cluster_name); // "Engaged"
console.log(cluster.confidence); // 0.87
```

### 2. Quest Recommendations

**Personalizované doporučení questů pomocí:**
- Collaborative filtering (podobnost mezi uživateli)
- Content-based filtering (vlastnosti questů)
- Hybrid approach (70% CF + 30% CB)

**API Usage:**
```typescript
const recommendations = await mlClient.recommendQuests(
  'user-id',
  5, // počet doporučení
  ['quest1', 'quest2'] // exclude completed
);

recommendations.recommendations.forEach(rec => {
  console.log(rec.quest_id, rec.score, rec.reason);
});
```

**Next.js Route:**
```typescript
// GET /api/ml/quest-recommendations
// Automaticky vrací personalizované questy pro přihlášeného studenta
```

### 3. Churn Prediction

**Predikuje pravděpodobnost, že student přestane být aktivní:**

- **Features:** days_inactive, active_days, quests_completed, atd.
- **Model:** Random Forest (100 trees)
- **Output:** Probability (0-1), Risk Level (LOW/MEDIUM/HIGH), Recommendations

**Risk Levels:**
- **LOW** (< 30%) - Student je aktivní
- **MEDIUM** (30-60%) - Sledovat aktivitu
- **HIGH** (> 60%) - Urgentní intervence potřebná

**API Usage:**
```typescript
const churn = await mlClient.predictChurn('user-id', features);

if (churn.risk_level === 'HIGH') {
  // Zobraz upozornění učiteli
  churn.recommendations.forEach(rec => {
    console.log(rec.action, rec.message, rec.priority);
  });
}
```

**Next.js Route (Teacher only):**
```typescript
// GET /api/ml/churn-predictions
// Vrací predikce pro všechny studenty seřazené podle rizika
```

### 4. Anomaly Detection

**Detekuje podezřelé aktivity:**

- Unusual XP gain (příliš rychlý progres)
- Excessive quest completion (podezřele mnoho questů)
- Unusual trading patterns
- Sudden activity spikes
- Extreme session lengths

**API Usage:**
```typescript
const anomaly = await mlClient.detectAnomalies('user-id', features);

if (anomaly.is_anomaly) {
  anomaly.anomalies_detected.forEach(a => {
    console.log(a.type, a.severity, a.description);
    // "UNUSUAL_XP_GAIN", "HIGH", "XP gain rate (8500/day) is unusually high"
  });
}
```

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌────────────────┐      ┌──────────────────────────────┐  │
│  │  TypeScript    │◀────▶│  Python ML Service           │  │
│  │  API Routes    │ HTTP │  (FastAPI on port 8000)      │  │
│  │  /api/ml/*     │      │                              │  │
│  └────────────────┘      └──────────────────────────────┘  │
│         │                          │                         │
│         │                          │                         │
│         ▼                          ▼                         │
│  ┌────────────────┐      ┌──────────────────────────────┐  │
│  │   PostgreSQL   │◀─────│  scikit-learn Models         │  │
│  │   Database     │      │  - KMeans                     │  │
│  └────────────────┘      │  - Random Forest              │  │
│                          │  - Isolation Forest           │  │
│  ┌────────────────┐      │  - Cosine Similarity          │  │
│  │     Redis      │◀─────│  Cached predictions          │  │
│  │    (Cache)     │      │  (1h TTL)                     │  │
│  └────────────────┘      └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Struktura Projektu

```
EduRPG/
├── ml-service/                 # Python ML service
│   ├── app/
│   │   ├── main.py            # FastAPI aplikace
│   │   ├── config.py          # Konfigurace
│   │   ├── models/            # ML modely
│   │   │   ├── clustering.py
│   │   │   ├── recommendation.py
│   │   │   ├── churn.py
│   │   │   └── anomaly.py
│   │   ├── training/          # Training skripty
│   │   │   ├── train_all.py
│   │   │   ├── train_clustering.py
│   │   │   ├── train_recommendation.py
│   │   │   ├── train_churn.py
│   │   │   └── train_anomaly.py
│   │   └── utils/             # Utilities
│   │       ├── database.py    # Prisma data extraction
│   │       └── cache.py       # Redis caching
│   ├── models/                # Trained models (.pkl files)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── app/lib/ml/                # TypeScript ML client
│   ├── ml-client.ts           # HTTP client
│   └── feature-extraction.ts  # Extract features from DB
│
├── app/api/ml/                # Next.js API routes
│   ├── quest-recommendations/
│   ├── student-cluster/
│   ├── churn-predictions/
│   ├── anomaly-check/
│   └── status/
│
├── app/dashboard/ml/          # ML Dashboard UI
│   └── page.tsx
│
└── app/components/ml/
    └── ml-dashboard.tsx       # Dashboard component
```

## 🔧 Configuration

### ML Service (.env)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/edurpg
REDIS_URL=redis://localhost:6379/0
API_KEY=your-secret-key
LOG_LEVEL=INFO

# ML Parameters
CLUSTERING_N_CLUSTERS=5
RECOMMENDATION_TOP_N=5
CHURN_THRESHOLD=0.5
ANOMALY_CONTAMINATION=0.1

# Cache TTL (seconds)
CACHE_TTL_PREDICTION=3600
CACHE_TTL_RECOMMENDATION=1800
CACHE_TTL_CLUSTERING=86400
```

### Next.js (.env)

```bash
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_API_KEY=your-secret-key
```

## 🐳 Docker Deployment

```bash
# Spusť všechny services
docker-compose up -d

# Services:
# - postgres:5432
# - redis:6379
# - ml-service:8000
# - next.js:3000

# Natrénuj modely v containeru
docker exec -it edurpg-ml-service python app/training/train_all.py

# Zkontroluj logy
docker logs edurpg-ml-service -f
```

## 📈 Training Pipeline

### Kdy retrénovat modely?

- **Automaticky:** Každý týden (cron job)
- **Manuálně:** Po změnách v datech nebo herní ekonomice
- **Po přidání:** 50+ nových studentů

### Training Workflow

```bash
# 1. Backup starých modelů
cp -r models models_backup_$(date +%Y%m%d)

# 2. Natrénuj všechny modely
python app/training/train_all.py

# 3. Zkontroluj metriky (v logu)
# Clustering: Silhouette score > 0.3
# Recommendation: Matrix density > 5%
# Churn: F1 score > 0.6
# Anomaly: Anomaly rate 5-15%

# 4. Pokud OK, restartuj service
docker-compose restart ml-service

# 5. Pokud špatné, obnov backup
rm -r models && mv models_backup_* models
```

## 📊 Monitoring

### Health Check

```bash
# Basic health
curl http://localhost:8000/health

# Models status
curl -H "X-API-Key: development-key" \
  http://localhost:8000/api/ml/models/status
```

### ML Dashboard

Pro učitele: **http://localhost:3000/dashboard/ml**

Zobrazuje:
- Service status (online/offline)
- Model loading status
- Churn predictions (HIGH/MEDIUM/LOW risk)
- Recommended interventions
- ML insights

### Cache Management

```bash
# Clear specific cache
curl -X DELETE -H "X-API-Key: development-key" \
  "http://localhost:8000/api/ml/cache/clear?pattern=churn:*"

# Clear all cache
curl -X DELETE -H "X-API-Key: development-key" \
  "http://localhost:8000/api/ml/cache/clear?pattern=*"
```

## 🧪 Testing

```bash
cd ml-service

# Run tests
pytest

# Test single model
pytest app/tests/test_clustering.py -v

# Test API endpoints
pytest app/tests/test_api.py -v
```

## 🔒 Security

### API Key Authentication

Všechny ML endpoints vyžadují `X-API-Key` header:

```typescript
fetch('http://localhost:8000/api/ml/...', {
  headers: {
    'X-API-Key': process.env.ML_SERVICE_API_KEY,
    'Content-Type': 'application/json'
  }
});
```

### CORS

Nastaveno v `app/config.py`:
```python
cors_origins: List[str] = ["http://localhost:3000"]
```

## 🐛 Troubleshooting

### ML Service není dostupný

```bash
# Zkontroluj, jestli běží
docker ps | grep ml-service

# Zkontroluj logy
docker logs edurpg-ml-service

# Restartuj
docker-compose restart ml-service
```

### Modely nejsou načtené

```bash
# Zkontroluj, že existují
ls -lah ml-service/models/

# Retrénuj
docker exec -it edurpg-ml-service python app/training/train_all.py
```

### Špatné predikce

```bash
# Clear cache
curl -X DELETE -H "X-API-Key: development-key" \
  http://localhost:8000/api/ml/cache/clear

# Retrénuj modely s fresh data
python app/training/train_all.py
```

### Database connection error

Zkontroluj `DATABASE_URL` v `.env` - musí být dostupná z Python service.

## 🚀 Production Deployment

### Environment Variables

```bash
# Production
ML_SERVICE_URL=https://ml.yourdomain.com
ML_SERVICE_API_KEY=<strong-random-key>
DATABASE_URL=<production-postgres>
REDIS_URL=<production-redis>
```

### Scaling

- **Horizontální:** Multiple ML service instances s load balancerem
- **Vertikální:** Větší RAM pro velké modely (4GB+ recommended)
- **Caching:** Redis cluster pro high availability

### Monitoring

- **Prometheus:** Metriky z FastAPI
- **Grafana:** Dashboards pro predictions, latency, accuracy
- **Alerts:** Notification když success rate < 90%

## 📚 Další Rozšíření

### Možné budoucí features:

1. **Text Generation** (GPT-2 fine-tuned)
   - Generování popisů questů
   - Personalizované feedback messages

2. **Reinforcement Learning**
   - Dynamic difficulty adjustment
   - Optimal reward distribution

3. **Deep Learning**
   - LSTM pro temporal patterns
   - GNN pro social network analysis

4. **AutoML**
   - Automatický výběr nejlepšího modelu
   - Hyperparameter tuning

## 📖 Resources

- **scikit-learn:** https://scikit-learn.org/stable/
- **FastAPI:** https://fastapi.tiangolo.com/
- **Pandas:** https://pandas.pydata.org/
- **Redis:** https://redis.io/docs/

---

**Status:** ✅ Plně funkční ML systém s reálnými modely
**Tech Stack:** Python 3.11, scikit-learn, FastAPI, Redis, PostgreSQL
**Deployment:** Docker + docker-compose ready
