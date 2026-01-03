# Event System - Quick Reference

## 📦 Rychlý přehled souborů

### Backend
```
app/lib/services/
  ├── events-v2.ts          # Story eventy, fáze, progress
  └── boss.ts               # Boss mechaniky, dungeon runs

app/api/events/v2/
  ├── route.ts              # GET/POST hlavní eventy
  ├── schema.ts             # Zod validace
  ├── [id]/
  │   ├── route.ts          # GET detail eventu
  │   ├── participate/route.ts   # POST účast
  │   ├── progress/route.ts      # PATCH progress
  │   ├── phases/route.ts        # POST přidat fáze
  │   └── next-phase/route.ts    # POST další fáze
  └── boss/
      ├── route.ts          # POST vytvořit bosse
      ├── [eventId]/start/route.ts  # POST start fight
      └── dungeon/[id]/route.ts     # POST útok, GET stats
```

### Frontend
```
app/components/events/
  ├── event-list.tsx        # Seznam eventů
  ├── event-detail.tsx      # Detail + fáze
  ├── boss-battle-ui.tsx    # Boss fight UI
  └── index.ts

app/dashboard/events/
  └── page.tsx              # Hlavní stránka
```

### Databáze
```
prisma/schema.prisma
  ├── Event                 # Hlavní event model
  ├── EventParticipation    # Účast + progress
  ├── EventPhase            # Story fáze
  ├── EventReward           # Odměny
  ├── Boss (existující)     # Boss data
  └── DungeonRun (exist.)   # Boss battles
```

## 🎯 Nejčastější použití

### Vytvoření story eventu
```typescript
// 1. Vytvoř event
POST /api/events/v2
{
  title: "Quest Name",
  type: "STORY",
  category: "ACADEMIC",
  startsAt: "2026-01-10T00:00:00Z",
  xpBonus: 500,
  storyContent: "# Intro story..."
}

// 2. Přidej fáze
POST /api/events/v2/{id}/phases
{
  phases: [
    { phaseNumber: 1, title: "Phase 1", xpReward: 100 },
    { phaseNumber: 2, title: "Phase 2", xpReward: 150 }
  ]
}
```

### Vytvoření boss eventu
```typescript
// 1. Vytvoř event
POST /api/events/v2
{
  title: "Boss Fight",
  type: "BOSS_BATTLE",
  startsAt: "2026-01-15T00:00:00Z"
}

// 2. Vytvoř bosse
POST /api/events/v2/boss
{
  eventId: "{id}",
  name: "Dragon",
  hp: 50000,
  level: 30,
  xpReward: 2000
}
```

### Účast studenta
```typescript
// Přihlásit se
POST /api/events/v2/{id}/participate

// Aktualizovat progress
PATCH /api/events/v2/{id}/progress
{ progressDelta: 25 }

// Další fáze
POST /api/events/v2/{id}/next-phase
```

### Boss battle
```typescript
// Start fight
POST /api/events/v2/boss/{eventId}/start

// Útok
POST /api/events/v2/boss/dungeon/{dungeonRunId}
{ damage: 500 }

// Stats
GET /api/events/v2/boss/dungeon/{dungeonRunId}
```

## 🎨 Komponenty

### EventList
```tsx
import { EventList } from '@/app/components/events'

<EventList 
  filterType="STORY"        // Optional: TIMED|STORY|BOSS_BATTLE|SEASONAL
  onEventClick={(id) => {}} // Callback on event click
/>
```

### EventDetailView
```tsx
import { EventDetailView } from '@/app/components/events'

<EventDetailView 
  eventId="event_123"
  onBack={() => router.back()}
/>
```

### BossBattleUI
```tsx
import { BossBattleUI } from '@/app/components/events'

<BossBattleUI 
  eventId="event_123"
  onVictory={() => showRewards()}
/>
```

## 🔑 Klíčové služby

### EventsServiceV2
```typescript
// Vytvoř pokročilý event
await EventsServiceV2.createAdvancedEvent(data, operatorId)

// Přidej fáze
await EventsServiceV2.addEventPhases(eventId, phases, operatorId)

// Účast
await EventsServiceV2.participateAdvanced(eventId, userId)

// Progress
await EventsServiceV2.updateProgress(eventId, userId, delta)

// Další fáze
await EventsServiceV2.unlockNextPhase(eventId, userId)

// Získej aktivní eventy
await EventsServiceV2.getActiveEventsByType("STORY")

// Detail s progress
await EventsServiceV2.getEventWithProgress(eventId, userId)
```

