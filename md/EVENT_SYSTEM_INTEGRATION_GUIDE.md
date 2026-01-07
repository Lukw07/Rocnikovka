# Event System - Integrace s ostatními mechanikami

Tento dokument vysvětluje, jak event systém spolupracuje s ostatními gamifikačními mechanikami.

## 🎯 XP systém

### Jak to funguje
Event systém využívá `XPService` pro automatické udělování XP odměn.

### Integrace
```typescript
// V EventsServiceV2.participateAdvanced()
if (event.xpBonus > 0) {
  await XPService.grantXP({
    studentId: userId,
    teacherId: "system",
    subjectId: "system",
    amount: event.xpBonus,
    reason: `Event participation: ${event.title}`
  }, requestId)
}
```

### Kdy se uděluje XP
1. **Při účasti** - `xpBonus` z Event modelu
2. **Za dokončení fáze** - `xpReward` z EventPhase
3. **Za poražení bosse** - `xpReward` z Boss modelu

### Příklad
```typescript
// Student se účastní eventu s xpBonus: 500
// → +500 XP ihned po registraci

// Student odemkne fázi 2 s xpReward: 150
// → +150 XP za dokončení fáze

// Student porazí bosse s xpReward: 2000
// → +2000 XP po porážce
```

## 🏆 Achievement systém

### Jak to funguje
Eventy mohou vyžadovat achievementy jako unlock podmínku.

### Integrace
```typescript
// V unlockCondition
{
  requiredAchievementId: "achievement_first_quest"
}

// Kontrola v checkUnlockCondition()
const achievement = await tx.achievementAward.findFirst({
  where: {
    userId,
    achievementId: condition.requiredAchievementId
  }
})
if (!achievement) return false
```

### Použití
```typescript
// Event dostupný jen pro studenty s achievementem
POST /api/events/v2
{
  title: "Advanced Quest",
  unlockCondition: {
    requiredAchievementId: "achievement_veteran_student"
  }
}
```

### Budoucí rozšíření
- Dokončení eventu může triggerovat achievement
- Event-specific achievements
- Progress tracking pro event achievements

## 📜 Quest systém

### Jak to funguje
Eventy mohou vyžadovat dokončené questy jako unlock podmínku.

### Integrace
```typescript
// V unlockCondition
{
  requiredQuestId: "quest_intro_chapter"
}

// Kontrola v checkUnlockCondition()
const questProgress = await tx.questProgress.findFirst({
  where: {
    userId,
    questId: condition.requiredQuestId,
    status: "COMPLETED"
  }
})
if (!questProgress) return false
```

### Použití
```typescript
// Story event navazující na quest
POST /api/events/v2
{
  title: "Pokračování příběhu",
  type: "STORY",
  unlockCondition: {
    requiredQuestId: "quest_main_story_01"
  }
}
```

### Synergie
- Quest completion → unlock event
- Event completion → unlock quest
- Shared story progression

## 👥 Guild systém

### Jak to funguje
Boss battles podporují multiplayer přes `participantIds` array.

### Integrace
```typescript
// V BossService.attackBoss()
let participantIds = dungeonRun.participantIds
if (!participantIds.includes(userId)) {
  participantIds = [...participantIds, userId]
}

await tx.dungeonRun.update({
  where: { id: dungeonRunId },
  data: { participantIds }
})
```

### Guild Boss Battle
```typescript
// Guild members společně útočí na bosse
const guildMembers = await getGuildMembers(guildId)

for (const member of guildMembers) {
  await BossService.attackBoss(dungeonRunId, member.userId, damage)
}
```

### Budoucí rozšíření
- Guild-exclusive events
- Guild vs Guild competitions
- Guild leaderboards
- Shared guild rewards

## 🔔 Notification systém

### Jak to funguje
Event systém vytváří notifikace pro klíčové události.

