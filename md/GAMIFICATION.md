# 🎮 EduRPG Gamification System - Complete Implementation Guide

## Overview

This document describes the complete gamification system for EduRPG, a school RPG where students earn XP, level up, develop skills, and gain reputation through academic and behavioral activities.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GAMIFICATION CORE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  XP SYSTEM                  PROGRESSION SYSTEM               │
│  ├─ Base XP Earning         ├─ Level Calculation            │
│  ├─ Streak Bonuses          ├─ Skillpoint Distribution      │
│  ├─ Source Tracking         ├─ Reputation Management        │
│  └─ Daily Activity          └─ Skill Development            │
│                                                              │
│  Frontend Components                                         │
│  ├─ LevelProgress.tsx       ├─ StreakDisplay.tsx            │
│  ├─ XPSourcesBreakdown.tsx  └─ XPDashboard.tsx              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 1. XP System (Experience Points)

### 1.1 Sources of XP

Students earn XP from multiple sources:

| Source Type | XP Amount | Frequency | Notes |
|------------|-----------|-----------|-------|
| ATTENDANCE | 25-50 | Daily | Present in class |
| ACTIVITY | 10-100 | Per action | Classroom participation |
| JOB | 50-500 | On completion | Tasks assigned by teachers |
| QUEST | 100-1000 | On completion | Special challenges |
| EVENT | 25-500 | Per participation | School events |
| ACHIEVEMENT | 50-1000 | One-time | Milestone rewards |
| BONUS | Variable | Special | Streak bonuses, seasonal |

### 1.2 Base XP Calculation

```typescript
// Examples of XP rewards
Job completion: 100-300 XP
Regular attendance: 25 XP/day
Exceptional performance: 50-100 XP bonus
```

### 1.3 Streak Bonus System

**How Streaks Work:**
- Counted by consecutive days with any activity
- Multiplier increases by 5% per day (capped at 50% bonus)
- Reset if student misses a day
- Tracked in `Streak` model

**Multiplier Table:**
```
Day 1:  1.0x (no bonus)
Day 2:  1.05x (+5% bonus)
Day 3:  1.10x (+10% bonus)
...
Day 10: 1.50x (+50% bonus - capped)
```

**Example:**
- Base XP earned: 100
- Day 5 of streak (1.25x multiplier)
- Total XP: 125 (100 + 25 bonus)

### 1.4 Level Progression

**Level Curve Design:**
- Levels 1-20: Fast progression (50-200 XP per level)
- Levels 21-60: Moderate progression (200-800 XP per level)
- Levels 61-90: Slower progression (800-2000 XP per level)
- Levels 91-100: Elite progression (2000-5000 XP per level)

**Target:** Level 100 requires ~1,200,000 total XP
- Realistic for ~3.75 years of study
- Requires ~880 XP/day average
- With streaks: achievable with regular participation

**Formula:**
```typescript
const baseXP = 50 * (level ^ 1.5) + (level * 10)
// Applied with curve adjustments per level bracket
```

## 2. Skillpoints System

### 2.1 Skillpoint Earning

Students earn skillpoints when they level up:

| Level Range | Skillpoints |
|------------|------------|
| 1-10 | 1 point per level |
| 11-25 | 1 point per level |
| 26-50 | 2 points per level |
| 51-75 | 2 points per level |
| 76-90 | 3 points per level |
| 91-100 | 5 points per level |

### 2.2 Skill Development

**Available Skills** (17 total across 5 categories):

#### Academic Skills (4)
- Mathematics (📐)
- Science (🔬)
- Literature (📚)
- History (📜)

#### Social Skills (4)
- Communication (💬) - Unlocks at level 1
- Teamwork (👥) - Unlocks at level 1
- Leadership (👑) - Unlocks at level 5
- Empathy (❤️) - Unlocks at level 1

#### Creative Skills (4)
- Art (🎨) - Unlocks at level 1
- Writing (✍️) - Unlocks at level 1
- Music (🎵) - Unlocks at level 1
- Problem Solving (💡) - Unlocks at level 3

#### Technical Skills (2)
- Technology (💻) - Unlocks at level 2
- Research (🔍) - Unlocks at level 3

#### Personal Skills (3)
- Time Management (⏰) - Unlocks at level 1
- Discipline (💪) - Unlocks at level 1
- Adaptability (🔄) - Unlocks at level 2

