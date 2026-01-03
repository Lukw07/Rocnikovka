# Friend Quests System - Quick Reference

## 🎯 Přehled

Friend Quests jsou speciální questy určené pro dvojice přátel, které vyžadují spolupráci obou hráčů. Systém zahrnuje omezení opakování, tracking progressu a automatické rozdělení odměn.

## 🚀 Rychlý start

### Pro studenty

1. **Zobrazit Friend Questy**: `/dashboard/friend-quests`
2. **Vybrat přítele**: V záložce "Dostupné questy" vyberte přítele
3. **Přijmout quest**: Klikněte na "Přijmout quest"
4. **Aktualizovat progress**: V záložce "Aktivní" aktualizujte svůj progress
5. **Dokončit quest**: Když oba hráči dosáhnou 100%, klikněte "Sbrat odměny!"

### Pro učitele

```typescript
// Vytvoření Friend Questu
await FriendQuestService.createFriendQuest({
  title: "Týmová výzva",
  description: "Spolupracujte na úkolu",
  category: "Challenge",
  difficulty: "MEDIUM",
  questType: "DAILY", // ONE_TIME, DAILY, WEEKLY, LIMITED
  maxCompletions: null, // Pro LIMITED typ
  cooldownHours: 24, // Pro DAILY/WEEKLY
  requiredLevel: 3,
  requiredReputation: 50,
  friendshipMinDays: 7,
  rewards: [
    {
      rewardType: "XP",
      amount: 500,
      description: "XP bonus"
    },
    {
      rewardType: "MONEY",
      amount: 100,
      description: "Zlaté mince"
    }
  ]
}, teacherId);
```

## 📋 Quest typy

| Typ | Ikona | Popis | Omezení |
|-----|-------|-------|---------|
| ONE_TIME | 🎯 | Jednorázový quest | Lze splnit pouze 1x |
| DAILY | 📅 | Denní quest | Cooldown 24h |
| WEEKLY | 📆 | Týdenní quest | Cooldown 168h |
| LIMITED | ⏳ | Omezený quest | maxCompletions definuje limit |

## 🎁 Typy odměn

- **XP**: Zkušenostní body
- **MONEY**: Zlaté mince (gold)
- **REPUTATION**: Body reputace
- **SKILLPOINTS**: Skill pointy
- **ITEM**: Předmět do inventáře

## 🔧 API Endpointy

### Získání questů

```typescript
// Dostupné questy pro dvojici
GET /api/friend-quests?mode=available&friendId={friendId}

// Aktivní questy uživatele
GET /api/friend-quests?mode=active

// Dokončené questy
GET /api/friend-quests?mode=completed&limit=20
```

### Přijetí questu

```typescript
POST /api/friend-quests/accept
Body: {
  friendQuestId: string,
  friendId: string
}
```

### Aktualizace progressu

```typescript
PATCH /api/friend-quests/progress/{progressId}
Body: {
  progressDelta: number // 0-100
}
```

### Dokončení questu

```typescript
POST /api/friend-quests/complete/{progressId}
```

### Vytvoření questu (admin)

```typescript
POST /api/friend-quests/admin
Body: {
  title: string,
  description: string,
  category: string,
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT",
  questType: "ONE_TIME" | "DAILY" | "WEEKLY" | "LIMITED",
  maxCompletions?: number,
  cooldownHours?: number,
  requiredLevel?: number,
  requiredReputation?: number,
  friendshipMinDays?: number,
  expiresAt?: Date,
  rewards: Array<{
    rewardType: "XP" | "MONEY" | "REPUTATION" | "SKILLPOINTS" | "ITEM",
    amount?: number,
    itemId?: string,
    description?: string
  }>
}
```

## 💡 Použití Friend Quest Service

### Získání dostupných questů

```typescript
import { FriendQuestService } from "@/app/lib/services/friend-quest.service";

const result = await FriendQuestService.getAvailableQuestsForFriends(
  user1Id,
  user2Id
);

if (result.success) {
  console.log(result.quests);
}
```

