# 🏆 Achievement & Streak System - Implementace

## ✅ Implementováno

Systém achievementů a streaks byl kompletně implementován s následujícími funkcemi:

## 📊 Databázové modely

### Achievement Model (Rozšířený)
```prisma
model Achievement {
  id                String                  @id @default(cuid())
  name              String
  description       String
  type              AchievementType         @default(NORMAL)  // NORMAL, HIDDEN, TEMPORARY, PROGRESSIVE, STREAK
  category          AchievementCategory     @default(OTHER)   // LEVEL, XP, ACTIVITY, QUEST, JOB, SKILL, REPUTATION, SOCIAL, COLLECTION, SPECIAL, OTHER
  badgeUrl          String?
  icon              String?
  color             String?
  criteria          String?
  target            Int?
  rarity            ItemRarity              @default(COMMON)  // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
  
  // Odměny
  xpReward          Int                     @default(0)
  skillpointsReward Int                     @default(0)
  reputationReward  Int                     @default(0)
  moneyReward       Int                     @default(0)
  
  // Časové omezení
  availableFrom     DateTime?
  availableTo       DateTime?
  
  // Metadata
  sortOrder         Int                     @default(0)
  isActive          Boolean                 @default(true)
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
  
  // Relations
  awards            AchievementAward[]
  progresses        AchievementProgress[]
}
```

### AchievementProgress Model (Nový)
```prisma
model AchievementProgress {
  id            String      @id @default(cuid())
  userId        String
  achievementId String
  currentValue  Int         @default(0)
  targetValue   Int
  lastUpdated   DateTime    @updatedAt
  createdAt     DateTime    @default(now())
  
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
}
```

### Streak Model (Rozšířený)
```prisma
model Streak {
  id                String          @id @default(cuid())
  userId            String          @unique
  currentStreak     Int             @default(0)
  maxStreak         Int             @default(0)
  lastActivityDate  DateTime?
  streakBrokenAt    DateTime?
  totalParticipation Int            @default(0)
  currentMultiplier Float           @default(1.0)
  
  // Nové
  milestonesReached Int[]           @default([])
  lastRewardedAt    DateTime?
  
  updatedAt         DateTime        @updatedAt
  createdAt         DateTime        @default(now())
  
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  rewards           StreakReward[]
}
```

### StreakReward Model (Nový)
```prisma
model StreakReward {
  id          String   @id @default(cuid())
  streakId    String
  milestone   Int
  xpReward    Int      @default(0)
  moneyReward Int      @default(0)
  itemReward  String?
  createdAt   DateTime @default(now())
  
  streak      Streak   @relation(fields: [streakId], references: [id], onDelete: Cascade)
}
```

