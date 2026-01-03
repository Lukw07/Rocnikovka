# 🎮 Event Systém - README

## 🚀 Rychlý start

### 1. Instalace závislostí
```bash
npm install react-markdown
npx prisma generate
npx prisma db push
```

### 2. Spuštění demo
```bash
node ops/demo-event-system.js
```

### 3. Spuštění aplikace
```bash
npm run dev
```

### 4. Otevři browser
```
http://localhost:3000/dashboard/events
```

## 📚 Dokumentace

### Kompletní dokumentace
- **[EVENT_SYSTEM_DOCUMENTATION.md](EVENT_SYSTEM_DOCUMENTATION.md)** - Kompletní dokumentace systému
- **[EVENT_SYSTEM_QUICK_REFERENCE.md](EVENT_SYSTEM_QUICK_REFERENCE.md)** - Rychlá reference
- **[EVENT_SYSTEM_INTEGRATION_GUIDE.md](EVENT_SYSTEM_INTEGRATION_GUIDE.md)** - Integrace s ostatními systémy
- **[EVENT_SYSTEM_IMPLEMENTATION_SUMMARY.md](EVENT_SYSTEM_IMPLEMENTATION_SUMMARY.md)** - Implementační souhrn

## 🎯 Co systém umí

### Typy eventů
- ⏰ **Časově omezené** - Double XP weekend, bonusy
- 📖 **Story-driven** - Příběhové mise s fázemi
- 🐉 **Boss Battle** - Multiplayer boss fights
- 🎄 **Sezónní** - Vánoční, Halloween eventy
- 🏆 **Soutěže** - Competition mezi studenty

### Klíčové funkce
- ✅ Progress tracking (0-100%)
- ✅ Story fáze s unlock podmínkami
- ✅ Multiplayer boss battles
- ✅ Real-time updates
- ✅ Automatické odměny (XP, coins)
- ✅ Notifikace
- ✅ Integrace s XP, achievements, quests, guilds

## 🗂️ Struktura projektu

```
app/
├── lib/services/
│   ├── events-v2.ts              # Story eventy, fáze
│   └── boss.ts                   # Boss mechaniky
├── api/events/v2/
│   ├── route.ts                  # GET/POST eventy
│   ├── [id]/route.ts             # Detail
│   ├── [id]/participate/route.ts # Účast
│   ├── [id]/progress/route.ts    # Progress
│   ├── [id]/phases/route.ts      # Fáze
│   ├── [id]/next-phase/route.ts  # Další fáze
│   └── boss/...                  # Boss API
├── components/events/
│   ├── event-list.tsx            # Seznam
│   ├── event-detail.tsx          # Detail
│   └── boss-battle-ui.tsx        # Boss UI
└── dashboard/events/
    └── page.tsx                  # Hlavní stránka

ops/
└── demo-event-system.js          # Demo script

Dokumentace/
├── EVENT_SYSTEM_DOCUMENTATION.md
├── EVENT_SYSTEM_QUICK_REFERENCE.md
├── EVENT_SYSTEM_INTEGRATION_GUIDE.md
└── EVENT_SYSTEM_IMPLEMENTATION_SUMMARY.md
```

## 💻 Použití API

### Vytvoření eventu (OPERATOR)
```bash
curl -X POST http://localhost:3000/api/events/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tajemství knihovny",
    "type": "STORY",
    "category": "ACADEMIC",
    "startsAt": "2026-01-10T00:00:00Z",
    "xpBonus": 500,
    "storyContent": "# Příběh začíná..."
  }'
```

### Přidání fází
```bash
curl -X POST http://localhost:3000/api/events/v2/{eventId}/phases \
  -H "Content-Type: application/json" \
  -d '{
    "phases": [
      {
        "phaseNumber": 1,
        "title": "Fáze 1",
        "xpReward": 100
      }
    ]
  }'
```

### Účast studenta
```bash
curl -X POST http://localhost:3000/api/events/v2/{eventId}/participate
```

