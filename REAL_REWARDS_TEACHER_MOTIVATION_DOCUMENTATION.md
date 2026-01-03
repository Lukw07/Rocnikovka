# Real-Life Rewards & Teacher Motivation System
## Kompletní implementace reálných odměn a motivačního systému pro učitele

---

## 📋 Přehled implementace

Tento systém přidává dvě klíčové mechaniky do gamifikačního systému EduRPG:

1. **Omezené reálné odměny** - Studenti mohou vyměnit herní měnu za skutečné odměny
2. **Motivační systém pro učitele** - Tracking výkonnosti učitelů, odznaky a žebříčky

---

## 🗄️ Databázové modely

### RealLifeReward
Fyzické odměny, které studenti mohou získat za zlato nebo diamanty.

**Klíčové vlastnosti:**
- Kategorie odměn (jídlo, zábava, školní výhody, merchandise, atd.)
- Dvouměnový systém (gold + gems)
- Omezené zásoby (totalStock / availableStock)
- Level requirements
- Časové omezení (availableFrom / availableTo)
- Featured rewards (doporučené)

### RewardClaim
Workflow žádostí o odměny: PENDING → APPROVED/REJECTED → COMPLETED

**Workflow:**
1. Student požádá o odměnu → měna se odečte
2. Učitel schválí/zamítne
3. Při schválení čeká na předání
4. Při zamítnutí se měna vrací
5. Po předání status COMPLETED

### TeacherStatistics
Komplexní sledování výkonnosti učitele.

**Sledované metriky:**
- Joby: vytvořené, dokončené, XP a měna udělená
- Questy: vytvořené, dokončené, completion rate
- Eventy: vytvořené, počet účastníků
- Engagement: pomožení studenti, aktivní dny
- Motivační body pro žebříček
- Měsíční a týdenní statistiky

### TeacherBadge
Odznaky pro učitele za výjimečnou práci.

**Typy odznaků:**
- JOB_MASTER (100+ jobů)
- QUEST_ARCHITECT (50+ questů)
- EVENT_ORGANIZER (20+ eventů)
- STUDENT_FAVORITE (vysoké hodnocení)
- CONSISTENCY_MASTER (30+ dní streak)
- atd.

**Rarity:** COMMON → UNCOMMON → RARE → EPIC → LEGENDARY

### TeacherAchievement
Achievementy s progress trackingem.

---

## 🔧 Backend Services

### RealRewardsService (`app/lib/services/real-rewards.ts`)

**Hlavní metody:**
```typescript
createReward(data) // Vytvoření nové odměny
getAvailableRewards(studentId) // Odměny dostupné pro studenta
claimReward(data) // Student požádá o odměnu
approveClaim(data) // Učitel schválí žádost
rejectClaim(data) // Učitel zamítne (vrátí měnu)
completeClaim(data) // Označení jako předáno
```

**Bezpečnostní checks:**
- Kontrola dostatku měny
- Kontrola level requirements
- Kontrola dostupnosti (stock, časové omezení)
- Atomické transakce (měna + claim + stock)

### TeacherStatsService (`app/lib/services/teacher-stats.ts`)

**Tracking metody:**
```typescript
trackJobCreated(teacherId, data) // +10 motivačních bodů
trackJobCompleted(teacherId, data) // +25 motivačních bodů
trackQuestCreated(teacherId) // +15 bodů
trackEventCreated(teacherId) // +30 bodů
```

**Achievements a badges:**
- Automatická kontrola milníků
- Progresivní odměny (10, 50, 100, 250 jobů)
- Automatické udělování badges
- Leaderboard tracking

**Leaderboard:**
```typescript
getLeaderboard({ 
  limit: 10, 
  metric: "motivationPoints", 
  period: "all" | "monthly" | "weekly" 
})
getTeacherRank(teacherId) // Rank, percentil
```

---

## 🌐 API Endpoints

### Real-Life Rewards

#### `GET /api/real-rewards`
Získání dostupných odměn.
- Query param `studentId` pro filtrování podle levelu
- Bez auth pro public catalog

#### `POST /api/real-rewards`
Vytvoření nové odměny (TEACHER, OPERATOR).

**Body:**
```json
{
  "name": "Lístek do kina",
  "description": "Vstup na film dle výběru",
  "category": "ENTERTAINMENT",
  "goldPrice": 500,
  "gemsPrice": 0,
  "levelRequired": 5,
  "totalStock": 10,
  "isFeatured": true
}
```

#### `GET /api/real-rewards/claims`
Získání claims.
- Students: pouze vlastní claims
- Teachers/Operators: všechny claims

#### `POST /api/real-rewards/claims`
Žádost o odměnu (STUDENT only).

**Body:**
```json
{
  "rewardId": "clxxx",
  "studentNote": "Prosím o doručení v pátek"
}
```

