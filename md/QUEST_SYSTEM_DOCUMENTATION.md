# Quest System Documentation

## Přehled

Systém questů poskytuje gamifikační mechaniku založenou na úkolech, které mohou studenti plnit za odměny. Podporuje standardní questy, denní a týdenní úkoly, guildové aktivity a interaktivní mini games.

## Databázové modely

### Quest

```prisma
model Quest {
  id                  String           @id @default(cuid())
  title               String
  description         String
  category            String
  difficulty          QuestDifficulty
  questType           QuestType        @default(STANDARD)
  status              QuestStatus      @default(ACTIVE)
  requiredLevel       Int              @default(1)
  xpReward            Int
  moneyReward         Int              @default(0)
  skillpointsReward   Int              @default(0)
  reputationReward    Int              @default(0)
  isRepeatable        Boolean          @default(false)
  expiresAt           DateTime?
  guildId             String?
  guild               Guild?           @relation(fields: [guildId], references: [id])
  miniGameType        String?
  miniGameData        Json?
  userProgress        QuestProgress[]
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
}
```

### QuestProgress

```prisma
model QuestProgress {
  id            String          @id @default(cuid())
  userId        String
  user          User            @relation(fields: [userId], references: [id])
  questId       String
  quest         Quest           @relation(fields: [questId], references: [id])
  status        QuestProgressStatus
  progress      Int             @default(0)
  miniGameScore Int?
  miniGameData  Json?
  acceptedAt    DateTime        @default(now())
  completedAt   DateTime?
  updatedAt     DateTime        @updatedAt
}
```

### Enumerace

```prisma
enum QuestType {
  STANDARD
  MINI_GAME
  GUILD
  DAILY
  WEEKLY
  EVENT
}

enum QuestDifficulty {
  EASY
  MEDIUM
  HARD
  LEGENDARY
}

enum QuestStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum QuestProgressStatus {
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  FAILED
  ABANDONED
}
```

## Quest typy

### STANDARD
- Klasické questy splnitelné manuálně
- Studenti hlásí dokončení
- Učitel může ověřit a schválit

### MINI_GAME
- Interaktivní mini games
- Automatické vyhodnocení skóre
- Podporované typy: quiz, memory, math

### GUILD
- Questy pro guild members
- 10% odměny jde do guild treasury
- Zvyšuje guild reputaci

### DAILY / WEEKLY
- Časově omezené questy
- Automaticky obnovitelné
- Ideal pro pravidelné aktivity

### EVENT
- Speciální questy pro events
- Často s vyššími odměnami
- Časově limitované

## API Endpointy

### GET /api/quests

Načte seznam dostupných questů.

**Query parametry:**
- `category` (optional): Filtr podle kategorie
- `difficulty` (optional): EASY | MEDIUM | HARD | LEGENDARY
- `questType` (optional): STANDARD | MINI_GAME | GUILD | DAILY | WEEKLY | EVENT
- `guildId` (optional): Zobrazit pouze questy pro danou guildu

**Response:**
```json
{
  "success": true,
  "data": {
    "quests": [
      {
        "id": "quest123",
        "title": "Vyřešit 10 úloh",
        "description": "Vyřešte 10 matematických příkladů",
        "category": "Math",
        "difficulty": "MEDIUM",
        "questType": "MINI_GAME",
        "requiredLevel": 5,
        "xpReward": 500,
        "moneyReward": 100,
        "skillpointsReward": 2,
        "reputationReward": 10,
        "miniGameType": "math",
        "miniGameData": {
          "difficulty": "medium",
          "problemCount": 10
        },
        "userProgress": null
      }
    ]
  }
}
```

### POST /api/quests/:questId/accept

Přijme quest pro aktuálního uživatele.

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": "prog123",
      "status": "ACCEPTED",
      "progress": 0,
      "acceptedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

### PATCH /api/quests/:questId/progress

