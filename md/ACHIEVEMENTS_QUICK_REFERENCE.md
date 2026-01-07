# 🏆 Achievements & Streaks - Quick Reference

## 🚀 Rychlý start

### 1. Migrace databáze
```bash
npx prisma migrate dev --name add_achievements_streaks
npx prisma generate
```

### 2. Seed achievementy
```bash
npx ts-node ops/seed-achievements.ts
```

### 3. Integrace
```typescript
// V XP service
import { AchievementIntegrationService } from '@/app/lib/services/achievement-integration'

await AchievementIntegrationService.onXPGained(userId, 100, 'QUEST_COMPLETED')
```

## 📋 Typy achievementů

| Typ | Popis | Použití |
|-----|-------|---------|
| **NORMAL** | Standardní achievement | Běžné cíle (dosáhnout level 10) |
| **HIDDEN** | Skrytý achievement | Easter eggs, tajné achievementy |
| **PROGRESSIVE** | S progress barem | Dlouhodobé cíle (získej 1000 XP) |
| **TEMPORARY** | Časově omezený | Event-based achievementy |
| **STREAK** | Spojený se streaky | Milníky streaku (7 dní v řadě) |

## 🎯 Kategorie

| Kategorie | Příklad |
|-----------|---------|
| **LEVEL** | Dosáhnout levelu 10 |
| **XP** | Získat celkem 5000 XP |
| **ACTIVITY** | Přihlásit se 7 dní v řadě |
| **QUEST** | Dokončit 10 questů |
| **JOB** | Dokončit 5 jobů |
| **SKILL** | Upgraduj skill na max |
| **REPUTATION** | Dosáhnout 1000 reputace |
| **SOCIAL** | Připoj se do guildy |
| **COLLECTION** | Sběratelské achievementy |
| **SPECIAL** | Speciální události |

## 💎 Rarita

| Rarita | Barva | Význam |
|--------|-------|--------|
| **COMMON** | Šedá | Snadné achievementy |
| **UNCOMMON** | Zelená | Středně těžké |
| **RARE** | Modrá | Těžké |
| **EPIC** | Fialová | Velmi těžké |
| **LEGENDARY** | Zlatá | Extrémně vzácné |

## 🔥 Streak milníky

| Dny | XP | Peníze | XP Bonus |
|-----|----|----|----------|
| 3 | 50 | 10 | +5% |
| 7 | 150 | 30 | +10% |
| 14 | 300 | 75 | +15% |
| 30 | 750 | 200 | +25% |
| 60 | 1500 | 500 | +35% |
| 100 | 3000 | 1000 | +50% |
| 365 | 10000 | 5000 | +100% |

## 📡 API Endpointy

### Achievements
```typescript
// Získat achievementy
GET /api/achievements/enhanced

// Vytvořit achievement (OPERATOR)
POST /api/achievements/enhanced
{
  "name": "Test Achievement",
  "description": "Test description",
  "type": "PROGRESSIVE",
  "category": "XP",
  "target": 1000,
  "xpReward": 100
}

// Odemknout achievement
POST /api/achievements/[id]/unlock
{ "userId": "..." }

// Update progress
POST /api/achievements/[id]/progress
{ "increment": 1 }
```

### Streak
```typescript
// Info o streaku
GET /api/streak

// Zaznamenat aktivitu
POST /api/streak/activity
{
  "xpEarned": 50,
  "source": "QUEST_COMPLETED"
}

// Leaderboard
GET /api/streak/leaderboard?limit=10
```

### Notifications
```typescript
// Nepřečtené notifikace
GET /api/notifications?unreadOnly=true

// Všechny notifikace
GET /api/notifications?limit=100

// Podle typu
GET /api/notifications?type=ACHIEVEMENT_UNLOCKED

// Označit jako přečtené
POST /api/notifications/[id]/read

// Označit vše
POST /api/notifications/all/read
```

## 🔌 Integration hooks

```typescript
import { AchievementIntegrationService as AIS } from './achievement-integration'

// Po získání XP
await AIS.onXPGained(userId, xpAmount, 'QUEST_COMPLETED')

// Po dokončení questu
await AIS.onQuestCompleted(userId, questId)

// Po dokončení jobu
await AIS.onJobCompleted(userId, jobId)

// Po upgrade skillu
await AIS.onSkillUpgraded(userId, skillId, newLevel)

// Po změně reputace
await AIS.onReputationChanged(userId, amount, newTotal)

// Po dosažení milníku
await AIS.onStreakMilestone(userId, streakDays)

// Po připojení do guildy
await AIS.onGuildJoined(userId, guildId)

// Bulk check
await AIS.bulkCheckAchievements(userId)
```

## 🎨 Frontend komponenty