### Typy notifikací
```typescript
enum NotificationType {
  EVENT_STARTED         // Nový event začal
  EVENT_ENDING_SOON     // Event brzy končí
  BOSS_SPAWNED         // Boss se objevil
  BOSS_DEFEATED        // Boss byl poražen
  EVENT_PHASE_UNLOCKED // Nová fáze příběhu
}
```

### Integrace
```typescript
// Event started
await tx.notification.create({
  data: {
    userId,
    type: NotificationType.EVENT_STARTED,
    title: `Event Started: ${event.title}`,
    message: event.description || "A new event has begun!",
    data: { eventId }
  }
})

// Boss spawned
await tx.notification.create({
  data: {
    userId,
    type: NotificationType.BOSS_SPAWNED,
    title: `Boss Fight: ${boss.name}`,
    message: `Level ${boss.level} - HP: ${boss.hp}`,
    data: { eventId, bossId: boss.id, dungeonRunId }
  }
})

// Phase unlocked
await tx.notification.create({
  data: {
    userId,
    type: NotificationType.EVENT_PHASE_UNLOCKED,
    title: `New Phase Unlocked!`,
    message: `Phase ${nextPhase.phaseNumber}: ${nextPhase.title}`,
    data: { eventId, phaseId: nextPhase.id }
  }
})
```

### Broadcast notifikace
```typescript
// Notifikovat všechny účastníky o boss defeat
for (const participantId of participantIds) {
  await tx.notification.create({
    data: {
      userId: participantId,
      type: NotificationType.BOSS_DEFEATED,
      title: `Boss Defeated!`,
      message: `${boss.name} has been defeated!`,
      data: { bossId, dungeonRunId, rewards }
    }
  })
}
```

## 💰 Money/Shop systém

### Připraveno pro integraci
Event systém má `coinReward` pole připravené pro integraci s money systémem.

### Současný stav
```typescript
// Logging (čeká na MoneyService implementaci)
if (event.coinReward > 0) {
  await logEvent("INFO", "event_coin_reward", {
    userId,
    metadata: { eventId, coinReward: event.coinReward }
  })
}
```

### Budoucí integrace
```typescript
// Když bude MoneyService k dispozici
await MoneyService.addCoins({
  userId,
  amount: event.coinReward,
  reason: `Event completed: ${event.title}`,
  requestId
})
```

## 📊 Leaderboard systém

### Boss Leaderboard
```typescript
// V BossService.getBossLeaderboard()
const leaderboard = await BossService.getBossLeaderboard(bossId, 10)

// Returns top damage dealers
[
  { userId: "user_1", totalDamage: 5000, attacks: 10, user: {...} },
  { userId: "user_2", totalDamage: 4500, attacks: 8, user: {...} },
  ...
]
```

### Event Leaderboard (připraveno)
```typescript
// Budoucí implementace
const eventLeaderboard = await prisma.eventParticipation.findMany({
  where: { eventId },
  orderBy: { progress: 'desc' },
  take: 10,
  include: { user: true }
})
```

## 📈 Progress Tracking

### Event Progress
```typescript
// 0-100% tracking
await EventsServiceV2.updateProgress(eventId, userId, 25)
// progress: 0 → 25 → 50 → 75 → 100
```

### Phase Progress
```typescript
// Automatic progression through phases
await EventsServiceV2.unlockNextPhase(eventId, userId)
// currentPhaseId: phase_1 → phase_2 → phase_3
```

### Boss Progress
```typescript
// HP tracking
const stats = await BossService.getBossFightStats(dungeonRunId)
// {
//   remainingHp: 25000,
//   totalDamage: 25000,
//   progress: 50%
// }
```

## 🎁 Reward systém

### Multi-layered rewards
```typescript
// Event level
Event {
  xpBonus: 500,
  coinReward: 1000,
  rarityReward: "EPIC",
  itemRewards: {...}
}

// Phase level
EventPhase {
  xpReward: 100,
  coinReward: 50
}

// Boss level
Boss {
  xpReward: 2000,
  moneyReward: 5000
}
```