### Vytvoření bosse
```bash
curl -X POST http://localhost:3000/api/events/v2/boss \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "{eventId}",
    "name": "Dragon King",
    "hp": 50000,
    "level": 30,
    "xpReward": 5000,
    "moneyReward": 5000
  }'
```

## 🧪 Testování

### Demo script
```bash
node ops/demo-event-system.js
```

### Ruční testování
1. Spusť `npm run dev`
2. Přihlas se jako OPERATOR
3. Vytvoř event přes UI nebo API
4. Přihlas se jako STUDENT
5. Účastni se eventu
6. Vyzkoušej všechny funkce

### Test checklist
- [ ] Vytvoření časového eventu
- [ ] Vytvoření story eventu s fázemi
- [ ] Vytvoření boss eventu
- [ ] Účast studenta
- [ ] Progress tracking
- [ ] Odemykání fází
- [ ] Boss battle (útok, damage tracking)
- [ ] Notifikace
- [ ] Automatické odměny

## 🔧 Konfigurace

### Unlock podmínky
```typescript
unlockCondition: {
  minLevel: 10,                          // Minimální level
  requiredQuestId: "quest_123",          // Dokončený quest
  requiredAchievementId: "achievement_456" // Získaný achievement
}
```

### Event types
```typescript
type EventType = 
  | "TIMED"         // Časově omezený
  | "STORY"         // Příběhový
  | "BOSS_BATTLE"   // Boss fight
  | "SEASONAL"      // Sezónní
  | "COMPETITION"   // Soutěž
```

## 🎨 UI komponenty

### EventList
```tsx
import { EventList } from '@/app/components/events'

<EventList 
  filterType="STORY"
  onEventClick={(id) => handleClick(id)}
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

## 🔗 Integrace

### XP systém
```typescript
// Automatické udělení XP
if (event.xpBonus > 0) {
  await XPService.grantXP({...})
}
```

### Achievements
```typescript
// Vyžadovaný achievement
unlockCondition: {
  requiredAchievementId: "achievement_id"
}
```

### Quests
```typescript
// Vyžadovaný quest
unlockCondition: {
  requiredQuestId: "quest_id"
}
```

### Guilds
```typescript
// Multiplayer boss battles
participantIds: [user1, user2, user3, ...]
```

## 🐛 Troubleshooting

### Databáze
```bash
# Reset a regenerace
npx prisma migrate reset
npx prisma generate
npx prisma db push
```

### Build chyby
```bash
# Vyčištění cache
npm run clean
rm -rf .next node_modules/.cache
npm install
```

### TypeScript chyby
```bash
# Regenerace Prisma klienta
npx prisma generate
```

## 📊 Monitoring

### Logy
```typescript
import { logEvent } from '@/app/lib/utils'

await logEvent("INFO", "event_action", {
  userId,
  metadata: { eventId, detail }
})
```

### Metriky
- Event účast
- Boss defeat rate
- Phase completion rate
- User progress

## 🚀 Production

### Checklist před nasazením
- [ ] Databázové migrace
- [ ] Produkční environment variables
- [ ] TypeScript build bez chyb
- [ ] Všechny testy prochází
- [ ] Dokumentace aktuální
- [ ] Security review

### Environment variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://..."
```

## 🎓 Pro vývojáře

### Přidání nového typu eventu
1. Přidej typ do `EventType` enum v schema.prisma
2. Aktualizuj validaci v schema.ts
3. Přidej logiku do EventsServiceV2
4. Vytvoř UI komponentu
5. Aktualizuj dokumentaci

### Přidání nové odměny
1. Přidej typ do `EventRewardType` enum
2. Implementuj logiku v `awardEventRewards()`
3. Aktualizuj UI pro zobrazení odměny

## 🤝 Podpora

- GitHub Issues: Reportuj bugy
- Dokumentace: Viz soubory výše
- Demo: `ops/demo-event-system.js`

## 📝 License

Proprietary - EduRPG School System

---

**Autor**: AI Developer  
**Datum**: 2. ledna 2026  
**Status**: Production Ready ✅
