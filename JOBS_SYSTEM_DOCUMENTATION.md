# 📋 Systém Jobů - Kompletní Dokumentace

## 🎯 Přehled

Systém jobů (úkolů) umožňuje učitelům vytvářet různé úkoly pro studenty s komplexním systémem odměn, kategorií, obtížností a týmové spolupráce. Systém je plně integrován s XP, skillpoints a reputací.

---

## 📊 Databázové Schema

### Model: **JobCategory**
Kategorie jobů pro lepší organizaci.

```prisma
model JobCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  icon        String?  // Emoji nebo ikona
  color       String?  // Hex barva pro UI
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  jobs        Job[]
}
```

**Příklady kategorií:**
- 📚 Akademický
- 🎨 Kreativní
- 💻 Technický
- 📋 Organizační
- 🤝 Komunitní
- ⚽ Sportovní
- 👑 Vedení
- 🔬 Výzkum

---

### Model: **Job**
Hlavní model pro úkoly.

```prisma
model Job {
  id               String          @id @default(cuid())
  title            String
  description      String
  subjectId        String
  teacherId        String
  categoryId       String?
  tier             JobTier         @default(BASIC)
  xpReward         Int
  moneyReward      Int
  skillpointsReward Int           @default(1)
  reputationReward Int            @default(0)
  status           JobStatus       @default(OPEN)
  maxStudents      Int             @default(1)
  isTeamJob        Boolean         @default(false)
  requiredLevel    Int             @default(0)
  requiredSkillId  String?
  requiredSkillLevel Int?
  estimatedHours   Int?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  closedAt         DateTime?
  
  subject          Subject         @relation(...)
  teacher          User            @relation(...)
  category         JobCategory?    @relation(...)
  requiredSkill    Skill?          @relation(...)
  assignments      JobAssignment[]
}
```

**Klíčové vlastnosti:**
- **tier**: Obtížnost úkolu (BASIC → LEGENDARY)
- **isTeamJob**: Týmový úkol pro více studentů
- **skillpointsReward**: Počet skillpointů za dokončení
- **reputationReward**: Změna reputace (může být i záporná)
- **requiredLevel**: Minimální level studenta
- **requiredSkillId/Level**: Požadovaný skill a jeho level

---

### Enum: **JobTier**
Úrovně obtížnosti s různými odměnami.

```prisma
enum JobTier {
  BASIC         // ⭐ Základní úkoly
  INTERMEDIATE  // ⭐⭐ Středně náročné
  ADVANCED      // ⭐⭐⭐ Pokročilé
  EXPERT        // ⭐⭐⭐⭐ Expertní
  LEGENDARY     // ⭐⭐⭐⭐⭐ Legendární
}
```

---

### Model: **JobAssignment**
Přihlášky studentů k jobům.

```prisma
model JobAssignment {
  id          String              @id @default(cuid())
  jobId       String
  studentId   String
  status      JobAssignmentStatus @default(APPLIED)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  completedAt DateTime?
  
  job         Job                 @relation(...)
  student     User                @relation(...)
}
```

**Stavy přihlášky:**
- `APPLIED`: Student se přihlásil
- `APPROVED`: Učitel schválil
- `IN_PROGRESS`: Probíhá práce
- `COMPLETED`: Dokončeno, odměny uděleny
- `REJECTED`: Učitel zamítl

---

## 🔌 API Endpointy

### **Kategorie Jobů**

#### `GET /api/jobs/categories`
Získat seznam všech aktivních kategorií.

**Response:**
```json
{
  "data": {
    "categories": [
      {
        "id": "cat_123",
        "name": "Akademický",
        "icon": "📚",
        "color": "#3B82F6",
        "_count": { "jobs": 15 }
      }
    ]
  }
}
```

#### `POST /api/jobs/categories`
Vytvořit novou kategorii (TEACHER, OPERATOR).

**Request:**
```json
{
  "name": "Nová kategorie",
  "description": "Popis",
  "icon": "🎯",
  "color": "#FF5733"
}
```

#### `GET /api/jobs/categories/[id]`
Detail kategorie včetně jobů.

#### `PATCH /api/jobs/categories/[id]`
Aktualizovat kategorii.

#### `DELETE /api/jobs/categories/[id]`
Soft delete kategorie (pouze OPERATOR).

---

### **Joby**

#### `GET /api/jobs`
Získat seznam jobů s filtry.