#### `POST /api/real-rewards/claims/[id]/approve`
Schválení žádosti (TEACHER, OPERATOR).

#### `POST /api/real-rewards/claims/[id]/reject`
Zamítnutí žádosti + refund (TEACHER, OPERATOR).

**Body:**
```json
{
  "rejectedReason": "Odměna momentálně není k dispozici"
}
```

#### `POST /api/real-rewards/claims/[id]/complete`
Označení jako předáno (TEACHER, OPERATOR).

### Teacher Statistics

#### `GET /api/teacher-stats`
Získání statistik učitele.
- Query param `teacherId` (operators only)

#### `GET /api/teacher-stats/leaderboard`
Žebříček učitelů.
- Query params: `limit`, `metric`, `period`

#### `GET /api/teacher-stats/dashboard`
Komplexní dashboard data (stats + rank + top teachers).

---

## 🎨 Frontend Komponenty

### 1. RealRewardsCatalog (`components/dashboard/RealRewardsCatalog.tsx`)

**Pro studenty:**
- Katalog všech dostupných odměn
- Featured rewards sekce
- Filtrování podle kategorie
- Kontrola affordability a eligibility
- Claim dialog s poznámkou
- Historie vlastních žádostí
- Real-time status updates

**Props:**
```typescript
{
  studentId: string
  studentGold: number
  studentGems: number
  studentLevel: number
}
```

### 2. TeacherRewardsManagement (`components/dashboard/TeacherRewardsManagement.tsx`)

**Pro učitele:**
- Správa všech odměn
- Vytváření nových odměn
- Schvalování/zamítání žádostí
- Označování jako předáno
- Dashboard s přehledem (pending, rewards, history)

**Features:**
- Bulk operations
- Quick approve/reject
- Notes pro komunikaci se studenty
- Stock management
- Featured toggles

### 3. TeacherMotivationDashboard (`components/dashboard/TeacherMotivationDashboard.tsx`)

**Pro učitele:**
- Přehled výkonnosti a rankingu
- Motivační body a percentil
- Získané badges (s rarity)
- Progress k achievementům
- Top 5 leaderboard
- Statistiky (joby, questy, eventy)

**Tabs:**
- **Overview**: Celkové statistiky + progress bars
- **Badges**: Získané odznaky s rarity
- **Achievements**: Dokončené a aktivní výzvy
- **Leaderboard**: Top 5 učitelů

---

## 🔄 Integrace se stávajícím systémem

### Automatický tracking v JobsService

```typescript
// Po vytvoření jobu
await TeacherStatsService.trackJobCreated(teacherId, {
  xpReward: data.xpReward,
  moneyReward: data.moneyReward
})

// Po dokončení jobu
await TeacherStatsService.trackJobCompleted(teacherId, {
  xpAwarded: totalXP,
  moneyAwarded: totalMoney,
  studentsCount: approvedCount
})
```

### Kompatibilita s existujícími mechanikami

✅ **Navazuje na:**
- User model (gold, gems)
- XP system (level calculation)
- MoneyTx system (transakce)
- Jobs system (teacher tracking)
- Quest system (tracking possible)
- Event system (tracking possible)

✅ **Nekonfliktuje s:**
- Virtual Awards (jiný účel)
- Shop Items (jiná kategorie)
- Achievements (student-focused)
- Trading system (peer-to-peer)

---

## 🚀 Jak použít

### Jako student:

1. **Katalog odměn:**
   ```tsx
   <RealRewardsCatalog
     studentId={user.id}
     studentGold={user.gold}
     studentGems={user.gems}
     studentLevel={currentLevel}
   />
   ```

2. **Žádost o odměnu:**
   - Prohlížej katalog
   - Vyber odměnu
   - Vlož poznámku (volitelné)
   - Potvrď (měna se okamžitě odečte)
   - Čekej na schválení

3. **Sleduj status:**
   - Tab "Moje žádosti"
   - Real-time status updates
   - Poznámky od učitelů

### Jako učitel:

1. **Vytvoření odměny:**
   - Klikni "Vytvořit odměnu"
   - Vyplň název, popis, cenu
   - Nastav stock a level requirement
   - Zvol kategorii
   - Featured toggle

2. **Správa žádostí:**
   - Tab "Čekající"
   - Prohlédni poznámku studenta
   - Schval nebo zamítni
   - Vlož poznámku (volitelné)

3. **Předání odměny:**
   - Tab "Historie"
   - Najdi schválenou žádost
   - Klikni "Předat"
   - Status → COMPLETED

4. **Motivační dashboard:**
   ```tsx
   <TeacherMotivationDashboard teacherId={user.id} />
   ```

---

## 📊 Bodování a motivace

### Motivační body - Earning