### Přijetí questu

```typescript
const result = await FriendQuestService.acceptFriendQuest({
  friendQuestId: "quest_123",
  user1Id: "user_1",
  user2Id: "user_2"
});

if (result.success) {
  console.log("Quest přijat:", result.progress);
}
```

### Aktualizace progressu

```typescript
const result = await FriendQuestService.updateProgress({
  progressId: "progress_123",
  userId: "user_1",
  progressDelta: 25 // +25%
});

if (result.success) {
  console.log("Progress aktualizován:", result.progress);
}
```

### Dokončení questu

```typescript
const result = await FriendQuestService.completeQuest(progressId);

if (result.success) {
  console.log("Quest dokončen!");
  console.log("Odměny:", result.rewards);
  // { xp: 500, money: 100, reputation: 20, skillpoints: 2, items: [...] }
}
```

## 🔒 Validace a omezení

### Automatické kontroly

1. **Přátelství**: Systém ověřuje, že uživatelé jsou přátelé
2. **Level**: Kontroluje minimální požadovaný level
3. **Reputace**: Ověřuje minimální reputaci
4. **Stáří přátelství**: Kontroluje, jak dlouho jsou přátelé
5. **Počet dokončení**: Sleduje maxCompletions
6. **Cooldown**: Kontroluje, zda uplynul cooldown

### Příklad validace

```typescript
// Quest vyžaduje:
{
  requiredLevel: 5,
  requiredReputation: 100,
  friendshipMinDays: 14,
  questType: "LIMITED",
  maxCompletions: 3,
  cooldownHours: 48
}

// Systém kontroluje:
// ✓ Oba hráči mají level >= 5?
// ✓ Oba mají reputation >= 100?
// ✓ Přátelství trvá >= 14 dní?
// ✓ Quest již nebyl dokončen 3x?
// ✓ Od posledního dokončení uplynulo >= 48h?
```

## 📊 Progress Tracking

### Individuální progress

Každý hráč má svůj vlastní progress (0-100%):

```typescript
{
  user1Progress: 75, // První hráč: 75%
  user2Progress: 50, // Druhý hráč: 50%
  progress: 62       // Celkový: průměr (75+50)/2
}
```

### Dokončení questu

Quest lze dokončit pouze když:
- `user1Progress === 100`
- `user2Progress === 100`

## 🎮 Frontend komponenty

### FriendQuestCard

```tsx
import { FriendQuestCard } from "@/app/components/gamification/friend-quest-card";

<FriendQuestCard
  quest={quest}
  progress={progress}
  mode="active" // "available" | "active" | "completed"
  currentUserId={userId}
  onAccept={handleAccept}
  onUpdateProgress={handleUpdateProgress}
  onComplete={handleComplete}
/>
```

### Friend Quests Page

Kompletní stránka s tabs:
- **Dostupné questy**: Výběr přítele + seznam questů
- **Aktivní**: Aktuální questy s progress trackingem
- **Dokončené**: Historie dokončených questů

## 🗄️ Databázové modely

### FriendQuest

```prisma
model FriendQuest {
  id                  String
  title               String
  description         String
  category            String
  difficulty          QuestDifficulty
  questType           FriendQuestType
  maxCompletions      Int?
  cooldownHours       Int?
  requiredLevel       Int
  requiredReputation  Int
  friendshipMinDays   Int
  isActive            Boolean
  expiresAt           DateTime?
  createdBy           String
  
  rewards             FriendQuestReward[]
  progresses          FriendQuestProgress[]
  completions         FriendQuestCompletion[]
}
```

### FriendQuestProgress

```prisma
model FriendQuestProgress {
  id              String
  friendQuestId   String
  user1Id         String
  user2Id         String
  status          FriendQuestStatus
  progress        Int
  user1Progress   Int
  user2Progress   Int
  acceptedAt      DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
}
```