### Notification Model (Nový)
```prisma
enum NotificationType {
  ACHIEVEMENT_UNLOCKED
  ACHIEVEMENT_PROGRESS
  STREAK_MILESTONE
  LEVEL_UP
  QUEST_COMPLETED
  REWARD_RECEIVED
  GUILD_INVITE
  SYSTEM
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  data      Json?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
  
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 🔧 Backend Services

### 1. AchievementsEnhancedService
**Soubor:** `app/lib/services/achievements-enhanced.ts`

**Hlavní metody:**
- `createAchievement(data)` - Vytvoření achievementu
- `getUserAchievementsWithProgress(userId)` - Získání achievementů s progress trackinigem
- `unlockAchievement(userId, achievementId)` - Odemknutí achievementu + udělení odměn
- `updateAchievementProgress(userId, achievementId, increment)` - Update progressu
- `checkAndUnlockAchievements(userId)` - Automatická kontrola a odemykání

**Features:**
- ✅ Hidden achievementy (zobrazí se až po odemčení)
- ✅ Progressive achievementy (s progress barem)
- ✅ Temporary achievementy (časově omezené)
- ✅ Automatické udělování odměn (XP, skillpoints, reputation, money)
- ✅ Notifikace při odemčení

### 2. StreakService
**Soubor:** `app/lib/services/streak.ts`

**Hlavní metody:**
- `getStreakInfo(userId)` - Informace o streaku
- `recordActivity(userId, xpEarned, source)` - Zaznamenání aktivity
- `getTopStreaks(limit)` - Leaderboard streaks
- `resetBrokenStreaks()` - Cron job pro reset proloených streaks

**Features:**
- ✅ Denní tracking aktivit
- ✅ Streak milníky (3, 7, 14, 30, 60, 100, 365 dní)
- ✅ XP multiplikátor (roste se streakem)
- ✅ Automatické odměny za milníky
- ✅ Notifikace při dosažení milníku / prolomení

**Streak Milníky:**
```typescript
[
  { days: 3, xpReward: 50, moneyReward: 10, multiplierBonus: 0.05 },
  { days: 7, xpReward: 150, moneyReward: 30, multiplierBonus: 0.1 },
  { days: 14, xpReward: 300, moneyReward: 75, multiplierBonus: 0.15 },
  { days: 30, xpReward: 750, moneyReward: 200, multiplierBonus: 0.25 },
  { days: 60, xpReward: 1500, moneyReward: 500, multiplierBonus: 0.35 },
  { days: 100, xpReward: 3000, moneyReward: 1000, multiplierBonus: 0.5 },
  { days: 365, xpReward: 10000, moneyReward: 5000, multiplierBonus: 1.0 }
]
```

### 3. NotificationService
**Soubor:** `app/lib/services/notification.ts`

**Hlavní metody:**
- `createNotification(userId, type, title, message, data)`
- `getUnreadNotifications(userId)`
- `getAllNotifications(userId, limit)`
- `markAsRead(notificationId, userId)`
- `markAllAsRead(userId)`
- `getUnreadCount(userId)`

### 4. AchievementIntegrationService
**Soubor:** `app/lib/services/achievement-integration.ts`

**Integration Hooks:**
- `onXPGained(userId, xpAmount, source)` - Po získání XP
- `onQuestCompleted(userId, questId)` - Po dokončení questu
- `onJobCompleted(userId, jobId)` - Po dokončení jobu
- `onSkillUpgraded(userId, skillId, newLevel)` - Po upgrade skillu
- `onReputationChanged(userId, amount, newTotal)` - Po změně reputace
- `onStreakMilestone(userId, streakDays)` - Po dosažení streak milníku
- `onGuildJoined(userId, guildId)` - Po připojení k guildě
- `bulkCheckAchievements(userId)` - Bulk kontrola všech achievementů

## 🌐 API Endpointy

### Achievements
- `GET /api/achievements/enhanced` - Seznam achievementů s progressem
- `POST /api/achievements/enhanced` - Vytvoření achievementu (OPERATOR)
- `POST /api/achievements/[id]/unlock` - Odemknutí achievementu
- `POST /api/achievements/[id]/progress` - Update progressu

### Streak
- `GET /api/streak` - Info o streaku
- `POST /api/streak/activity` - Zaznamenání aktivity
- `GET /api/streak/leaderboard` - Top streaks leaderboard

### Notifications
- `GET /api/notifications` - Seznam notifikací
  - Query params: `?unreadOnly=true`, `?type=ACHIEVEMENT_UNLOCKED`, `?limit=100`
- `POST /api/notifications/[id]/read` - Označit jako přečtené
- `POST /api/notifications/all/read` - Označit vše jako přečtené

## 🎨 Frontend Komponenty

### 1. AchievementsPanelEnhanced
**Soubor:** `app/components/achievements/AchievementsPanelEnhanced.tsx`

**Features:**
- ✅ Grid layout achievementů
- ✅ Filtrace podle kategorie (LEVEL, XP, ACTIVITY, QUEST, JOB, SKILL)
- ✅ Taby (All, Unlocked, Locked, Progressive)
- ✅ Progress bar pro PROGRESSIVE achievementy
- ✅ Zobrazení odměn (XP, skillpoints, reputation, money)
- ✅ Rarita badges (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
- ✅ Hidden achievementy zobrazené jako "???" dokud nejsou odemčené
- ✅ Unlock date
- ✅ Statistiky (unlocked vs locked)

### 2. StreakCard
**Soubor:** `app/components/dashboard/StreakCard.tsx`

**Features:**
- ✅ Aktuální streak counter
- ✅ Stats grid (current, max, multiplier, total participation)
- ✅ Warning před prolomením streaku (< 24h)
- ✅ Progress bar k dalšímu milníku
- ✅ Seznam dosažených milníků
- ✅ Timeline všech milníků s odměnami
- ✅ Visual highlighting aktuálního milníku

### 3. NotificationsPanel
**Soubor:** `app/components/dashboard/NotificationsPanel.tsx`

**Features:**
- ✅ Seznam notifikací s ikonami podle typu
- ✅ Unread badge s počtem
- ✅ Filtrace (unread / all)
- ✅ Mark as read (single / all)
- ✅ Zobrazení odměn v notifikaci
- ✅ Timestamp
- ✅ ScrollArea pro dlouhý seznam

## 🔗 Integrace s existujícími systémy

### XP System
Při každém přidání XP se volá:
```typescript
AchievementIntegrationService.onXPGained(userId, xpAmount, source)
```

**Co se děje:**
1. Zaznamenání aktivity → update streaku
2. Kontrola XP-based progressive achievementů
3. Kontrola level-based achievementů
4. Bulk check dalších achievementů

### Skillpoints System
Při upgrade skillu:
```typescript
AchievementIntegrationService.onSkillUpgraded(userId, skillId, newLevel)
```

### Reputation System
Při změně reputace:
```typescript
AchievementIntegrationService.onReputationChanged(userId, amount, newTotal)
```

### Quest System
Po dokončení questu:
```typescript
AchievementIntegrationService.onQuestCompleted(userId, questId)
```

### Job System
Po dokončení jobu:
```typescript
AchievementIntegrationService.onJobCompleted(userId, jobId)
```

### Guild System
Po připojení k guildě:
```typescript
AchievementIntegrationService.onGuildJoined(userId, guildId)
```

## 📦 Seed Data

**Soubor:** `ops/seed-achievements.ts`

**Obsahuje:**
- 6 Level achievementů (úrovně 1, 5, 10, 25, 50, 100)
- 3 XP achievementy (1k, 5k, 10k XP)
- 4 Streak achievementy (3, 7, 30, 100 dní)
- 3 Quest achievementy (1, 10, 50 questů)
- 3 Job achievementy (1, 10, 50 jobů)
- 2 Skill achievementy (level 5, level 10)
- 3 Hidden achievementy (speciální)

**Spuštění:**
```bash
npx ts-node ops/seed-achievements.ts
```

## 🚀 Použití

### 1. Migrace databáze
```bash
npx prisma migrate dev --name add_achievements_and_streaks
npx prisma generate
```

### 2. Seed základních achievementů
```bash
npx ts-node ops/seed-achievements.ts
```

### 3. Integrace do XP systému
V souboru kde se přidává XP (např. `app/lib/services/xp.ts`):

```typescript
import { AchievementIntegrationService } from './achievement-integration'

