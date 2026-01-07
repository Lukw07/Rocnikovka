# Quest System - Quick Reference

## 🚀 Rychlý start

### Pro studenty

1. **Zobrazit questy**: `/dashboard/quests`
2. **Přijmout quest**: Klikněte na "Přijmout quest"
3. **Hrát mini game**: Klikněte na "🎮 Hrát hru" u MINI_GAME questů
4. **Dokončit quest**: U STANDARD questů klikněte "Dokončit" po splnění

### Pro učitele

```typescript
// Vytvořit nový quest
await QuestServiceEnhanced.createQuest({
  title: "Název questu",
  description: "Popis",
  category: "Math",
  difficulty: "MEDIUM",
  questType: "STANDARD",
  xpReward: 500,
  moneyReward: 100
}, teacherId)
```

## 📋 Quest typy

| Typ | Ikona | Popis | Použití |
|-----|-------|-------|---------|
| STANDARD | 📋 | Klasický quest | Domácí úkoly, projekty |
| MINI_GAME | 🎮 | Interaktivní hra | Rychlé testy, výzvy |
| GUILD | 🛡️ | Pro guildy | Týmové úkoly |
| DAILY | 📅 | Denní quest | Pravidelné aktivity |
| WEEKLY | 📆 | Týdenní quest | Větší úkoly |
| EVENT | 🎉 | Speciální event | Soutěže, akce |

## 🎮 Mini games

### Quiz
```json
{
  "questions": [
    {
      "question": "Otázka?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 1
    }
  ]
}
```

### Memory
```json
{
  "pairs": [
    { "id": "1a", "value": "🍎" },
    { "id": "1b", "value": "🍎" }
  ]
}
```

### Math
```json
{
  "difficulty": "medium",
  "problemCount": 10
}
```

## 🏆 Odměny

| Obtížnost | Doporučené XP | Doporučené Money | Skillpoints |
|-----------|---------------|------------------|-------------|
| EASY | 100-300 | 20-50 | 0-1 |
| MEDIUM | 300-700 | 50-150 | 1-2 |
| HARD | 700-1500 | 150-400 | 2-5 |
| LEGENDARY | 1500+ | 400+ | 5+ |

## 🔌 API Endpointy

```typescript
// Načíst questy
GET /api/quests?category=Math&difficulty=MEDIUM

// Přijmout quest
POST /api/quests/:questId/accept

// Update progress
PATCH /api/quests/:questId/progress
Body: { "progress": 50 }

// Mini game result
POST /api/quests/:questId/minigame/play
Body: { "score": 850, "gameData": {...} }

// Dokončit quest
POST /api/quests/:questId/complete

// Vzdát quest
POST /api/quests/:questId/abandon
```

## 🛠️ Časté úkony

### Vytvořit standardní quest
```typescript
const quest = await QuestServiceEnhanced.createQuest({
  title: "Domácí úkol",
  description: "Vyřešit úlohy 1-10",
  category: "Math",
  difficulty: "EASY",
  questType: "STANDARD",
  xpReward: 200,
  moneyReward: 50,
  requiredLevel: 1
}, teacherId)
```

### Vytvořit math mini game
```typescript
const quest = await QuestServiceEnhanced.createQuest({
  title: "Matematická výzva",
  description: "Vyřeš 10 příkladů",
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
```

### Vytvořit guild quest
```typescript
const quest = await QuestServiceEnhanced.createQuest({
  title: "Týmový projekt",
  description: "Společná prezentace",
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

### Vytvořit denní quest
```typescript
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)