| Aktivita | Body |
|----------|------|
| Vytvoření jobu | +10 |
| Dokončení jobu | +25 |
| Vytvoření questu | +15 |
| Dokončení questu | +20 |
| Vytvoření eventu | +30 |
| Účastník eventu | +5 per student |
| Badge | +50 až +1000 (podle rarity) |
| Achievement | Varies |

### Achievements - Milníky

| Milestone | Reward |
|-----------|--------|
| První job | +50 bodů |
| 10 jobů | +100 bodů |
| 50 jobů | +250 bodů |
| 100 jobů | +500 bodů + EPIC badge |
| 250 jobů | +1000 bodů |

### Badges - Rarity Points

- COMMON: +50
- UNCOMMON: +100
- RARE: +250
- EPIC: +500
- LEGENDARY: +1000

---

## 🔐 Bezpečnost

### Real Rewards

1. **Currency checks**: Před claimem kontrola dostatku měny
2. **Level checks**: Kontrola level requirements
3. **Stock checks**: Atomická kontrola a decrement
4. **Time checks**: availableFrom/To validace
5. **Refunds**: Automatický refund při rejection
6. **Role-based**: Pouze TEACHER/OPERATOR může approve/reject

### Teacher Stats

1. **Auto-init**: Automatické vytvoření stats při prvním tracku
2. **Transactional**: Atomické operace
3. **Error handling**: Continue on error (nice-to-have data)
4. **Permission checks**: Vlastní stats nebo OPERATOR

---

## 📝 Database Migration

```bash
# 1. Přidej nové modely do schema.prisma (již hotovo)
# 2. Vytvoř migraci
npx prisma migrate dev --name add_real_rewards_teacher_stats

# 3. Vygeneruj Prisma Client
npx prisma generate

# 4. (Volitelné) Seed initial data
# Vytvoř seed script pro example rewards a badges
```

---

## 🧪 Testing

### Test Scenarios - Real Rewards

1. ✅ Student může claimnout odměnu s dostatkem měny
2. ✅ Student nemůže claimnout bez dostatku měny
3. ✅ Student nemůže claimnout pod level requirement
4. ✅ Vyprodaná odměna nelze claimnout
5. ✅ Expirovaná odměna nelze claimnout
6. ✅ Rejection vrací měnu
7. ✅ Stock se správně decrementuje

### Test Scenarios - Teacher Stats

1. ✅ Job creation trackuje správně
2. ✅ Job completion trackuje správně
3. ✅ Achievements se automaticky unlock
4. ✅ Badges se automaticky award
5. ✅ Leaderboard se správně řadí
6. ✅ Monthly/weekly stats resety

---

## 🎯 Budoucí rozšíření

### V1.1 - QR Codes pro real rewards
- QR kód na claim pro ověření předání
- Scan to complete

### V1.2 - Student ratings
- Studenti mohou hodnotit obdržené odměny
- Vliv na teacher stats (averageJobRating)

### V1.3 - Advanced leaderboards
- Multiple metrics leaderboards
- Time-period filters (měsíc, rok, all-time)
- Class-specific leaderboards

### V1.4 - Teacher challenges
- Měsíční výzvy pro učitele
- Bonusové body za special events
- Team teaching bonuses

---

## ✅ Checklist kompletnosti

- [x] Database schema rozšíření
- [x] Backend services (RealRewards + TeacherStats)
- [x] API endpoints (8 routes)
- [x] Student components (RealRewardsCatalog)
- [x] Teacher components (RewardsManagement + MotivationDashboard)
- [x] Integration s JobsService
- [x] Error handling a validace
- [x] TypeScript types
- [x] Dokumentace

---

## 🤝 Kompatibilita a propojení

Tento systém je **plně kompatibilní** se všemi existujícími mechanikami:

✅ XP, Levely, Skillpoints → Level requirements pro rewards  
✅ Reputace → Možné přidat jako requirement  
✅ Jobs → Automatický tracking pro teacher stats  
✅ Questy → Připraveno pro tracking  
✅ Guildy → Guild achievements možné  
✅ Achievementy → Paralelní systém (student vs teacher)  
✅ Streaky → Teacher streak možný  
✅ Personal Goals → Kompatibilní  
✅ Virtual Awards → Oddělené, nekonfliktní  
✅ Trading → Oddělené, nekonfliktní  
✅ Blackmarket → Oddělené, nekonfliktní  
✅ Events → Připraveno pro tracking  

---

## 📚 Závěr

Systém je **kompletní a production-ready**. Poskytuje:

1. ✅ **Real-life rewards** s workflow PENDING → APPROVED → COMPLETED
2. ✅ **Teacher motivation** s badges, achievements a leaderboardem
3. ✅ **Automatický tracking** integrovaný do jobs
4. ✅ **Plnou frontend UI** pro students i teachers
5. ✅ **Bezpečné API** s role-based permissions
6. ✅ **Kompatibilitu** se všemi existujícími mechanikami

**Systém je připraven k použití! 🚀**