Aktualizuje progres questu (pouze STANDARD questy).

**Body:**
```json
{
  "progress": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": "prog123",
      "status": "IN_PROGRESS",
      "progress": 50
    }
  }
}
```

### POST /api/quests/:questId/minigame/play

Odešle výsledek mini game.

**Body:**
```json
{
  "score": 850,
  "gameData": {
    "completedAt": "2024-01-15T10:05:00Z",
    "answers": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "status": "COMPLETED",
      "progress": 100,
      "miniGameScore": 850,
      "completedAt": "2024-01-15T10:05:00Z"
    },
    "rewards": {
      "xp": 500,
      "money": 100,
      "skillpoints": 2,
      "reputation": 10
    }
  }
}
```

### POST /api/quests/:questId/complete

Manuálně dokončí quest (učitelé mohou schvalovat).

**Response:**
```json
{
  "success": true,
  "data": {
    "completed": true,
    "rewards": {...}
  }
}
```

### POST /api/quests/:questId/abandon

Vzdá se questu.

**Response:**
```json
{
  "success": true,
  "data": {
    "abandoned": true
  }
}
```

## Mini Games

### Quiz Mini Game

**Konfigurace v `miniGameData`:**
```json
{
  "questions": [
    {
      "question": "Kolik je 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    }
  ]
}
```

**Vlastnosti:**
- Multiple choice otázky
- Progress bar zobrazující aktuální otázku
- Automatické vyhodnocení skóre
- Skóre: (správné odpovědi / celkem) * 100

### Memory Mini Game

**Konfigurace v `miniGameData`:**
```json
{
  "pairs": [
    { "id": "1a", "value": "🍎" },
    { "id": "1b", "value": "🍎" },
    { "id": "2a", "value": "🍌" },
    { "id": "2b", "value": "🍌" }
  ]
}
```

**Vlastnosti:**
- Párování karet
- Flip animace
- Počítání tahů
- Skóre: 100 - (tahy - perfektní tahy) * 5

### Math Mini Game

**Konfigurace v `miniGameData`:**
```json
{
  "difficulty": "medium",
  "problemCount": 10
}
```

**Vlastnosti:**
- Dynamické generování příkladů
- 3 obtížnosti (easy, medium, hard)
- 30 sekundový timer na příklad
- Skóre: (správné / celkem) * 100

**Obtížnosti:**
- **Easy**: Sčítání a odčítání 1-10
- **Medium**: Násobení do 50
- **Hard**: Dělení do 100

## Quest Service

### QuestServiceEnhanced

Služba pro správu questů s plnou integrací odměn.

#### createQuest(data, creatorId)

Vytvoří nový quest. Pouze učitelé a admini.

```typescript
const quest = await QuestServiceEnhanced.createQuest({
  title: "Nový quest",
  description: "Popis questu",
  category: "Math",
  difficulty: "MEDIUM",
  questType: "MINI_GAME",
  requiredLevel: 5,
  xpReward: 500,
  moneyReward: 100,
  skillpointsReward: 2,
  reputationReward: 10,
  miniGameType: "math",
  miniGameData: { difficulty: "medium", problemCount: 10 }
}, teacherId)
```

#### getAvailableQuests(userId, filters)

Načte dostupné questy pro uživatele s filtry.

```typescript
const quests = await QuestServiceEnhanced.getAvailableQuests(userId, {
  category: "Math",
  difficulty: "MEDIUM",
  questType: "MINI_GAME",
  guildId: "guild123"
})
```

#### acceptQuest(userId, questId)

Přijme quest pro uživatele.

```typescript
const progress = await QuestServiceEnhanced.acceptQuest(userId, questId)
```

#### updateProgress(userId, questId, progress, miniGameScore?)

Aktualizuje progres questu. Při dosažení 100% automaticky dokončí.

```typescript
await QuestServiceEnhanced.updateProgress(userId, questId, 50)

// Pro mini games
await QuestServiceEnhanced.updateProgress(userId, questId, 100, 850)
```