**Skill Mechanics:**
- Each skill levels from 0-10
- Requires 1 skillpoint per level
- Unlocked at specific character levels
- Specialization tracking

### 2.3 Database Schema

```prisma
model SkillPoint {
  id        String @id @default(cuid())
  userId    String @unique
  available Int    // Unspent
  spent     Int    // Spent on skills
  total     Int    // Total earned
}

model PlayerSkill {
  id         String
  userId     String
  skillId    String
  level      Int     // 0-10
  experience Int     // XP within skill
  points     Int     // Invested points
}

model Skill {
  id          String
  name        String
  category    String
  maxLevel    Int @default(10)
  unlockLevel Int @default(0)
}
```

## 3. Reputation System

### 3.1 Reputation Points

- **Range:** Can be negative (disliked) to positive (loved)
- **Tier System:** 0-10 tiers based on total points (1000 points per tier)
- **Benefits:** Affects quest availability, prices, NPC interactions

### 3.2 Reputation Changes

Actions that affect reputation:

| Action | Change | Type |
|--------|--------|------|
| Complete job excellently | +50 | Job |
| Break deadline | -50 | Job |
| Help teammates | +25 | Activity |
| Earn achievement | +100 | Achievement |
| Event participation | +10-50 | Event |

### 3.3 Reputation Tiers

```
Tier 0:  -1000 to 0     (Disliked)
Tier 1:  1 to 1000      (Neutral)
Tier 2:  1001 to 2000   (Liked)
Tier 3:  2001 to 3000   (Respected)
Tier 4:  3001 to 4000   (Admired)
...
Tier 10: 10000+         (Legendary)
```

## 4. Daily Activity Tracking

### 4.1 Purpose

Tracks daily participation for:
- Streak calculation
- Activity analysis
- Engagement metrics
- Historical data

### 4.2 Daily Activity Record

```prisma
model DailyActivity {
  id           String
  userId       String
  date         DateTime @db.Date
  xpEarned     Int      // Total XP for day
  activityCount Int     // Number of activities
  sources      String[] // Types of activities
}
```

**Example:**
```json
{
  "date": "2026-01-02",
  "xpEarned": 150,
  "activityCount": 3,
  "sources": ["ACTIVITY", "JOB", "ACTIVITY"]
}
```

## 5. Frontend Components

### 5.1 LevelProgress Component

Displays current level and progress to next level.

**Props:**
```typescript
{
  level: number
  totalXP: number
  xpNeededForNextLevel: number
  xpForNextLevel: number
  progressPercent?: number
  compact?: boolean
  showXPText?: boolean
}
```

**Features:**
- Animated progress bar
- XP counter
- Percentage display
- Compact and full modes

### 5.2 StreakDisplay Component

Shows current streak with fire animation and multiplier bonus.

**Features:**
- Consecutive day counter
- Max streak tracking
- Multiplier visualization
- Encouragement messages
- Active/inactive state

### 5.3 XPSourcesBreakdown Component

Shows XP earned by source type over last 30 days.

**Features:**
- Source categorization
- Visual breakdown by percentage
- Bonus XP highlighting
- Summary statistics

### 5.4 XPDashboard Component

Complete dashboard integrating all three components.

**Modes:**
- Tabbed view (default)
- Side-by-side grid layout
- Compact mode

## 6. API Endpoints

### 6.1 XP Endpoints

#### GET /api/xp/student
Get student's current XP and level info.

**Response:**
```json
{
  "totalXP": 5000,
  "level": 15,
  "progressToNextLevel": 45,
  "xpForNextLevel": 1200,
  "xpNeededForNextLevel": 660,
  "streak": {
    "currentStreak": 7,
    "maxStreak": 15,
    "multiplier": 1.35,
    "totalParticipation": 42
  }
}
```

#### POST /api/xp/grant
Grant XP to a student (teachers only).

**Request:**
```json
{
  "studentId": "cuid",
  "subjectId": "cuid",
  "amount": 100,
  "reason": "Participation in discussion"
}
```

#### GET /api/xp/sources
Get XP breakdown by source type.

**Query Params:**
- `studentId`: Optional
- `daysBack`: Default 30