```tsx
// Achievement panel
import AchievementsPanelEnhanced from '@/app/components/achievements/AchievementsPanelEnhanced'

<AchievementsPanelEnhanced />
```

```tsx
// Streak card
import StreakCard from '@/app/components/dashboard/StreakCard'

<StreakCard />
```

```tsx
// Notifikace
import NotificationsPanel from '@/app/components/dashboard/NotificationsPanel'

<NotificationsPanel />
```

## 💡 Příklady vytváření achievementů

### Standardní achievement
```typescript
await AchievementsEnhancedService.createAchievement({
  name: 'Level 10',
  description: 'Dosáhni levelu 10',
  type: 'NORMAL',
  category: 'LEVEL',
  icon: '🎓',
  color: '#3b82f6',
  rarity: 'UNCOMMON',
  target: 10,
  xpReward: 250,
  skillpointsReward: 2,
  reputationReward: 25,
  moneyReward: 150
})
```

### Progressive achievement
```typescript
await AchievementsEnhancedService.createAchievement({
  name: 'XP Collector',
  description: 'Získej celkem 1000 XP',
  type: 'PROGRESSIVE',
  category: 'XP',
  icon: '⚡',
  color: '#eab308',
  rarity: 'COMMON',
  target: 1000,
  xpReward: 100,
  moneyReward: 100
})
```

### Hidden achievement
```typescript
await AchievementsEnhancedService.createAchievement({
  name: 'Night Owl',
  description: 'Přihlásil ses mezi 2:00 a 4:00 ráno',
  type: 'HIDDEN',
  category: 'SPECIAL',
  icon: '🦉',
  color: '#1e293b',
  rarity: 'UNCOMMON',
  xpReward: 100,
  moneyReward: 100
})
```

### Temporary achievement (event)
```typescript
await AchievementsEnhancedService.createAchievement({
  name: 'Summer Challenge',
  description: 'Dokončeno během letní akce',
  type: 'TEMPORARY',
  category: 'SPECIAL',
  icon: '☀️',
  rarity: 'RARE',
  availableFrom: new Date('2026-06-01'),
  availableTo: new Date('2026-08-31'),
  xpReward: 500,
  moneyReward: 500
})
```

## 🔧 Užitečné služby

### Odemknout achievement programatically
```typescript
import { AchievementsEnhancedService } from './achievements-enhanced'

const result = await AchievementsEnhancedService.unlockAchievement(
  userId,
  achievementId,
  awardedBy // optional
)

console.log(result.rewards) // { xp: 100, skillpoints: 2, ... }
```

### Update progressive achievement
```typescript
await AchievementsEnhancedService.updateAchievementProgress(
  userId,
  achievementId,
  10 // increment by 10
)
```

### Získat streak info
```typescript
import { StreakService } from './streak'

const info = await StreakService.getStreakInfo(userId)
console.log(info.currentStreak) // 7
console.log(info.nextMilestone) // 14
console.log(info.currentMultiplier) // 1.1
```

### Vytvořit notifikaci
```typescript
import { NotificationService } from './notification'

await NotificationService.createNotification(
  userId,
  'ACHIEVEMENT_UNLOCKED',
  '🏆 Achievement Unlocked!',
  'You earned: Level 10 Master',
  { achievementId, rewards: { xp: 100 } }
)
```

## ⚠️ Časté chyby

### 1. Achievement již odemčený
```typescript
try {
  await AchievementsEnhancedService.unlockAchievement(userId, achievementId)
} catch (error) {
  // Achievement already unlocked - OK to ignore
}
```

### 2. Progressive achievement bez targetu
```typescript
// ❌ Špatně
{ type: 'PROGRESSIVE', target: undefined }

// ✅ Správně
{ type: 'PROGRESSIVE', target: 1000 }
```

### 3. Hidden achievement s availableFrom
```typescript
// ❌ Může být problém - uživatel nevidí kdy bude dostupný
{ type: 'HIDDEN', availableFrom: new Date('2026-06-01') }

// ✅ Lepší
{ type: 'HIDDEN' } // Jen hidden, bez časového omezení
```

## 📊 Monitoring

### Statistiky achievementů
```typescript
const stats = await AchievementsService.getAchievementStats()
// {
//   totalAchievements: 30,
//   activeAchievements: 28,
//   totalAwards: 1250,
//   uniqueAwardedUsers: 85
// }
```

### Top streaks
```typescript
const topStreaks = await StreakService.getTopStreaks(10)
// [
//   { userId: '...', userName: 'John', currentStreak: 45, ... },
//   ...
// ]
```

## 🎉 Hotovo!

Systém je připraven k použití. Stačí:
1. Spustit migraci
2. Seedovat achievementy
3. Přidat integration hooks do existujících systémů
4. Užívat si gamifikaci! 🚀
