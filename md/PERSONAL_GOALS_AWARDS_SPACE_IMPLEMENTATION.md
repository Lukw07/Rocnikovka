# 🎯 Personal Goals, Virtual Awards & Personal Space - Implementační Dokumentace

**Datum:** 2. ledna 2026  
**Status:** ✅ Plně implementováno

---

## 📋 Obsah

1. [Personal Goals System](#personal-goals-system)
2. [Virtual Awards & Trophies](#virtual-awards--trophies)
3. [Personal Space Editor](#personal-space-editor)
4. [Textové Sebehodnocení](#textové-sebehodnocení)
5. [Integrace se Systémem](#integrace-se-systémem)
6. [API Dokumentace](#api-dokumentace)
7. [Frontend Komponenty](#frontend-komponenty)

---

## 🎯 Personal Goals System

### Popis
Systém osobních cílů umožňuje studentům vytvářet vlastní měřitelné cíle s deadline, sledovat progres a získávat XP odměny po dokončení.

### Databázové Schema

```prisma
model PersonalGoal {
  id           String     @id @default(cuid())
  userId       String
  title        String
  description  String?
  targetValue  Int        // Cílová hodnota (např. 10 úkolů)
  currentValue Int        @default(0)
  reward       Int        // XP odměna za dokončení
  status       GoalStatus @default(ACTIVE)
  deadline     DateTime?
  reflection   String?    // Textové sebehodnocení
  createdAt    DateTime   @default(now())
  completedAt  DateTime?
  updatedAt    DateTime   @updatedAt
  
  user User @relation(...)
}

enum GoalStatus {
  ACTIVE      // Aktivní cíl
  COMPLETED   // Dokončený cíl
  ABANDONED   // Opuštěný cíl
  EXPIRED     // Vypršelý cíl
}
```

### Backend API

#### GET /api/personal-goals
Získá osobní cíle aktuálního uživatele.

**Query Parameters:**
- `status` (optional): ACTIVE | COMPLETED | ABANDONED | EXPIRED

**Response:**
```json
{
  "goals": [
    {
      "id": "goal_123",
      "title": "Dokončit 10 úkolů z matematiky",
      "description": "Soustředit se na algebru",
      "targetValue": 10,
      "currentValue": 7,
      "reward": 200,
      "status": "ACTIVE",
      "deadline": "2026-02-01T00:00:00Z",
      "reflection": null,
      "createdAt": "2026-01-02T10:00:00Z"
    }
  ]
}
```

#### POST /api/personal-goals
Vytvoří nový osobní cíl.

**Request Body:**
```json
{
  "title": "Zlepšit známky z angličtiny",
  "description": "Soustředit se na gramatiku",
  "targetValue": 5,
  "reward": 150,
  "deadline": "2026-03-01T00:00:00Z"  // optional
}
```

#### PATCH /api/personal-goals/[id]
Aktualizuje progres cíle.

**Request Body:**
```json
{
  "increment": 1,
  "reflection": "Dnes jsem se naučil nové slovíčka..." // optional
}
```

#### GET /api/personal-goals/stats
Získá statistiky osobních cílů uživatele.

**Response:**
```json
{
  "stats": {
    "total": 15,
    "completed": 10,
    "active": 3,
    "abandoned": 1,
    "expired": 1,
    "completionRate": 66.7
  }
}
```

---

## 🏆 Virtual Awards & Trophies

### Popis
Systém virtuálních ocenění automaticky uděluje trofeje za významné milníky (levely, questy, achievementy, streaky).

### Databázové Schema

```prisma
model VirtualAward {
  id       String     @id @default(cuid())
  userId   String
  name     String
  icon     String     // Emoji nebo URL
  rarity   ItemRarity // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
  earnedAt DateTime   @default(now())
  
  user User @relation(...)
}
```

### Backend API

#### GET /api/virtual-awards
Získá všechny virtuální trofeje uživatele.

**Query Parameters:**
- `userId` (optional): Zobrazit trofeje jiného uživatele

**Response:**
```json
{
  "awards": {
    "all": [...],
    "grouped": {
      "LEGENDARY": [...],
      "EPIC": [...],
      "RARE": [...],
      "UNCOMMON": [...],
      "COMMON": [...]
    },
    "total": 42
  }
}
```

#### GET /api/virtual-awards/showcase
Získá top 6 nejvzácnějších trofejí pro showcase.

### Automatické Trofeje

| Milník | Trofej | Rarita |
|--------|--------|--------|
| Level 10 | Začátečník X | COMMON |
| Level 25 | Pokročilý Adept | UNCOMMON |
| Level 50 | Mistr RPG | RARE |
| Level 75 | Legendární Hrdina | EPIC |
| Level 100 | EduRPG Bůh | LEGENDARY |
| 5 Questů | Questový Začátečník | COMMON |
| 25 Questů | Questový Veterán | RARE |
| 10 Personal Goals | Cílový Střelec | UNCOMMON |
| 1000 Reputace | Respektovaný Student | RARE |
| 10 Achievementů | Achievementový Lovec | UNCOMMON |

---

## 🏠 Personal Space Editor

### Popis
Interaktivní 2D místnost, kde může student customizovat své osobní místo s různými themes a nábytkem pomocí drag&drop.

### Databázové Schema

```prisma
model PersonalSpace {
  id        String   @id @default(cuid())
  userId    String   @unique
  theme     String   @default("default")
  layout    String?  // JSON string pro pozice prvků
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User        @relation(...)
  furniture Furniture[]
}

model Furniture {
  id              String   @id @default(cuid())
  personalSpaceId String
  name            String
  type            String
  positionX       Int
  positionY       Int
  rotation        Int      @default(0)
  createdAt       DateTime @default(now())
  
  personalSpace PersonalSpace @relation(...)
}
```

### Backend API

#### GET /api/personal-space
Získá osobní prostor uživatele.

#### PUT /api/personal-space
Aktualizuje theme nebo layout prostoru.

**Request Body:**
```json
{
  "theme": "cyberpunk",
  "layout": "{...}"  // optional JSON
}
```

#### POST /api/personal-space/furniture
Přidá nábytek do prostoru.

**Request Body:**
```json
{
  "name": "Stůl",
  "type": "desk",
  "positionX": 50,
  "positionY": 50,
  "rotation": 0
}
```

#### PATCH /api/personal-space/furniture/[id]
Aktualizuje pozici nábytku.

#### DELETE /api/personal-space/furniture/[id]
Odstraní nábytek.

### Dostupné Themes

- 🏠 **default** - Výchozí
- 🌙 **dark** - Temná
- 🌲 **forest** - Les
- 🌊 **ocean** - Oceán
- 🚀 **space** - Vesmír
- 🏰 **castle** - Hrad
- 🌃 **cyberpunk** - Cyberpunk
- ✨ **fantasy** - Fantasy

### Dostupný Nábytek

- 🪑 Stůl
- 💺 Židle
- 📚 Knihovna
- 🪴 Rostlina
- 💡 Lampa
- 🖼️ Obraz
- 🏆 Trofej
- 🧶 Koberec
- 🪟 Okno
- 🕰️ Hodiny

---

## 📝 Textové Sebehodnocení

### Popis
Studenti mohou přidávat textové reflexe k jejich osobním cílům, což podporuje sebereflexi a metacognition.

### Implementace

- Pole `reflection` v PersonalGoal modelu
- Max 1000 znaků
- Volitelné při update progresu
- Zobrazuje se v GoalDetailDialog

**Příklad použití:**
```json
{
  "increment": 2,
  "reflection": "Dnes jsem se naučil nové metody řešení rovnic. Zlepšil jsem se v rychlosti výpočtu, ale musím víc pracovat na přesnosti."
}
```

---

## 🔗 Integrace se Systémem

### GamificationIntegrationService

Centrální servisní vrstva propojující všechny gamifikační mechaniky.

#### Integration Hooks

```typescript
// Po udělení XP
await GamificationIntegrationService.onXPGranted(userId, xpAmount, reason)

// Po levelupu
await GamificationIntegrationService.onLevelUp(userId, newLevel)

// Po dokončení questu
await GamificationIntegrationService.onQuestCompleted(userId, questId, difficulty)

// Po dokončení jobu
await GamificationIntegrationService.onJobCompleted(userId, jobId, jobTitle)

// Po získání achievementu
await GamificationIntegrationService.onAchievementEarned(userId, name, rarity)

// Po dosažení streak milníku
await GamificationIntegrationService.onStreakMilestone(userId, streakDays)

// Po dosažení reputace milníku
await GamificationIntegrationService.onReputationMilestone(userId, reputation)

// Denní kontrola
await GamificationIntegrationService.dailyCheck(userId)
```

### Automatické Akce

1. **Po dokončení questu:**
   - Zkontroluje, zda má student aktivní personal goal na questy
   - Automaticky aktualizuje progres
   - Udělí trofeje za quest milníky

2. **Po levelupu:**
   - Udělí speciální trofeje (Level 10, 25, 50, 100)
   - Pošle notifikaci

3. **Po získání achievementu:**
   - Pokud je EPIC nebo LEGENDARY, udělí i virtuální trofej
   - Zkontroluje achievement milníky

4. **Denní kontrola:**
   - Označí vypršené personal goals
   - Zkontroluje všechny milníky

---

## 📱 Frontend Komponenty

### PersonalGoalsList
Hlavní komponenta pro zobrazení a správu osobních cílů.

**Lokace:** `app/components/personal-goals/personal-goals-list.tsx`

**Features:**
- Stats cards (celkem, dokončeno, aktivní, úspěšnost)
- Filtry podle statusu
- Grid zobrazení cílů
- Progress bars
- Deadline countdown
- Vytvoření nového cíle

### CreateGoalDialog
Dialog pro vytvoření nového cíle.

**Features:**
- Validace formuláře
- Date picker pro deadline
- XP odměna selector

### GoalDetailDialog
Detail a update progress cíle.

**Features:**
- Progres bars
- Stats cards (progres, odměna, deadline)
- Increment selector
- Textová reflexe (1000 znaků)
- Opuštění cíle

### VirtualAwardsGallery
Galerie všech virtuálních trofejí.

**Lokace:** `app/components/virtual-awards/virtual-awards-gallery.tsx`

**Features:**
- Stats podle rarity
- Filtry (LEGENDARY, EPIC, RARE, UNCOMMON, COMMON)
- Grid zobrazení s hover efekty
- Rarity glow effect

### AwardsShowcase
Showcase top 6 nejvzácnějších trofejí.

**Features:**
- Automatické seřazení podle rarity
- Kompaktní zobrazení
- Použití v profilu

### PersonalSpaceEditor
Interaktivní editor osobního prostoru.

**Lokace:** `app/components/personal-space/personal-space-editor.tsx`

**Features:**
- Theme selector (8 themes)
- Drag & drop nábytek
- Grid overlay
- Furniture menu
- Remove furniture
- Pozice ukládání v reálném čase

---

## 🚀 Použití

### Přidání do Dashboard

```tsx
import { PersonalGoalsList } from "@/app/components/personal-goals/personal-goals-list"
import { VirtualAwardsGallery } from "@/app/components/virtual-awards/virtual-awards-gallery"
import { PersonalSpaceEditor } from "@/app/components/personal-space/personal-space-editor"

// V dashboard page
<PersonalGoalsList />
<VirtualAwardsGallery />
<PersonalSpaceEditor />
```

### Showcase v Profilu

```tsx
import { AwardsShowcase } from "@/app/components/virtual-awards/awards-showcase"

<AwardsShowcase />
```

---

## 🔄 Migrace Databáze

Po přidání `reflection` a `updatedAt` do PersonalGoal modelu:

```bash
npx prisma migrate dev --name add_personal_goals_reflection
npx prisma generate
```

---

## ✅ Checklist Implementace

- [x] Personal Goals - Backend API
- [x] Personal Goals - Frontend komponenty
- [x] Virtual Awards - Backend API
- [x] Virtual Awards - Frontend komponenty
- [x] Personal Space - Backend API
- [x] Personal Space - Frontend komponenty
- [x] Textové sebehodnocení
- [x] Integrace s XP systémem
- [x] Integrace s Quests systémem
- [x] Integrace s Achievements systémem
- [x] Automatické milníky a trofeje
- [x] Notifikace systém
- [x] Dokumentace

---

## 💡 Budoucí Rozšíření

1. **Personal Goals:**
   - Sdílení cílů s učiteli
   - Týmové cíle
   - Šablony cílů

2. **Virtual Awards:**
   - Speciální efekty pro LEGENDARY trofeje
   - Trading trofejí
   - Display v Personal Space

3. **Personal Space:**
   - 3D prostor
   - Více furniture options
   - Unlockable themes za achievementy
   - Návštěvy od přátel

---

**Implementováno:** AI Developer specializovaný na EduRPG  
**Datum:** 2. ledna 2026