**Query parametry:**
- `status`: OPEN | IN_PROGRESS | CLOSED | CANCELLED
- `categoryId`: ID kategorie
- `tier`: BASIC | INTERMEDIATE | ADVANCED | EXPERT | LEGENDARY
- `isTeamJob`: true | false
- `subjectId`: ID předmětu

**Response:**
```json
{
  "data": {
    "jobs": [
      {
        "id": "job_123",
        "title": "Vytvoření prezentace",
        "description": "...",
        "tier": "INTERMEDIATE",
        "xpReward": 100,
        "moneyReward": 50,
        "skillpointsReward": 2,
        "reputationReward": 5,
        "maxStudents": 3,
        "isTeamJob": true,
        "category": { "name": "Akademický", "icon": "📚" },
        "subject": { "name": "Matematika" },
        "teacher": { "name": "Mgr. Novák" },
        "_count": { "assignments": 2 }
      }
    ]
  }
}
```

#### `POST /api/jobs`
Vytvořit nový job (TEACHER, OPERATOR).

**Request:**
```json
{
  "title": "Název úkolu",
  "description": "Detailní popis",
  "subjectId": "sub_123",
  "categoryId": "cat_123",
  "tier": "ADVANCED",
  "xpReward": 150,
  "moneyReward": 75,
  "skillpointsReward": 2,
  "reputationReward": 10,
  "maxStudents": 2,
  "isTeamJob": true,
  "requiredLevel": 5,
  "estimatedHours": 3
}
```

#### `POST /api/jobs/[id]/apply`
Student se přihlásí k jobu.

#### `POST /api/jobs/[id]/review`
Učitel schválí/zamítne přihlášku.

**Request:**
```json
{
  "assignmentId": "assign_123",
  "action": "approve" | "reject" | "return"
}
```

#### `POST /api/jobs/[id]/close`
Učitel uzavře job a rozdělí odměny.

---

## 💰 Systém Odměn

### Automatické přidělování při dokončení

Když učitel uzavře job (`/api/jobs/[id]/close`), systém automaticky:

1. **XP** - přidělí každému schválenému studentovi
   - S bonusem za Leadership skill (+2% za level, max 20%)
   
2. **Peníze** - podle nastavené odměny
   - S Leadership bonusem
   
3. **Skillpoints** - podle `skillpointsReward`
   ```typescript
   await tx.skillPoint.upsert({
     where: { userId: studentId },
     update: {
       available: { increment: skillpointsReward },
       total: { increment: skillpointsReward }
     },
     create: { userId: studentId, available: skillpointsReward, ... }
   })
   ```

4. **Reputace** - podle `reputationReward`
   ```typescript
   await tx.reputation.upsert({
     where: { userId: studentId },
     update: { points: { increment: reputationReward } },
     create: { userId: studentId, points: reputationReward, ... }
   })
   
   // Log reputace
   await tx.reputationLog.create({
     data: {
       userId: studentId,
       change: reputationReward,
       reason: `Job completion: ${job.title}`,
       sourceId: job.id,
       sourceType: 'job'
     }
   })
   ```

5. **Automatický výpočet reputation tier**
   - Každých 100 bodů = 1 tier
   ```typescript
   const newTier = Math.floor(Math.abs(reputation.points) / 100)
   ```

---

## 🎮 Frontend Komponenty

### **JobCreatePanelEnhanced**
Vylepšený formulář pro vytváření jobů.

**Umístění:** `app/components/job-list/JobCreatePanelEnhanced.tsx`

**Funkce:**
- Výběr kategorie s ikonami
- Výběr tier s vizuální reprezentací
- Nastavení všech odměn (XP, peníze, SP, reputace)
- Týmové joby s nastavením max. studentů
- Požadovaný level a skill
- Odhadovaný čas

**Použití:**
```tsx
import JobCreatePanelEnhanced from '@/app/components/job-list/JobCreatePanelEnhanced'

<JobCreatePanelEnhanced onSuccess={() => refreshJobs()} />
```

---

### **JobListPanelEnhanced**
Vylepšený seznam jobů s filtry.

**Umístění:** `app/components/job-list/JobListPanelEnhanced.tsx`

**Funkce:**
- Filtrování podle kategorie
- Filtrování podle tier
- Filtr pouze týmových jobů
- Rozbalitelný detail jobu
- Zobrazení všech odměn s ikonami
- Indikace plných jobů
- Přihlašování studentů