// Po přidání XP
await AchievementIntegrationService.onXPGained(userId, xpAmount, 'QUEST_COMPLETED')
```

### 4. Zobrazení achievementů na frontendu
```tsx
import AchievementsPanelEnhanced from '@/app/components/achievements/AchievementsPanelEnhanced'

<AchievementsPanelEnhanced />
```

### 5. Zobrazení streaku v dashboardu
```tsx
import StreakCard from '@/app/components/dashboard/StreakCard'

<StreakCard />
```

### 6. Notifikace
```tsx
import NotificationsPanel from '@/app/components/dashboard/NotificationsPanel'

<NotificationsPanel />
```

## 🎯 Typy achievementů

### NORMAL
- Standardní achievement, vždy viditelný
- Odemkne se ručně nebo automaticky při splnění kritérií

### HIDDEN
- Skrytý achievement
- Zobrazuje se jako "???" dokud není odemčený
- Užitečné pro tajné achievementy a easter eggs

### PROGRESSIVE
- Achievement s postupným progressem
- Má target (např. "získej 1000 XP")
- Zobrazuje progress bar
- Notifikace při milnících (25%, 50%, 75%)

### TEMPORARY
- Časově omezený achievement
- Má `availableFrom` a `availableTo`
- Užitečné pro eventy

### STREAK
- Achievement spojený se streaky
- Automaticky se odemkne při dosažení konkrétního počtu dní

## 💡 Best Practices

1. **Vždy volejte integration hooks** po změně stavu (XP, quest completion, atd.)
2. **Používejte try-catch** při odemykání achievementů (může být již odemčený)
3. **Hidden achievementy** používejte střídmě - uživatel by měl mít alespoň nápovědu
4. **Progressive achievementy** jsou ideální pro dlouhodobé cíle
5. **Notifikace** jsou důležité pro user engagement - informujte o každém úspěchu

## 🔄 Cron Jobs

### Reset proloených streaks (denně)
```typescript
// ops/streak-cron.ts
import { StreakService } from '@/app/lib/services/streak'

async function main() {
  const result = await StreakService.resetBrokenStreaks()
  console.log(`Reset ${result.resetCount} broken streaks`)
}
```

### Cleanup starých notifikací (týdně)
```typescript
// ops/notification-cleanup.ts
import { NotificationService } from '@/app/lib/services/notification'

async function main() {
  const result = await NotificationService.cleanupOldNotifications(30)
  console.log(`Deleted ${result.deletedCount} old notifications`)
}
```

## ✅ Checklist implementace

- [x] Databázové modely (Achievement, Streak, Notification)
- [x] Backend services (achievements, streak, notification, integration)
- [x] API endpointy (achievements, streak, notifications)
- [x] Frontend komponenty (achievements panel, streak card, notifications)
- [x] Integration hooks (XP, quest, job, skill, reputation)
- [x] Seed data (základní achievementy)
- [x] Dokumentace

## 🎉 Systém je kompletně funkční!

Achievementy a streaky jsou nyní plně integrované do EduRPG systému a propojené s:
- ✅ XP systémem
- ✅ Skillpoints systémem
- ✅ Reputation systémem
- ✅ Quest systémem
- ✅ Job systémem
- ✅ Guild systémem (připraveno)

**Odměny jsou automaticky udělovány** při odemčení achievementů a dosažení streak milníků!
