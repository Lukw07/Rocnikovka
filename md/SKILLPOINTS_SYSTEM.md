# Skillpoints & Core Attributes System

## Overview
The Skillpoints system allows players to invest points from level-ups into **5 core attributes** that provide system-wide bonuses throughout the gamification system.

## Core Attributes

### 1. **Time Management** ⏰
- **Icon**: ⏰
- **Effect**: Increases XP gain by **+2% per level** (max +20%)
- **Max Level**: 10
- **Description**: Master the art of time management
- **Usage**: Every activity that grants XP gets a multiplier

### 2. **Focus** 🎯
- **Icon**: 🎯
- **Effect**: Increases skill learning speed by **+3% per level** (max +30%)
- **Max Level**: 10
- **Description**: Sharpen your focus and concentration
- **Usage**: When leveling up skills, gain more experience towards next level

### 3. **Leadership** 👑
- **Icon**: 👑
- **Effect**: Increases job rewards by **+2% per level** (max +20%)
- **Max Level**: 10
- **Description**: Become a leader and motivate others
- **Usage**: Job completion XP and money rewards are multiplied

### 4. **Communication** 💬
- **Icon**: 💬
- **Effect**: Increases reputation gains by **+3% per level** (max +30%)
- **Max Level**: 10
- **Description**: Master communication skills
- **Usage**: Reputation points from all sources are multiplied

### 5. **Consistency** 🔄
- **Icon**: 🔄
- **Effect**: Increases streak bonuses by **+1.5% per level** (max +15%)
- **Max Level**: 10
- **Description**: Build consistency and reliability
- **Usage**: Streak multiplier is enhanced when performing daily activities

---

## How the System Works

### 1. **Skillpoint Acquisition**
Players earn skillpoints when they level up:
- Levels 1-10: 1 skillpoint per level
- Levels 11-25: 1 skillpoint per level
- Levels 26-50: 2 skillpoints per level
- Levels 51-75: 2 skillpoints per level
- Levels 76-90: 3 skillpoints per level
- Levels 91-100: 5 skillpoints per level

### 2. **Skillpoint Allocation**
Players can spend skillpoints to level up core attributes:
```typescript
POST /api/progression/skillpoints/spend
{
  skillId: "skill-id-of-attribute",
  points: 1  // Usually 1 skillpoint per level-up
}
```

### 3. **Attribute Effects**
When calculating XP, job rewards, reputation, and streaks, the system applies bonuses based on attribute levels:

**Time Management Bonus (XP)**:
```
baseXP = 100
timeManagementLevel = 5
bonus = 1 + (5 * 0.02) = 1.10 (10% bonus)
finalXP = 100 * 1.10 = 110
```

**Leadership Bonus (Job Rewards)**:
```
jobXP = 50
leadershipLevel = 3
bonus = 1 + (3 * 0.02) = 1.06 (6% bonus)
finalJobXP = 50 * 1.06 = 53
```

---

## Integration Points

### XP Service (`app/lib/services/xp.ts`)
- Time Management bonus is applied in `grantXPWithBonus()`
- When XP is granted, player's Time Management level is checked and bonus is applied
- Works transparently with all XP sources (jobs, activities, events, etc.)

### Jobs Service (`app/lib/services/jobs.ts`)
- When a job is completed, students receive:
  - XP with Leadership bonus applied
  - Money with Leadership bonus applied
  - **1 skillpoint** (for free, as job completion reward)
- Skillpoint grant is automatic and doesn't require student action

### Progression Service (`app/lib/services/progression.ts`)
- Handles skillpoint spending
- Validates skill levels and max levels
- Tracks points spent vs available

### Attribute Effects System (`app/lib/attribute-effects.ts`)
- Central calculation engine for all attribute bonuses
- Functions:
  - `getPlayerAttributeEffects()` - Get all player's attribute bonuses
  - `applyTimeManagementBonus()` - Apply Time Management bonus
  - `applyLeadershipBonus()` - Apply Leadership bonus
  - `applyCommunicationBonus()` - Apply Communication bonus
  - `applyConsistencyBonus()` - Apply Consistency bonus
  - `applyFocusBonus()` - Apply Focus bonus

---

## Frontend Components

### 1. **SkillsDisplay** (`components/dashboard/attributes/skills-display.tsx`)
Displays all player's core attributes with:
- Current level and max level
- Visual progress bars
- Active effects summary
- Helpful tips

Usage:
```tsx
import { SkillsDisplay } from "@/app/components/dashboard/attributes/skills-display"

export function Dashboard() {
  return <SkillsDisplay userId={userId} />
}
```

### 2. **SkillPointAllocator** (`components/dashboard/attributes/skillpoint-allocator.tsx`)
Interface for allocating skillpoints:
- Shows available skillpoints
- Lists all core attributes
- Allows spending 1 skillpoint per action
- Confirmation dialog

