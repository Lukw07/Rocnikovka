# Event System - Kompletní dokumentace

## Přehled systému

Event systém rozšiřuje gamifikační platformu o časově omezené eventy, story-driven mise a boss mechaniky. Systém je navržen pro dlouhodobé používání a plně se integruje s existujícími mechanikami (XP, achievements, guilds, quests).

## 🎯 Funkce

### 1. Typy eventů
- **TIMED** - Časově omezené eventy (např. double XP weekend)
- **STORY** - Příběhové eventy s fázemi
- **BOSS_BATTLE** - Boss fight eventy s multiplayer mechanikou
- **SEASONAL** - Sezónní eventy (vánoce, Halloween)
- **COMPETITION** - Soutěžní eventy

### 2. Kategorie
- **ACADEMIC** - Akademické eventy
- **SOCIAL** - Sociální eventy
- **COMPETITION** - Soutěžní eventy
- **SPECIAL** - Speciální eventy
- **SEASONAL** - Sezónní eventy

### 3. Story-driven eventy
- Rozdělení do fází (phases)
- Postupné odemykání příběhu
- Unlock podmínky (level, quest, achievement)
- Odměny za každou fázi

### 4. Boss mechaniky
- Propojení s existujícím DungeonRun systémem
- Multiplayer boss battles
- Real-time progress tracking
- Damage leaderboard
- Team rewards

## 🗄️ Databázové modely

### Event
```prisma
model Event {
  id               String               @id
  title            String
  description      String?
  type             EventType
  category         EventCategory
  startsAt         DateTime
  endsAt           DateTime?
  xpBonus          Int
  coinReward       Int
  storyContent     String?              // Markdown obsah
  unlockCondition  Json?                // Podmínky unlock
  dungeonBossId    String?              // Reference na Boss
  
  participations   EventParticipation[]
  phases           EventPhase[]
  rewards          EventReward[]
}
```

### EventParticipation
```prisma
model EventParticipation {
  id               String   @id
  eventId          String
  userId           String
  progress         Int      @default(0)  // 0-100%
  currentPhaseId   String?
  isCompleted      Boolean  @default(false)
  completedAt      DateTime?
}
```

### EventPhase
```prisma
model EventPhase {
  id               String   @id
  eventId          String
  phaseNumber      Int
  title            String
  storyContent     String?
  unlockCondition  Json?
  xpReward         Int
  coinReward       Int
}
```

### Boss (existující, rozšířený)
```prisma
model Boss {
  id               String   @id
  name             String
  hp               Int
  maxHp            Int
  level            Int
  xpReward         Int
  moneyReward      Int
  
  dungeonRuns      DungeonRun[]
}
```

## 🔌 API Endpointy

### Event Management

#### GET /api/events/v2
Získá aktivní eventy podle typu
```typescript
Query params:
  - type?: EventType (optional)

Response:
{
  events: Event[]
}
```

#### POST /api/events/v2
Vytvoří nový pokročilý event (pouze OPERATOR)
```typescript
Body:
{
  title: string
  description?: string
  type: EventType
  category: EventCategory
  startsAt: string (ISO datetime)
  endsAt?: string (ISO datetime)
  xpBonus?: number
  coinReward?: number
  storyContent?: string
  unlockCondition?: {
    minLevel?: number
    requiredQuestId?: string
    requiredAchievementId?: string
  }
}

Response:
{
  event: Event
}
```

#### GET /api/events/v2/[id]
Získá detail eventu s progress uživatele
```typescript
Response:
{
  event: {
    ...Event,
    userParticipation: EventParticipation | null,
    isParticipating: boolean,
    userProgress: number,
    currentPhase: EventPhase | null
  }
}
```

#### POST /api/events/v2/[id]/participate
Přihlásí uživatele k eventu
```typescript
Response:
{
  participation: EventParticipation
}
```

#### PATCH /api/events/v2/[id]/progress
Aktualizuje progress uživatele
```typescript
Body:
{
  progressDelta: number (1-100)
}

Response:
{
  participation: EventParticipation
}
```

#### POST /api/events/v2/[id]/phases
Přidá fáze k story eventu (pouze OPERATOR)
```typescript
Body:
{
  eventId: string
  phases: [{
    phaseNumber: number
    title: string
    description?: string
    storyContent?: string
    xpReward?: number
    coinReward?: number
  }]
}

Response:
{
  phases: EventPhase[]
}
```

#### POST /api/events/v2/[id]/next-phase
Odemkne další fázi pro uživatele
```typescript
Response:
{
  participation: EventParticipation,
  phase: EventPhase
}
```

### Boss Mechanics

#### POST /api/events/v2/boss
Vytvoří bosse pro event (pouze OPERATOR)
```typescript
Body:
{
  eventId: string
  name: string
  description?: string
  hp: number
  level: number
  xpReward: number
  moneyReward: number
}

Response:
{
  boss: Boss
}
```

#### POST /api/events/v2/boss/[eventId]/start
Zahájí boss fight pro uživatele
```typescript
Response:
{
  dungeonRun: DungeonRun
}
```

#### POST /api/events/v2/boss/dungeon/[dungeonRunId]
Útok na bosse
```typescript
Body:
{
  damage: number
}

Response:
{
  dungeonRun: DungeonRun,
  isDefeated: boolean,
  remainingHp: number
}
```

#### GET /api/events/v2/boss/dungeon/[dungeonRunId]
Získá statistiky boss fightu
```typescript
Response:
{
  stats: {
    dungeonRun: DungeonRun,
    totalDamage: number,
    remainingHp: number,
    progress: number,
    participantCount: number,
    damageByUser: Record<string, number>,
    topDamageDealer: [string, number]
  }
}
```