**Response:**
```json
{
  "breakdown": [
    {
      "type": "ACTIVITY",
      "count": 15,
      "totalXP": 750,
      "bonusXP": 125
    }
  ],
  "summary": {
    "totalXP": 2500,
    "totalBonusXP": 400,
    "sourceCount": 4,
    "activityCount": 42
  }
}
```

#### GET /api/xp/history
Get daily activity history.

**Response:**
```json
{
  "history": [
    {
      "date": "2026-01-02",
      "xpEarned": 150,
      "activityCount": 3,
      "sources": ["ACTIVITY", "JOB"]
    }
  ],
  "stats": {
    "totalDays": 30,
    "activeDays": 28,
    "totalXP": 4200,
    "averageXPPerDay": 140
  }
}
```

#### GET /api/xp/streaks
Get streak information.

**Response:**
```json
{
  "currentStreak": 7,
  "maxStreak": 15,
  "xpMultiplier": 1.35,
  "totalParticipation": 42,
  "lastActivityDate": "2026-01-02",
  "isActive": true
}
```

### 6.2 Progression Endpoints

#### GET /api/progression/stats
Get complete progression stats (level, skillpoints, reputation).

**Response:**
```json
{
  "level": 25,
  "totalXP": 125000,
  "skillPoints": {
    "available": 3,
    "spent": 22,
    "total": 25
  },
  "skills": {
    "count": 8,
    "totalLevels": 28,
    "averageLevel": "3.5",
    "specialized": {
      "name": "Mathematics",
      "level": 8,
      "maxLevel": 10
    }
  },
  "reputation": {
    "points": 1250,
    "tier": 1
  }
}
```

#### POST /api/progression/skillpoints/spend
Spend a skillpoint on a skill.

**Request:**
```json
{
  "skillId": "cuid",
  "points": 1
}
```

#### GET /api/progression/reputation
Get reputation history.

**Response:**
```json
{
  "history": [
    {
      "change": 50,
      "reason": "Job completed excellently",
      "sourceType": "JOB",
      "createdAt": "2026-01-02T10:30:00Z"
    }
  ]
}
```

## 7. Integration Guide

### 7.1 Adding XP to a Feature

When implementing a new feature that should award XP:

```typescript
import { XPService } from "@/app/lib/services/xp"

// After user completes action
await XPService.grantXPWithBonus({
  studentId: user.id,
  teacherId: teacher.id,
  subjectId: subject.id,
  amount: 100,
  reason: "Completed quiz",
  sourceType: XPSourceType.ACTIVITY,
  sourceId: quiz.id // Optional
})

// Process any level ups
await XPService.processLevelUp(user.id)
```

### 7.2 Adding Reputation Change

```typescript
import { ProgressionService } from "@/app/lib/services/progression"

await ProgressionService.awardReputation(
  userId,
  50,
  "Job completed excellently",
  jobId,
  "JOB"
)
```

## 8. Database Migrations

All necessary migrations have been created:

1. **20260102195843_add_xp_sources_and_streaks** - XP tracking system
2. **20260102200107_add_skillpoints_reputation** - Skillpoints and reputation

To seed initial skills:
```bash
npx ts-node ops/seed-skills.ts
```

## 9. Performance Considerations

### Indexing
- All major tables indexed on userId and date
- XP queries optimized with batch operations
- Daily activity aggregated for reports

### Caching Opportunities
- Level calculation cached after fetch
- Streak data cache-friendly (updated once daily)
- Reputation tier calculated on demand

### Scalability
- Transaction-based XP grants prevent race conditions
- Activity streaming for leaderboards
- Archive old activity data after 1 year

## 10. Future Enhancements

- [ ] Guild system with shared reputation pool
- [ ] Leaderboards (global, class, skill-based)
- [ ] Seasonal resets with carryover bonuses
- [ ] Friendship/rivalry mechanics
- [ ] Item crafting with skill requirements
- [ ] Daily quests and challenges
- [ ] Ranking systems (Bronze, Silver, Gold, Platinum)
- [ ] Mentor/mentee pairing system

## 11. Testing

Run tests:
```bash
npm test -- app/api/xp
npm test -- app/lib/services/xp.ts
npm test -- app/lib/leveling.ts
```

Key test scenarios:
- XP grant with streak bonus
- Level up detection
- Skillpoint awarding
- Daily activity tracking
- Reputation changes
- Edge cases (timezone, concurrent grants)

---

**Last Updated:** January 2, 2026
**Status:** ✅ Complete and Functional