#### completeQuest(userId, questId)

Manuálně dokončí quest a udělí odměny.

```typescript
const result = await QuestServiceEnhanced.completeQuest(userId, questId)
```

#### abandonQuest(userId, questId)

Vzdá se questu.

```typescript
await QuestServiceEnhanced.abandonQuest(userId, questId)
```

## Odměny

### Systém odměn

Při dokončení questu jsou automaticky udělovány odměny:

1. **XP**: Zapisováno do `XPAudit` tabulky
2. **Money**: Transakce v `MoneyTx` tabulce
3. **Skillpoints**: Záznam v `SkillPoint` tabulce
4. **Reputation**: Záznam v `Reputation` a `ReputationLog`

### Guild Questy

Pro guild questy (questType = GUILD):
- 10% z money reward jde do guild treasury
- Guild získává reputaci
- Všichni guild members jsou informováni

### Výpočet odměn

```typescript
// Základní odměny
const rewards = {
  xp: quest.xpReward,
  money: quest.moneyReward,
  skillpoints: quest.skillpointsReward,
  reputation: quest.reputationReward
}

// Pro guild quest
if (quest.guildId) {
  const guildTreasury = Math.floor(quest.moneyReward * 0.1)
  // Přidat do guild treasury
}
```

## Frontend komponenty

### QuestsListEnhanced

Hlavní komponenta pro zobrazení questů.

**Features:**
- Filtrování podle kategorie, obtížnosti, typu, statusu
- Zobrazení progress baru pro aktivní questy
- Mini game launcher
- Detail questu s odměnami
- Přijímání a opouštění questů

**Použití:**
```tsx
import { QuestsListEnhanced } from "@/app/components/quests/QuestsListEnhanced"

<QuestsListEnhanced />
```

### QuizMiniGame

Komponenta pro quiz mini game.

```tsx
<QuizMiniGame
  questId="quest123"
  questions={[
    {
      question: "Kolik je 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1
    }
  ]}
  onComplete={(score) => {
    console.log("Quiz skóre:", score)
  }}
/>
```

### MemoryMiniGame

Komponenta pro memory mini game.

```tsx
<MemoryMiniGame
  questId="quest123"
  pairs={[
    { id: "1a", value: "🍎" },
    { id: "1b", value: "🍎" }
  ]}
  onComplete={(score) => {
    console.log("Memory skóre:", score)
  }}
/>
```

### MathMiniGame

Komponenta pro matematické příklady.

```tsx
<MathMiniGame
  questId="quest123"
  difficulty="medium"
  problemCount={10}
  onComplete={(score) => {
    console.log("Math skóre:", score)
  }}
/>
```

## Integrace s ostatními systémy

### XP systém
- Quest odměny se zapisují do `XPAudit`
- Automatický level up při dosažení prahu
- Logování do `SystemLog`

### Money systém
- Transakce v `MoneyTx` tabulce
- Type: "QUEST_REWARD"
- Reference na quest ID

### Skillpoints
- Záznam v `SkillPoint` tabulce
- Type: "QUEST_REWARD"
- Reason: "Quest completed: {questTitle}"

### Reputation
- Aktualizace v `Reputation` tabulce
- Log v `ReputationLog` s reasonem
- Guild reputation pro guild questy

### Guild systém
- Guild questy vyžadují členství v guildě
- 10% money reward do guild treasury
- Guild level může ovlivnit dostupné questy

## Administrace

### Vytváření questů (učitelé/admini)