const quest = await QuestServiceEnhanced.createQuest({
  title: "Denní úkol",
  description: "Kompletuj dnes",
  category: "Challenge",
  difficulty: "EASY",
  questType: "DAILY",
  isRepeatable: true,
  expiresAt: tomorrow,
  xpReward: 100,
  moneyReward: 25,
  requiredLevel: 1
}, teacherId)
```

## 📊 Monitoring

### Zkontrolovat quest progress
```typescript
const progress = await prisma.questProgress.findFirst({
  where: {
    userId: "user123",
    questId: "quest123"
  },
  include: {
    quest: true,
    user: true
  }
})
```

### Statistiky questů
```typescript
// Celkem dokončených questů
const completed = await prisma.questProgress.count({
  where: {
    status: "COMPLETED"
  }
})

// Top studenti podle questů
const topStudents = await prisma.questProgress.groupBy({
  by: ['userId'],
  where: {
    status: "COMPLETED"
  },
  _count: {
    id: true
  },
  orderBy: {
    _count: {
      id: 'desc'
    }
  },
  take: 10
})
```

## 🐛 Troubleshooting

### Quest se nezobrazuje
```typescript
// Zkontrolujte status
const quest = await prisma.quest.findUnique({
  where: { id: "quest123" }
})
console.log(quest.status) // Musí být "ACTIVE"
```

### Odměny se neudělovaly
```typescript
// Zkontrolujte logs
const logs = await prisma.systemLog.findMany({
  where: {
    type: "quest_completed",
    userId: "user123"
  },
  orderBy: { createdAt: 'desc' },
  take: 5
})
```

### Mini game nepočítá skóre
```typescript
// Ověřte quest setup
const quest = await prisma.quest.findUnique({
  where: { id: "quest123" }
})
console.log({
  questType: quest.questType, // Musí být "MINI_GAME"
  miniGameType: quest.miniGameType, // quiz/memory/math
  miniGameData: quest.miniGameData // Validní JSON
})
```

## 💡 Best Practices

### ✅ DO
- Vyvažte obtížnost s odměnami
- Testujte mini games před nasazením
- Nastavte přiměřené `requiredLevel`
- Používejte konzistentní kategorie
- Logujte důležité operace

### ❌ DON'T
- Nevytvářejte příliš snadné questy s vysokými odměnami
- Nedávejte skillpoints za EASY questy
- Nepoužívejte extrémně krátké expiry
- Nepřeskakujte validaci mini game dat
- Nezapomeňte na error handling

## 🔐 Security Checklist

- [ ] Auth middleware na všech API routes
- [ ] Role-based přístup (RBAC)
- [ ] Validace quest ownership
- [ ] Rate limiting na submissions
- [ ] Input sanitization
- [ ] Error messages neodhalují citlivé info

## 📈 Performance Tips

1. **Eager loading**: Include userProgress při načítání questů
2. **Indexy**: Zajistěte indexy na userId, questId
3. **Caching**: Cachujte často používané questy
4. **Pagination**: Implementujte stránkování pro velké seznamy
5. **Optimistic updates**: Použijte optimistic UI pro lepší UX

## 🎯 Kategorie (doporučené)

- `Math` - Matematika
- `Science` - Přírodověda
- `Social` - Společenské vědy
- `Language` - Jazyky
- `Challenge` - Výzvy
- `Event` - Speciální eventy
- `Daily` - Denní úkoly

## 📝 Template pro nový quest

```typescript
const newQuest = {
  title: "",
  description: "",
  category: "Math", // Change me
  difficulty: "MEDIUM", // EASY | MEDIUM | HARD | LEGENDARY
  questType: "STANDARD", // STANDARD | MINI_GAME | GUILD | DAILY | WEEKLY | EVENT
  status: "ACTIVE",
  requiredLevel: 1,
  xpReward: 500,
  moneyReward: 100,
  skillpointsReward: 0,
  reputationReward: 0,
  isRepeatable: false,
  expiresAt: null,
  guildId: null,
  miniGameType: null, // quiz | memory | math
  miniGameData: null
}
```

---

**Pro více informací viz**: [QUEST_SYSTEM_DOCUMENTATION.md](./QUEST_SYSTEM_DOCUMENTATION.md)