### FriendQuestCompletion

```prisma
model FriendQuestCompletion {
  id                  String
  friendQuestId       String
  user1Id             String
  user2Id             String
  completedAt         DateTime
  xpReward            Int
  moneyReward         Int
  reputationReward    Int
  skillpointsReward   Int
  itemsReceived       Json?
}
```

## 🎯 Příklady použití

### 1. Denní studijní quest

```typescript
{
  title: "Denní studijní duo",
  questType: "DAILY",
  cooldownHours: 24,
  maxCompletions: null, // Neomezené
  rewards: [
    { rewardType: "XP", amount: 100 },
    { rewardType: "MONEY", amount: 25 }
  ]
}
```

### 2. Jednorázová výzva s itemem

```typescript
{
  title: "První společný quest",
  questType: "ONE_TIME",
  rewards: [
    { rewardType: "XP", amount: 500 },
    { rewardType: "ITEM", itemId: "item_123" }
  ]
}
```

### 3. Omezený quest s cooldownem

```typescript
{
  title: "Vzácná příležitost",
  questType: "LIMITED",
  maxCompletions: 5,
  cooldownHours: 48,
  rewards: [
    { rewardType: "XP", amount: 800 },
    { rewardType: "REPUTATION", amount: 30 }
  ]
}
```

## 🔄 Integrace s ostatními systémy

### Friends System

- Validuje friendship před přijetím questu
- Sleduje stáří přátelství (friendshipMinDays)

### Reputation System

- Kontroluje minimální reputaci
- Přidává reputation jako odměnu

### Economy System

- Rozděluje gold/money odměny
- Vytváří MoneyTx záznamy

### Skill System

- Přidává skillpoints
- Aktualizuje SkillPoint tabulku

### Inventory System

- Přidává itemy do inventáře
- Vytváří UserInventory záznamy

## 📈 Seeding

```bash
# Vytvoření testovacích Friend Questů
npx tsx ops/seed-friend-quests.ts
```

Seed vytvoří:
- ✅ 3x ONE_TIME questy
- ✅ 2x DAILY questy
- ✅ 2x WEEKLY questy
- ✅ 2x LIMITED questy

## ❗ Důležité poznámky

1. **Obousměrné dokončení**: Oba hráči musí dosáhnout 100% progressu
2. **Automatické odměny**: Odměny se rozdělí automaticky při dokončení
3. **Cooldown tracking**: FriendQuestCompletion sleduje historii pro cooldowny
4. **Symetrické vztahy**: Friend questy fungují stejně pro oba hráče
5. **Progress nezávislost**: Každý hráč aktualizuje svůj progress samostatně

## 🐛 Troubleshooting

### Quest nejde přijmout?

Zkontrolujte:
- ✓ Jsou uživatelé přátelé?
- ✓ Splňují level requirement?
- ✓ Mají dostatečnou reputaci?
- ✓ Uplynul cooldown?
- ✓ Není překročen maxCompletions?

### Progress se neaktualizuje?

Zkontrolujte:
- ✓ Správný progressId?
- ✓ userId patří do tohoto questu?
- ✓ Quest není již dokončen?
- ✓ progressDelta je 0-100?

### Odměny se nepřidaly?

Zkontrolujte:
- ✓ Oba hráči mají 100%?
- ✓ Quest status je COMPLETED?
- ✓ Rewards jsou správně definované?
- ✓ Database transakce proběhla úspěšně?

## 📚 Další dokumentace

- [Friends System Quick Reference](FRIENDS_SYSTEM_QUICK_REFERENCE.md)
- [Quest System Quick Reference](QUEST_SYSTEM_QUICK_REFERENCE.md)
- [Economy Quick Reference](ECONOMY_QUICK_REFERENCE.md)
- [Complete System Overview](COMPLETE_SYSTEM_OVERVIEW.md)
