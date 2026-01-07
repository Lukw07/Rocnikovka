# 🚀 Real Rewards & Teacher Motivation - Quick Start

## Rychlé spuštění systému

### 1️⃣ Database Setup

```bash
# Vygeneruj a aplikuj migraci
npx prisma migrate dev --name add_real_rewards_teacher_stats

# Vygeneruj Prisma Client
npx prisma generate
```

### 2️⃣ Použití komponent

#### Pro studenty - Real Rewards Catalog

```tsx
import { RealRewardsCatalog } from "@/app/components/dashboard/RealRewardsCatalog"

// V student dashboard
<RealRewardsCatalog
  studentId={user.id}
  studentGold={user.gold}
  studentGems={user.gems}
  studentLevel={calculateLevel(totalXP)}
/>
```

#### Pro učitele - Rewards Management

```tsx
import { TeacherRewardsManagement } from "@/app/components/dashboard/TeacherRewardsManagement"

// V teacher dashboard
<TeacherRewardsManagement />
```

#### Pro učitele - Motivation Dashboard

```tsx
import { TeacherMotivationDashboard } from "@/app/components/dashboard/TeacherMotivationDashboard"

// V teacher profile nebo dashboard
<TeacherMotivationDashboard teacherId={user.id} />
```

### 3️⃣ API Endpoints jsou ready

✅ Všechny endpointy jsou již implementovány:
- `/api/real-rewards` - CRUD operations
- `/api/real-rewards/claims` - Claim management
- `/api/teacher-stats` - Statistics
- `/api/teacher-stats/leaderboard` - Rankings
- `/api/teacher-stats/dashboard` - Comprehensive data

### 4️⃣ Automatický tracking

✅ Teacher statistics se automaticky trackují při:
- Vytvoření jobu (již integrováno v JobsService)
- Dokončení jobu (již integrováno v JobsService)
- Vytvoření questu (připraveno - stačí přidat call)
- Vytvoření eventu (připraveno - stačí přidat call)

**Příklad integrace do quest service:**

```typescript
import { TeacherStatsService } from "@/app/lib/services/teacher-stats"

// Po vytvoření questu
await TeacherStatsService.trackQuestCreated(teacherId)

// Po dokončení questu
await TeacherStatsService.trackQuestCompleted(teacherId)
```

### 5️⃣ Seed příklady (volitelné)

```typescript
// ops/seed-real-rewards.ts
import { prisma } from "@/app/lib/db"

async function seedRealRewards() {
  await prisma.realLifeReward.createMany({
    data: [
      {
        name: "Lístek do kina",
        description: "Vstup na film dle výběru v místním kině",
        category: "ENTERTAINMENT",
        goldPrice: 500,
        totalStock: 5,
        availableStock: 5,
        isFeatured: true
      },
      {
        name: "Pizza na oběd",
        description: "Pizza dle výběru v školní jídelně",
        category: "FOOD",
        goldPrice: 200,
        totalStock: 10,
        availableStock: 10
      },
      {
        name: "Volný domácí úkol",
        description: "Možnost přeskočit jeden domácí úkol",
        category: "SCHOOL_PERKS",
        goldPrice: 300,
        levelRequired: 5,
        totalStock: 20,
        availableStock: 20,
        isFeatured: true
      }
    ]
  })
}
```

### 6️⃣ Co trackovat kde

| Mechanika | Service call | Kde volat |
|-----------|--------------|-----------|
| Job created | `trackJobCreated()` | ✅ Již v JobsService |
| Job completed | `trackJobCompleted()` | ✅ Již v JobsService |
| Quest created | `trackQuestCreated()` | QuestService.create() |
| Quest completed | `trackQuestCompleted()` | QuestService.complete() |
| Event created | `trackEventCreated()` | EventService.create() |
| Event participants | `trackEventParticipation()` | EventService.end() |

### 7️⃣ První spuštění

```bash
# 1. Aplikuj migraci
npm run prisma:migrate

# 2. (Volitelné) Seed test data
npm run seed:rewards

# 3. Restart dev serveru
npm run dev
```

### 8️⃣ Ověření funkčnosti

#### Test jako student:
1. Otevři student dashboard
2. Naviguj do sekce "Reálné odměny"
3. Zkus claimnout nějakou odměnu
4. Zkontroluj, že se odečetla měna
5. Zkontroluj status v "Moje žádosti"

#### Test jako učitel:
1. Vytvoř nový job
2. Otevři "Motivační dashboard"
3. Zkontroluj, že se zvýšil počet vytvořených jobů
4. Zkontroluj motivační body (+10)
5. Zkontroluj rank v leaderboardu

---

## 🎯 Klíčové featury v kostce

### Real-Life Rewards:
✅ Studenti vyměňují zlato/diamanty za reálné odměny  
✅ Učitelé schvalují/zamítají žádosti  
✅ Automatický refund při zamítnutí  
✅ Omezené zásoby a časové omezení  
✅ Level requirements  

### Teacher Motivation:
✅ Automatický tracking všech aktivit  
✅ Motivační body a žebříček  
✅ Badges (COMMON → LEGENDARY)  
✅ Achievements s progress bary  
✅ Top 5 leaderboard  

---

## 🆘 Troubleshooting

### Migrace selže?
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Frontend komponenty nefungují?
Zkontroluj import paths v:
- `app/components/ui/*` komponenty (Button, Card, atd.)
- `lucide-react` ikony
- `sonner` pro toast notifikace

### API vrací 401/403?
Zkontroluj authentication middleware v `withRole()`.

### Teacher stats se netrackují?
Zkontroluj, že voláš tracking metody MIMO transakci (aby se nepropagoval rollback).

---

## ✨ Hotovo!

Systém je **plně funkční** a připravený k použití.

**Pro více detailů viz:**  
📚 [REAL_REWARDS_TEACHER_MOTIVATION_DOCUMENTATION.md](./REAL_REWARDS_TEACHER_MOTIVATION_DOCUMENTATION.md)