## 🎨 Frontend komponenty

### EventList
Zobrazuje seznam eventů s filtrováním podle typu
```tsx
<EventList 
  filterType="STORY" 
  onEventClick={(id) => console.log(id)} 
/>
```

### EventDetailView
Detail eventu s fázemi a progress tracking
```tsx
<EventDetailView 
  eventId="event_123" 
  onBack={() => router.back()} 
/>
```

### BossBattleUI
Boss battle interface s real-time aktualizacemi
```tsx
<BossBattleUI 
  eventId="event_123" 
  onVictory={() => showRewards()} 
/>
```

## 🔄 Integrace s ostatními mechanikami

### XP systém
- Automatické udělení XP bonusů při účasti
- Odměny za dokončení fází
- Boss defeat rewards

```typescript
// V EventsServiceV2
await XPService.grantXP({
  studentId: userId,
  teacherId: "system",
  subjectId: "system",
  amount: event.xpBonus,
  reason: `Event participation: ${event.title}`
})
```

### Achievements
- Events mohou vyžadovat achievementy pro unlock
- Dokončení eventu může triggerovat achievements

```typescript
unlockCondition: {
  requiredAchievementId: "achievement_123"
}
```

### Quests
- Events mohou vyžadovat dokončené questy
- Event progress může počítat do quest objectives

```typescript
unlockCondition: {
  requiredQuestId: "quest_456"
}
```

### Guilds
- Společné boss battles pro guild members
- Guild events a competition
- Sdílené odměny

### Notifications
Systém odesílá notifikace pro:
- `EVENT_STARTED` - Nový event začal
- `EVENT_ENDING_SOON` - Event brzy končí
- `BOSS_SPAWNED` - Boss se objevil
- `BOSS_DEFEATED` - Boss byl poražen
- `EVENT_PHASE_UNLOCKED` - Nová fáze příběhu

## 📋 Použití

### Vytvoření story eventu

1. **Vytvoř event (OPERATOR)**
```typescript
POST /api/events/v2
{
  title: "Tajemství staré knihovny",
  description: "Odhal tajemství ukryté v knihovně školy",
  type: "STORY",
  category: "ACADEMIC",
  startsAt: "2026-01-10T00:00:00Z",
  endsAt: "2026-02-10T00:00:00Z",
  xpBonus: 500,
  storyContent: "# Kapitola 1\n\nV jedné staré knihovně..."
}
```

2. **Přidej fáze**
```typescript
POST /api/events/v2/{eventId}/phases
{
  phases: [
    {
      phaseNumber: 1,
      title: "Objevení záhady",
      storyContent: "Našel jsi starou mapu...",
      xpReward: 100
    },
    {
      phaseNumber: 2,
      title: "Hledání stop",
      storyContent: "Mapa tě vede do...",
      xpReward: 150,
      unlockCondition: { minLevel: 5 }
    }
  ]
}
```

### Vytvoření boss eventu

1. **Vytvoř event**
```typescript
POST /api/events/v2
{
  title: "Defeat the Dragon King",
  type: "BOSS_BATTLE",
  category: "SPECIAL",
  startsAt: "2026-01-15T18:00:00Z",
  endsAt: "2026-01-15T20:00:00Z"
}
```

2. **Vytvoř bosse**
```typescript
POST /api/events/v2/boss
{
  eventId: "{eventId}",
  name: "Dragon King Infernus",
  hp: 100000,
  level: 50,
  xpReward: 5000,
  moneyReward: 10000
}
```

## ⚡ Klíčové vlastnosti

### Kompatibilita
- ✅ Plná integrace s existujícím XP systémem
- ✅ Využití existujících Boss/DungeonRun modelů
- ✅ Propojení s achievements a quests
- ✅ Notification systém

### Škálovatelnost
- ✅ Podpora pro libovolný počet fází
- ✅ Flexibilní unlock podmínky
- ✅ Multiplayer boss battles
- ✅ Real-time progress tracking

### UX
- ✅ Markdown support pro příběhy
- ✅ Progress tracking (0-100%)
- ✅ Visual indicators (badges, progress bars)
- ✅ Auto-refresh pro boss battles

## 🔐 Oprávnění

- **OPERATOR**: Vytváření eventů, přidávání fází, vytváření bossů
- **STUDENT**: Účast na eventech, boss battles, progress tracking
- **TEACHER**: Účast na eventech

## 🧪 Testování

```typescript
// Test event participation
const response = await fetch('/api/events/v2/event_123/participate', {
  method: 'POST'
})

// Test boss attack
const attack = await fetch('/api/events/v2/boss/dungeon/run_456', {
  method: 'POST',
  body: JSON.stringify({ damage: 500 })
})
```

## 📊 Monitoring

Systém loguje všechny důležité akce:
- Event creation
- Participation
- Phase unlocks
- Boss attacks
- Rewards distribution

```typescript
await logEvent("INFO", "event_participation_success", {
  userId,
  metadata: { eventId, xpBonus }
})
```

## 🚀 Další rozšíření

Možná budoucí vylepšení:
- [ ] Guild vs Guild boss battles
- [ ] Weekly/monthly tournaments
- [ ] Event leaderboards
- [ ] Custom event rewards (items, badges)
- [ ] Event achievement tracking
- [ ] Scheduled event reminders
- [ ] Event replay system

---

**Autor**: AI Developer  
**Datum**: 2. ledna 2026  
**Verze**: 1.0.0