Usage:
```tsx
import { SkillPointAllocator } from "@/app/components/dashboard/attributes/skillpoint-allocator"

export function AllocationPanel() {
  return (
    <SkillPointAllocator 
      onSkillPurchased={(skillId, skillName, newLevel) => {
        console.log(`${skillName} leveled up to ${newLevel}`)
      }}
    />
  )
}
```

### 3. **AttributeProgressBar** (`components/dashboard/attributes/attribute-progress-bar.tsx`)
Single attribute display with:
- Icon and name
- Progress bar to max level
- Bonus effect display
- Tooltip with details

---

## Database Schema

```prisma
model Skill {
  id          String        @id @default(cuid())
  name        String        // "Time Management", "Focus", etc.
  description String
  category    String        // "Core" for core attributes
  icon        String?       // "⏰", "🎯", etc.
  maxLevel    Int           @default(10)
  unlockLevel Int           @default(0)
  isActive    Boolean       @default(true)
  playerSkills PlayerSkill[]
}

model PlayerSkill {
  id            String   @id @default(cuid())
  userId        String
  skillId       String
  level         Int      @default(0)      // Current level
  experience    Int      @default(0)      // Experience towards next level
  points        Int      @default(0)      // Total points invested
  unlockLevel   Int      @default(0)
  lastLeveledAt DateTime?
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill         Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
}

model SkillPoint {
  id        String   @id @default(cuid())
  userId    String   @unique
  available Int      @default(0)    // Unspent skillpoints
  spent     Int      @default(0)    // Spent skillpoints
  total     Int      @default(0)    // Total earned
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints

### GET `/api/progression/attributes`
Get list of all available core attributes.

**Response**:
```json
{
  "attributes": [
    {
      "id": "skill-1",
      "name": "Time Management",
      "description": "...",
      "icon": "⏰",
      "maxLevel": 10,
      "unlockLevel": 0,
      "isActive": true
    }
    // ... 4 more attributes
  ],
  "total": 5
}
```

### GET `/api/progression/attributes/player`
Get player's current attribute levels and bonuses.

**Response**:
```json
{
  "attributes": [
    {
      "id": "player-skill-1",
      "skillId": "skill-1",
      "name": "Time Management",
      "currentLevel": 5,
      "maxLevel": 10,
      "bonus": "+10% XP gain"
    }
    // ... all attributes
  ],
  "effects": {
    "timeManagementBonus": 1.10,
    "focusBonus": 1.05,
    "leadershipBonus": 1.08,
    "communicationBonus": 1.12,
    "consistencyBonus": 1.06,
    "totalEffectPower": 45.2
  },
  "attributeCount": 5,
  "totalPower": 45.2
}
```

### POST `/api/progression/skillpoints/spend`
Allocate 1 skillpoint to increase an attribute level.

**Request**:
```json
{
  "skillId": "skill-1",
  "points": 1
}
```

**Response**:
```json
{
  "id": "player-skill-1",
  "level": 6,
  "points": 6,
  "lastLeveledAt": "2026-01-02T10:30:00Z"
}
```

---

## Seeding Core Attributes

Run the seed script to initialize core attributes:
```bash
npx ts-node ops/seed-core-attributes.ts
```

This creates:
- Time Management ⏰
- Focus 🎯
- Leadership 👑
- Communication 💬
- Consistency 🔄

---

## Important Notes

1. **Automatic Skillpoint Grant on Job Completion**
   - When a job is completed, students automatically receive 1 skillpoint
   - This is separate from level-up skillpoint grants
   - Encourages job participation

2. **Leadership Bonus on Jobs**
   - When completing a job, students get XP/money with Leadership bonus
   - Higher Leadership = better job rewards
   - Encourages developing Leadership attribute

3. **Time Management Bonus on All XP**
   - Applies to ALL XP sources: jobs, activities, achievements, events, etc.
   - Transparent to callers - just multiply base XP
   - Encourages developing Time Management attribute

4. **Compatibility**
   - All bonuses stack naturally with existing multipliers (streaks, events)
   - All bonus calculations are done server-side
   - Frontend displays bonus information but doesn't calculate

5. **Performance**
   - Attribute effects are cached in service calls
   - No extra database queries for bonus calculations
   - Efficient even with many concurrent players

---

## Example Scenario

**Player Flow**:
1. Player reaches Level 5, earns 1 skillpoint
2. Player opens SkillPointAllocator component
3. Player clicks "Allocate Point" on Leadership
4. Skillpoint is spent, Leadership level goes from 4 → 5
5. System now applies +10% bonus to all job rewards
6. Player completes a job worth 50 XP
7. System calculates: 50 * 1.10 (Leadership) = 55 XP granted
8. Plus student gets 1 skillpoint as job completion reward
9. Player can now spend 2 skillpoints or wait for more level-ups

---

## Future Extensions

This system can be extended with:
- **Attribute-specific quests**: "Improve Leadership" challenges
- **Synergy bonuses**: Having multiple attributes at high levels = extra bonus
- **Prestige system**: Reset attributes for legendary badges
- **Attribute-based unlocks**: Certain items/jobs require minimum attribute levels
- **Attribute mastery**: Special effects at max level