```typescript
// Standardní quest
const standardQuest = await QuestServiceEnhanced.createQuest({
  title: "Domácí úkol z matiky",
  description: "Vyřešit úlohy 1-10 ze str. 45",
  category: "Math",
  difficulty: "EASY",
  questType: "STANDARD",
  xpReward: 200,
  moneyReward: 50,
  requiredLevel: 1
}, teacherId)

// Mini game quest
const miniGameQuest = await QuestServiceEnhanced.createQuest({
  title: "Matematická výzva",
  description: "Vyřeš 10 příkladů co nejrychleji",
  category: "Math",
  difficulty: "MEDIUM",
  questType: "MINI_GAME",
  xpReward: 500,
  moneyReward: 100,
  skillpointsReward: 2,
  miniGameType: "math",
  miniGameData: {
    difficulty: "medium",
    problemCount: 10
  },
  requiredLevel: 5
}, teacherId)

// Guild quest
const guildQuest = await QuestServiceEnhanced.createQuest({
  title: "Týmový projekt",
  description: "Společně vytvořte prezentaci",
  category: "Social",
  difficulty: "HARD",
  questType: "GUILD",
  guildId: "guild123",
  xpReward: 1000,
  moneyReward: 500,
  reputationReward: 50,
  requiredLevel: 10
}, teacherId)
```

## Best practices

### Návrh questů

1. **Obtížnost**: Vyvažte obtížnost s odměnami
2. **Level requirements**: Nastavte přiměřené požadavky na level
3. **Repeatability**: Denní questy nastavte jako repeatable
4. **Expiration**: Pro časově omezené questy nastavte expiresAt
5. **Categories**: Používejte konzistentní názvy kategorií

### Mini games

1. **Délka**: Cílte na 2-5 minut hry
2. **Obtížnost**: Přizpůsobte obtížnost věku studentů
3. **Feedback**: Poskytněte jasný feedback během hry
4. **Testování**: Vždy otestujte na cílové skupině

### Odměny

1. **Balance**: XP odměny by měly odpovídat obtížnosti
2. **Money**: Mírně nižší než XP, aby měly hodnotu
3. **Skillpoints**: Pouze pro náročnější questy
4. **Reputation**: Pro sociální a guild aktivity

## Monitoring a logování

Všechny quest operace jsou logovány do `SystemLog`:

```typescript
{
  type: "quest_completed",
  userId: "user123",
  data: {
    questId: "quest123",
    questTitle: "Quest name",
    rewards: {
      xp: 500,
      money: 100,
      skillpoints: 2,
      reputation: 10
    }
  }
}
```

## Rozšíření systému

### Přidání nového typu mini game

1. Vytvořte novou komponentu v `app/components/quests/mini-games/`
2. Implementujte props: `questId`, `onComplete`, specifické konfigurace
3. Přidejte do `QuestsListEnhanced` renderer
4. Dokumentujte v `miniGameData` struktuře

### Přidání nového typu questu

1. Přidejte hodnotu do `QuestType` enum v Prisma schema
2. Aktualizujte `QuestServiceEnhanced` logiku
3. Přidejte UI podporu v `QuestsListEnhanced`
4. Dokumentujte chování a použití

## Troubleshooting

### Quest se nezobrazuje
- Zkontrolujte `status` (musí být ACTIVE)
- Zkontrolujte `requiredLevel` vs. user level
- Zkontrolujte `expiresAt` datum

### Mini game nespočítá skóre
- Zkontrolujte `miniGameType` v quest datech
- Ověřte správnost `miniGameData` struktury
- Zkontrolujte API endpoint response

### Odměny se neudělovaly
- Zkontrolujte logs v `SystemLog`
- Ověřte stav `QuestProgress` (musí být COMPLETED)
- Zkontrolujte user balance před/po

## Security

- Všechny API endpointy používají auth middleware
- Role-based přístup (STUDENT, TEACHER, ADMIN)
- Validace quest ownership při update
- Rate limiting na mini game submissions

## Performance

- Indexy na userId, questId v QuestProgress
- Eager loading userProgress v getAvailableQuests
- Stránkování pro velké seznamy questů
- Caching frequently accessed quests

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Maintainer**: EduRPG Team