**Použití:**
```tsx
import JobListPanelEnhanced from '@/app/components/job-list/JobListPanelEnhanced'

<JobListPanelEnhanced />
```

---

## 🔄 Workflow Jobu

### 1. **Vytvoření jobu**
```
Učitel → JobCreatePanel → POST /api/jobs → Job vytvoře v DB
```

### 2. **Přihlášení studenta**
```
Student → JobListPanel → POST /api/jobs/[id]/apply 
→ JobAssignment (status: APPLIED)
```

### 3. **Schválení učitelem**
```
Učitel → POST /api/jobs/[id]/review (action: "approve")
→ JobAssignment (status: APPROVED)
```

### 4. **Uzavření jobu**
```
Učitel → POST /api/jobs/[id]/close
→ Job (status: CLOSED)
→ Automatické přidělení odměn všem APPROVED studentům
→ XP + Peníze + Skillpoints + Reputace
```

---

## 🧪 Testování

### Seed kategorií
```bash
npx tsx ops/seed-job-categories.ts
```

Vytvoří 8 základních kategorií:
- 📚 Akademický
- 🎨 Kreativní
- 💻 Technický
- 📋 Organizační
- 🤝 Komunitní
- ⚽ Sportovní
- 👑 Vedení
- 🔬 Výzkum

---

## 🔐 Oprávnění

### Učitel (TEACHER)
- ✅ Vytvářet joby
- ✅ Schvalovat/zamítat přihlášky
- ✅ Uzavírat joby
- ✅ Vytvářet kategorie

### Student (STUDENT)
- ✅ Vidět otevřené joby
- ✅ Přihlásit se k jobům
- ❌ Vytvářet joby
- ❌ Schvalovat přihlášky

### Operator (OPERATOR)
- ✅ Vše jako TEACHER
- ✅ Mazat kategorie

---

## 🎯 Příklady Použití

### Vytvoření týmového ADVANCED jobu
```typescript
const job = await JobsService.createJob({
  title: "Týmový projekt: Školní web",
  description: "Vytvořte web pro školu s React a Next.js",
  subjectId: "sub_it",
  categoryId: "cat_technical",
  tier: "ADVANCED",
  xpReward: 500,
  moneyReward: 200,
  skillpointsReward: 5,
  reputationReward: 20,
  maxStudents: 4,
  isTeamJob: true,
  requiredLevel: 10,
  requiredSkillId: "skill_programming",
  requiredSkillLevel: 3,
  estimatedHours: 20,
  teacherId: teacher.id
})
```

### Získání jobů s filtry
```typescript
const jobs = await JobsService.getJobsForStudent(
  studentId, 
  classId,
  {
    categoryId: "cat_technical",
    tier: "ADVANCED",
    isTeamJob: true
  }
)
```

---

## 📈 Integrace s Ostatními Systémy

### **XP System**
- Automaticky přiděluje XP při dokončení
- Leadership bonus: +2% za level (max 20%)

### **Skillpoints System**
- Přiděluje skillpoints podle `skillpointsReward`
- Default: 1 skillpoint za job

### **Reputation System**
- Přiděluje/odebírá reputaci
- Loguje do ReputationLog
- Automaticky počítá tier (100 bodů = 1 tier)

### **Skills System**
- Může vyžadovat konkrétní skill
- Leadership skill ovlivňuje odměny

---

## 🚀 Další Možnosti Rozšíření

1. **Automatické joby**
   - Rekurentní joby (týdenní, měsíční)
   
2. **Quest chains**
   - Série provázaných jobů
   
3. **Boss fights**
   - Speciální týmové joby s extra odměnami
   
4. **Job templates**
   - Předpřipravené šablony jobů
   
5. **Student ratings**
   - Hodnocení studentů za dokončené joby

---

## 📝 Changelog

### v1.0.0 (2026-01-02)
- ✅ Přidány kategorie jobů
- ✅ Přidány tiers (5 úrovní obtížnosti)
- ✅ Podpora týmových jobů
- ✅ Integrace s reputací
- ✅ Rozšířené odměny (skillpoints, reputace)
- ✅ Vylepšené frontend komponenty
- ✅ API endpointy pro kategorie
- ✅ Automatické přidělování odměn

---

## 🐛 Známé Problémy

Žádné známé problémy.

---

## 📞 Kontakt

Pro dotazy nebo návrhy kontaktujte vývojový tým.