### BossService
```typescript
// Vytvoř bosse
await BossService.createBossForEvent(eventId, bossData)

// Start fight
await BossService.startBossFight(eventId, userId)

// Útok
await BossService.attackBoss(dungeonRunId, userId, damage)

// Stats
await BossService.getBossFightStats(dungeonRunId)

// Leaderboard
await BossService.getBossLeaderboard(bossId, limit)
```

## 📊 Databázové dotazy

### Získej aktivní eventy
```typescript
const events = await prisma.event.findMany({
  where: {
    isActive: true,
    startsAt: { lte: new Date() },
    OR: [
      { endsAt: null },
      { endsAt: { gte: new Date() } }
    ]
  },
  include: { phases: true, rewards: true }
})
```

### Získej user progress
```typescript
const participation = await prisma.eventParticipation.findUnique({
  where: {
    eventId_userId: { eventId, userId }
  },
  include: { 
    event: true,
    currentPhase: true
  }
})
```

### Boss stats
```typescript
const dungeonRun = await prisma.dungeonRun.findUnique({
  where: { id: dungeonRunId },
  include: {
    boss: true,
    damageLog: true
  }
})
```

## 🔔 Notifikace

```typescript
// Event started
await prisma.notification.create({
  data: {
    userId,
    type: "EVENT_STARTED",
    title: `Event Started: ${event.title}`,
    message: event.description,
    data: { eventId }
  }
})

// Boss spawned
type: "BOSS_SPAWNED"

// Boss defeated
type: "BOSS_DEFEATED"

// Phase unlocked
type: "EVENT_PHASE_UNLOCKED"
```

## ⚙️ Konfigurace

### Unlock podmínky
```typescript
unlockCondition: {
  minLevel: 10,                          // Minimální level
  requiredQuestId: "quest_123",          // Dokončený quest
  requiredAchievementId: "achievement_456" // Získaný achievement
}
```

### Event typy a kategorie
```typescript
type EventType = "TIMED" | "STORY" | "BOSS_BATTLE" | "SEASONAL" | "COMPETITION"
type EventCategory = "ACADEMIC" | "SOCIAL" | "COMPETITION" | "SPECIAL" | "SEASONAL"
```

### Odměny
```typescript
// V Event modelu
xpBonus: 500          // XP odměna
coinReward: 1000      // Mince
rarityReward: "EPIC"  // Item rarity
itemRewards: {...}    // Custom items

// V EventPhase
xpReward: 100
coinReward: 50
```

## 🐛 Debugging

### Logování
```typescript
import { logEvent } from '@/app/lib/utils'

await logEvent("INFO", "event_action", {
  userId,
  requestId,
  metadata: { eventId, detail }
})
```

### Kontrola oprávnění
```typescript
// OPERATOR check
if (session.user.role !== "OPERATOR") {
  return ErrorResponses.forbidden()
}
```

### Error handling
```typescript
try {
  await EventsServiceV2.participateAdvanced(eventId, userId)
} catch (error) {
  // "Event not found or inactive"
  // "You don't meet the unlock conditions"
  // "User has already participated"
}
```

## 🎯 Checklist pro nový event

- [ ] Vytvoř Event (POST /api/events/v2)
- [ ] Pokud STORY: Přidej fáze
- [ ] Pokud BOSS_BATTLE: Vytvoř bosse
- [ ] Nastav unlock podmínky (optional)
- [ ] Definuj odměny (XP, coins, items)
- [ ] Test účasti studenta
- [ ] Test progress tracking
- [ ] Test completion rewards

## 📱 UI Patterns

### Loading states
```tsx
{loading && <div className="animate-spin..." />}
```

### Error handling
```tsx
{error && <p className="text-destructive">{error}</p>}
```

### Empty states
```tsx
{events.length === 0 && <p>Žádné eventy</p>}
```

### Progress indicators
```tsx
<Progress value={userProgress} className="h-2" />
```

---

**Pro detailní dokumentaci viz**: [EVENT_SYSTEM_DOCUMENTATION.md](EVENT_SYSTEM_DOCUMENTATION.md)