### Automatické udělování
```typescript
// V EventsServiceV2.awardEventRewards()
if (event.xpBonus > 0) {
  await XPService.grantXP(...)
}

if (event.coinReward > 0) {
  // await MoneyService.addCoins(...)
}

await tx.notification.create({
  type: NotificationType.REWARD_RECEIVED,
  data: { xpReward, coinReward, items }
})
```

## 🔐 Permission systém

### Role-based access
```typescript
// OPERATOR: Vytváření eventů
if (session.user.role !== "OPERATOR") {
  return ErrorResponses.forbidden()
}

// STUDENT: Účast na eventech
await EventsServiceV2.participateAdvanced(eventId, userId)

// TEACHER: Účast (stejně jako student)
```

### Unlock conditions
```typescript
// Level requirement
if (condition.minLevel && user.grade < condition.minLevel) {
  return false
}

// Quest requirement
if (condition.requiredQuestId) {
  const quest = await checkQuestCompletion(...)
  if (!quest) return false
}

// Achievement requirement
if (condition.requiredAchievementId) {
  const achievement = await checkAchievement(...)
  if (!achievement) return false
}
```

## 🔄 Data Flow

### Event participation flow
```
1. Student sees event → EventList component
2. Click event → EventDetailView component
3. Check unlock conditions → EventsServiceV2.participateAdvanced()
4. Create participation → EventParticipation record
5. Grant XP → XPService.grantXP()
6. Send notification → Notification record
```

### Boss battle flow
```
1. Student joins event → EventParticipation
2. Start boss fight → BossService.startBossFight()
3. Create dungeon run → DungeonRun record
4. Attack boss → BossService.attackBoss()
5. Log damage → DamageLog record
6. Check HP → if defeated, award rewards
7. Notify all participants → Notification records
```

### Story progression flow
```
1. Student joins story event → EventParticipation
2. Read phase 1 → currentPhaseId = phase_1
3. Complete phase 1 objectives
4. Unlock next phase → EventsServiceV2.unlockNextPhase()
5. Check unlock conditions
6. Update currentPhaseId → phase_2
7. Award phase rewards → XP, coins
8. Notify user → EVENT_PHASE_UNLOCKED
```

## 🧪 Testování integrace

### Test XP integration
```typescript
// 1. Create event with xpBonus
// 2. Student participates
// 3. Check XPAudit for record
const xpAudit = await prisma.xPAudit.findFirst({
  where: {
    userId,
    reason: { contains: event.title }
  }
})
expect(xpAudit.amount).toBe(event.xpBonus)
```

### Test unlock conditions
```typescript
// 1. Create event with requiredQuestId
// 2. Student without quest tries to join
// 3. Should fail with error
// 4. Student completes quest
// 5. Student tries to join again
// 6. Should succeed
```

### Test boss multiplayer
```typescript
// 1. Multiple students join event
// 2. All start boss fight (same dungeonRun)
// 3. Each attacks with different damage
// 4. Check participantIds array
// 5. Check damageByUser stats
// 6. Verify all receive rewards
```

## 📚 Další čtení

- [EVENT_SYSTEM_DOCUMENTATION.md](EVENT_SYSTEM_DOCUMENTATION.md) - Kompletní dokumentace
- [EVENT_SYSTEM_QUICK_REFERENCE.md](EVENT_SYSTEM_QUICK_REFERENCE.md) - Rychlá reference
- [QUEST_SYSTEM_DOCUMENTATION.md](QUEST_SYSTEM_DOCUMENTATION.md) - Quest system
- [GUILD_SYSTEM_DOCUMENTATION.md](GUILD_SYSTEM_DOCUMENTATION.md) - Guild system
- [ACHIEVEMENTS_QUICK_REFERENCE.md](ACHIEVEMENTS_QUICK_REFERENCE.md) - Achievement system

---

**Poznámka**: Všechny integrace jsou navrženy jako non-breaking a zpětně kompatibilní. Systém může fungovat samostatně i v kombinaci s ostatními mechanikami.
