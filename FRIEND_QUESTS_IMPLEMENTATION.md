# Friend Quests System - Implementační Dokumentace

## 📋 Obsah

1. [Přehled systému](#přehled-systému)
2. [Datábazové schema](#databázové-schema)
3. [Backend architektura](#backend-architektura)
4. [API specifikace](#api-specifikace)
5. [Frontend komponenty](#frontend-komponenty)
6. [Business logika](#business-logika)
7. [Integrace s ostatními systémy](#integrace-s-ostatními-systémy)
8. [Testování](#testování)

---

## Přehled systému

### Účel

Friend Quests jsou speciální typ questů určených pro dvojice přátel, které podporují:
- **Týmovou spolupráci** mezi studenty
- **Omezené opakování** (jednou, denně, týdně, nebo s limitem)
- **Společný progress tracking** pro oba hráče
- **Automatické rozdělení odměn**
- **Integraci s reputation systémem**

### Klíčové vlastnosti

1. ✅ **Validace přátelství** - Quest mohou přijmout pouze přátelé
2. ✅ **Omezení opakování** - ONE_TIME, DAILY, WEEKLY, LIMITED typy
3. ✅ **Cooldown management** - Časové omezení mezi dokončeními
4. ✅ **Progress tracking** - Samostatný progress pro každého hráče
5. ✅ **Reward distribution** - XP, money, items, reputation, skillpoints
6. ✅ **Požadavky** - Level, reputation, friendship age kontroly

---

## Databázové schema

### 1. FriendQuest

Hlavní tabulka pro Friend Questy.

```prisma
model FriendQuest {
  id                  String             @id @default(cuid())
  title               String
  description         String
  category            String
  difficulty          QuestDifficulty
  questType           FriendQuestType    @default(ONE_TIME)
  
  // Omezení opakování
  maxCompletions      Int?               // Null = neomezené
  cooldownHours       Int?               // Cooldown mezi dokončeními
  
  // Požadavky
  requiredLevel       Int                @default(0)
  requiredReputation  Int                @default(0)
  friendshipMinDays   Int                @default(0)
  
  // Metadata
  isActive            Boolean            @default(true)
  expiresAt           DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  createdBy           String
  
  // Relations
  rewards             FriendQuestReward[]
  progresses          FriendQuestProgress[]
  completions         FriendQuestCompletion[]
  
  @@index([questType])
  @@index([difficulty])
  @@index([isActive])
  @@index([category])
}
```

**Pole vysvětlení:**

- `questType`: Typ questu (ONE_TIME, DAILY, WEEKLY, LIMITED)
- `maxCompletions`: Pro LIMITED typ - kolikrát lze dokončit
- `cooldownHours`: Pro DAILY/WEEKLY - hodiny mezi dokončeními
- `requiredLevel`: Minimální level pro přijetí
- `requiredReputation`: Minimální reputation score
- `friendshipMinDays`: Minimální stáří přátelství ve dnech

### 2. FriendQuestReward

Definice odměn pro Friend Quest.

```prisma
model FriendQuestReward {
  id              String                  @id @default(cuid())
  friendQuestId   String
  rewardType      FriendQuestRewardType
  amount          Int?                    // Pro XP, money, reputation, skillpoints
  itemId          String?                 // Pro item rewards
  description     String?
  
  friendQuest     FriendQuest             @relation(fields: [friendQuestId], references: [id], onDelete: Cascade)
  item            Item?                   @relation(fields: [itemId], references: [id], onDelete: SetNull)
  
  @@index([friendQuestId])
  @@index([rewardType])
}
```

**Typy odměn:**

```prisma
enum FriendQuestRewardType {
  XP
  MONEY
  ITEM
  REPUTATION
  SKILLPOINTS
}
```

### 3. FriendQuestProgress

Sledování progressu pro dvojici přátel.

```prisma
model FriendQuestProgress {
  id              String              @id @default(cuid())
  friendQuestId   String
  user1Id         String              // První hráč
  user2Id         String              // Druhý hráč
  status          FriendQuestStatus   @default(AVAILABLE)
  
  // Progress tracking
  progress        Int                 @default(0)     // Celkový (průměr)
  user1Progress   Int                 @default(0)     // Progress hráče 1
  user2Progress   Int                 @default(0)     // Progress hráče 2
  
  // Lifecycle
  acceptedAt      DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  expiredAt       DateTime?
  abandonedAt     DateTime?
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  friendQuest     FriendQuest         @relation(fields: [friendQuestId], references: [id], onDelete: Cascade)
  user1           User                @relation("FriendQuestUser1", fields: [user1Id], references: [id], onDelete: Cascade)
  user2           User                @relation("FriendQuestUser2", fields: [user2Id], references: [id], onDelete: Cascade)
  
  @@unique([friendQuestId, user1Id, user2Id])
  @@index([friendQuestId])
  @@index([user1Id])
  @@index([user2Id])
  @@index([status])
}
```

**Statusy:**

```prisma
enum FriendQuestStatus {
  AVAILABLE       // Dostupný k přijetí
  ACCEPTED        // Přijat oběma hráči
  IN_PROGRESS     // Probíhá
  COMPLETED       // Dokončen
  EXPIRED         // Vypršel
  ABANDONED       // Opuštěn
}
```

### 4. FriendQuestCompletion

Historie dokončených questů (pro tracking omezení).

```prisma
model FriendQuestCompletion {
  id                  String      @id @default(cuid())
  friendQuestId       String
  user1Id             String
  user2Id             String
  completedAt         DateTime    @default(now())
  
  // Obdržené odměny
  xpReward            Int         @default(0)
  moneyReward         Int         @default(0)
  reputationReward    Int        @default(0)
  skillpointsReward   Int        @default(0)
  itemsReceived       Json?
  
  friendQuest         FriendQuest @relation(fields: [friendQuestId], references: [id], onDelete: Cascade)
  
  @@index([friendQuestId])
  @@index([user1Id])
  @@index([user2Id])
  @@index([completedAt])
}
```

**Účel:** Sledování historie pro:
- Validaci `maxCompletions`
- Kontrolu `cooldownHours`
- Statistiky a reporting

---

## Backend architektura

### FriendQuestService

Hlavní service pro business logiku Friend Questů.

**Lokace:** `app/lib/services/friend-quest.service.ts`

#### Hlavní metody

##### 1. createFriendQuest

Vytvoří nový Friend Quest (pouze učitel/admin).

```typescript
static async createFriendQuest(
  input: CreateFriendQuestInput, 
  createdBy: string
): Promise<{ success: boolean; friendQuest?: FriendQuest; error?: string }>
```

**Input:**
```typescript
interface CreateFriendQuestInput {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  questType: FriendQuestType;
  maxCompletions?: number | null;
  cooldownHours?: number | null;
  requiredLevel?: number;
  requiredReputation?: number;
  friendshipMinDays?: number;
  expiresAt?: Date | null;
  rewards: {
    rewardType: FriendQuestRewardType;
    amount?: number;
    itemId?: string;
    description?: string;
  }[];
}
```

##### 2. getAvailableQuestsForFriends

Získá dostupné questy pro dvojici přátel s validacemi.

```typescript
static async getAvailableQuestsForFriends(
  user1Id: string, 
  user2Id: string
): Promise<{ success: boolean; quests?: any[]; error?: string }>
```

**Validace:**
1. ✓ Kontrola friendship
2. ✓ Výpočet level obou hráčů
3. ✓ Kontrola reputation
4. ✓ Kontrola friendship age
5. ✓ Validace maxCompletions
6. ✓ Kontrola cooldownu
7. ✓ Filtr expirace

##### 3. acceptFriendQuest

Přijme Friend Quest (vytvoří progress záznam).

```typescript
static async acceptFriendQuest(
  input: AcceptFriendQuestInput
): Promise<{ success: boolean; progress?: any; error?: string }>
```

**Validace:**
- ✓ Friendship exists
- ✓ Quest is active
- ✓ Can complete (omezení)
- ✓ No existing progress

##### 4. updateProgress

Aktualizuje progress jednoho hráče.

```typescript
static async updateProgress(
  input: UpdateProgressInput
): Promise<{ success: boolean; progress?: any; error?: string }>
```

**Logika:**
1. Validace ownership
2. Aktualizace individuálního progressu (0-100)
3. Přepočet celkového progressu (průměr)
4. Změna statusu na IN_PROGRESS
5. **Auto-complete** když oba hráči = 100%

##### 5. completeQuest

Dokončí quest a rozdělí odměny.

```typescript
static async completeQuest(
  progressId: string
): Promise<{ success: boolean; rewards?: any; error?: string }>
```

**Proces:**
1. Validace completion (oba 100%)
2. **Transakce** pro atomické rozdělení odměn:
   - XP → XPAudit + (přidání k XPSource)
   - Money → User.gold + MoneyTx
   - Reputation → Reputation + ReputationLog
   - Skillpoints → SkillPoint.available
   - Items → UserInventory
3. Vytvoření FriendQuestCompletion záznamu
4. Status → COMPLETED

#### Helper metody

##### validateFriendship

```typescript
private static async validateFriendship(
  user1Id: string, 
  user2Id: string
): Promise<Friendship | null>
```

Kontroluje existenci Friendship záznamu (symetricky).

##### canCompleteQuest

```typescript
private static async canCompleteQuest(
  questId: string,
  user1Id: string,
  user2Id: string,
  questType: FriendQuestType,
  maxCompletions: number | null,
  cooldownHours: number | null
): Promise<{
  canComplete: boolean;
  reason?: string;
  completedCount?: number;
  nextAvailableAt?: Date;
}>
```

**Kontroly:**

1. **ONE_TIME**: `completions.length === 0`
2. **LIMITED**: `completions.length < maxCompletions`
3. **DAILY/WEEKLY**: `lastCompletion + cooldown < now`

##### calculateLevel

```typescript
private static calculateLevel(totalXp: number): number
```

Aproximace levelu z XP (1000 XP = 1 level).

##### formatCooldown

```typescript
private static formatCooldown(nextAvailable: Date): string
```

Formátuje zbývající čas cooldownu (např. "5h 30m").

---

## API specifikace

### 1. GET /api/friend-quests

Získání Friend Questů.

**Query Parameters:**
- `mode`: "available" | "active" | "completed"
- `friendId`: string (required pro mode=available)
- `limit`: number (optional, default=20 pro completed)

**Responses:**

**Available quests:**
```typescript
{
  success: true,
  quests: [
    {
      id: "quest_123",
      title: "Týmová výzva",
      description: "...",
      category: "Challenge",
      difficulty: "MEDIUM",
      questType: "DAILY",
      rewards: [...],
      completionInfo: {
        canComplete: true,
        completedCount: 0
      }
    }
  ]
}
```

**Active quests:**
```typescript
{
  success: true,
  progresses: [
    {
      id: "progress_123",
      status: "IN_PROGRESS",
      progress: 75,
      user1Progress: 100,
      user2Progress: 50,
      friendQuest: {...},
      user1: { id, name, avatarUrl },
      user2: { id, name, avatarUrl }
    }
  ]
}
```

### 2. POST /api/friend-quests/accept

Přijme Friend Quest.

**Body:**
```typescript
{
  friendQuestId: string,
  friendId: string
}
```

**Response:**
```typescript
{
  success: true,
  progress: {
    id: "progress_123",
    status: "ACCEPTED",
    friendQuest: {...}
  }
}
```

### 3. PATCH /api/friend-quests/progress/:id

Aktualizuje progress.

**Body:**
```typescript
{
  progressDelta: number // 0-100
}
```

**Response:**
```typescript
{
  success: true,
  progress: {
    id: "progress_123",
    user1Progress: 75,
    user2Progress: 50,
    progress: 62
  }
}
```

### 4. POST /api/friend-quests/complete/:id

Dokončí quest.

**Response:**
```typescript
{
  success: true,
  progress: {...},
  completion: {...},
  rewards: {
    xp: 500,
    money: 100,
    reputation: 20,
    skillpoints: 2,
    items: ["item_123"]
  }
}
```

### 5. POST /api/friend-quests/admin

Vytvoří Friend Quest (pouze teacher/admin).

**Body:** `CreateFriendQuestInput` (viz výše)

**Response:**
```typescript
{
  success: true,
  friendQuest: {...}
}
```

---

## Frontend komponenty

### 1. FriendQuestCard

**Lokace:** `app/components/gamification/friend-quest-card.tsx`

**Props:**
```typescript
interface FriendQuestCardProps {
  quest: FriendQuest;
  progress?: FriendQuestProgress;
  mode: "available" | "active" | "completed";
  currentUserId?: string;
  onAccept?: (questId: string) => void;
  onUpdateProgress?: (progressId: string, delta: number) => void;
  onComplete?: (progressId: string) => void;
}
```

**Features:**
- 🎨 Visual quest card s ikonami
- 📊 Progress bars (celkový + individuální)
- 🎁 Reward display
- ⚡ Action buttons (Accept, Update, Complete)
- 🔒 Disabled states podle validací

**Render modes:**

**Available:**
- Quest info
- Rewards
- Completion info (cooldown, count)
- "Přijmout quest" button

**Active:**
- Quest info
- Team progress (průměr)
- Individual progress bars
- Progress update buttons (+10%, +25%, dokončit)
- "Sbrat odměny" button (když oba 100%)

**Completed:**
- Quest info
- "Dokončeno!" status

### 2. Friend Quests Page

**Lokace:** `app/dashboard/friend-quests/page.tsx`

**Layout:**

```
┌─────────────────────────────────────────────┐
│  🎮 Friend Questy                           │
│  Spolupracujte s přáteli...                │
├─────────────────────────────────────────────┤
│  [Dostupné] [Aktivní (2)] [Dokončené]      │
├─────────────────────────────────────────────┤
│                                             │
│  [Dostupné tab]                            │
│  ┌─────────────┐  ┌───────────────────┐   │
│  │ Friends     │  │ Available Quests  │   │
│  │  Sidebar    │  │                   │   │
│  │             │  │  [Quest Card 1]   │   │
│  │ [Friend 1]  │  │  [Quest Card 2]   │   │
│  │ [Friend 2]  │  │  ...              │   │
│  └─────────────┘  └───────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**State management:**
- `friends`: Seznam přátel
- `selectedFriend`: Vybraný přítel pro available tab
- `availableQuests`, `activeQuests`, `completedQuests`
- Loading states

**Handlers:**
- `loadFriends()`: Načte friend list
- `loadAvailableQuests()`: Načte questy pro dvojici
- `loadActiveQuests()`: Načte aktivní questy
- `loadCompletedQuests()`: Načte historii
- `handleAcceptQuest()`: Přijme quest
- `handleUpdateProgress()`: Aktualizuje progress
- `handleCompleteQuest()`: Dokončí quest

---

## Business logika

### Progress tracking systém

#### Individuální progress

Každý hráč má vlastní progress 0-100%:

```typescript
{
  user1Progress: 75,  // Hráč 1 dokončil 75%
  user2Progress: 50   // Hráč 2 dokončil 50%
}
```

#### Celkový progress

Průměr obou hráčů:

```typescript
progress = Math.floor((user1Progress + user2Progress) / 2)
// (75 + 50) / 2 = 62
```

#### Dokončení

Quest lze dokončit pouze když:

```typescript
if (user1Progress === 100 && user2Progress === 100) {
  // ✅ Lze dokončit
  await completeQuest(progressId);
}
```

### Omezení opakování

#### ONE_TIME

```typescript
if (questType === ONE_TIME && completions.length > 0) {
  return { canComplete: false, reason: "Quest lze splnit pouze jednou" };
}
```

#### LIMITED

```typescript
if (questType === LIMITED && completions.length >= maxCompletions) {
  return { 
    canComplete: false, 
    reason: `Quest lze splnit pouze ${maxCompletions}x` 
  };
}
```

#### DAILY / WEEKLY (cooldown)

```typescript
if (cooldownHours && completions.length > 0) {
  const lastCompletion = completions[0];
  const nextAvailable = new Date(
    lastCompletion.completedAt.getTime() + cooldownHours * 60 * 60 * 1000
  );
  
  if (nextAvailable > new Date()) {
    return { 
      canComplete: false, 
      reason: `Dostupné za ${formatCooldown(nextAvailable)}`,
      nextAvailableAt
    };
  }
}
```

### Reward distribution

Odměny se rozdělí **oběma hráčům** současně v transakci:

```typescript
await prisma.$transaction(async (tx) => {
  // XP pro oba
  await tx.xPAudit.createMany({
    data: [
      { userId: user1Id, amount: xpReward, reason: questTitle },
      { userId: user2Id, amount: xpReward, reason: questTitle }
    ]
  });
  
  // Money pro oba
  await tx.user.update({ where: { id: user1Id }, data: { gold: { increment: moneyReward } } });
  await tx.user.update({ where: { id: user2Id }, data: { gold: { increment: moneyReward } } });
  
  // Reputation pro oba
  // Skillpoints pro oba
  // Items do inventáře pro oba
  
  // Completion record
  await tx.friendQuestCompletion.create({...});
});
```

---

## Integrace s ostatními systémy

### 1. Friends System

**Závisí na:**
- `Friendship` model
- Friend validation

**Integrace:**
```typescript
const friendship = await prisma.friendship.findFirst({
  where: {
    OR: [
      { userId1: user1Id, userId2: user2Id },
      { userId1: user2Id, userId2: user1Id }
    ]
  }
});

if (!friendship) {
  return { error: "Uživatelé nejsou přátelé" };
}

// Kontrola stáří přátelství
const friendshipAgeDays = Math.floor(
  (Date.now() - friendship.createdAt.getTime()) / (1000 * 60 * 60 * 24)
);

if (quest.friendshipMinDays > friendshipAgeDays) {
  return { error: "Přátelství není dostatečně staré" };
}
```

### 2. Reputation System

**Závisí na:**
- `Reputation` model
- `ReputationLog` model

**Integrace:**
```typescript
// Kontrola požadavku
const user1Rep = user1.reputation?.score || 0;
const user2Rep = user2.reputation?.score || 0;

if (quest.requiredReputation > Math.min(user1Rep, user2Rep)) {
  return { error: "Nedostatečná reputace" };
}

// Přidání odměny
await tx.reputation.update({
  where: { userId },
  data: { score: { increment: reputationReward } }
});

await tx.reputationLog.create({
  data: {
    userId,
    amount: reputationReward,
    reason: `Friend Quest: ${questTitle}`,
    type: 'EARN'
  }
});
```

### 3. Economy System

**Závisí na:**
- `User.gold`
- `MoneyTx` model

**Integrace:**
```typescript
// Přidání money
await tx.user.update({
  where: { id: userId },
  data: { gold: { increment: moneyReward } }
});

await tx.moneyTx.create({
  data: {
    userId,
    amount: moneyReward,
    type: 'EARN',
    reason: `Friend Quest: ${questTitle}`
  }
});
```

### 4. XP System

**Závisí na:**
- `XPAudit` model
- `XPSource` model (pro level calculation)

**Integrace:**
```typescript
// Přidání XP
await tx.xPAudit.create({
  data: {
    userId,
    amount: xpReward,
    reason: `Friend Quest: ${questTitle}`
  }
});

// Level calculation
const totalXp = user.enrollments.reduce((sum, e) => 
  sum + e.subject.xpSources.reduce((xpSum, xp) => 
    xpSum + (xp.userId === userId ? xp.amount : 0), 0
  ), 0
);

const level = Math.floor(totalXp / 1000) + 1;
```

### 5. Skill System

**Závisí na:**
- `SkillPoint` model

**Integrace:**
```typescript
const skillPoint = await tx.skillPoint.findUnique({
  where: { userId }
});

if (skillPoint) {
  await tx.skillPoint.update({
    where: { userId },
    data: { available: { increment: skillpointsReward } }
  });
} else {
  await tx.skillPoint.create({
    data: {
      userId,
      available: skillpointsReward,
      spent: 0
    }
  });
}
```

### 6. Inventory System

**Závisí na:**
- `Item` model
- `UserInventory` model

**Integrace:**
```typescript
if (reward.rewardType === ITEM && reward.itemId) {
  await tx.userInventory.createMany({
    data: [
      {
        userId: user1Id,
        itemId: reward.itemId,
        quantity: 1,
        acquiredFrom: `Friend Quest: ${questTitle}`
      },
      {
        userId: user2Id,
        itemId: reward.itemId,
        quantity: 1,
        acquiredFrom: `Friend Quest: ${questTitle}`
      }
    ]
  });
}
```

---

## Testování

### Seeding

```bash
npx tsx ops/seed-friend-quests.ts
```

**Vytvoří:**
- 3x ONE_TIME questy (různé obtížnosti)
- 2x DAILY questy (study, practice)
- 2x WEEKLY questy (challenge, expert)
- 2x LIMITED questy (3x, 5x)

### Manuální testování

#### 1. Vytvoření friendship

```typescript
// Vytvořit dva testovací uživatele
const user1 = await prisma.user.create({...});
const user2 = await prisma.user.create({...});

// Vytvořit friendship
await prisma.friendship.create({
  data: {
    userId1: user1.id,
    userId2: user2.id
  }
});
```

#### 2. Testování dostupných questů

```bash
GET /api/friend-quests?mode=available&friendId={user2Id}
```

Očekáváno: Seznam questů filtrovaných podle:
- ✓ Level
- ✓ Reputation
- ✓ Friendship age
- ✓ Completion limits

#### 3. Testování přijetí questu

```bash
POST /api/friend-quests/accept
{
  "friendQuestId": "quest_123",
  "friendId": "user2_id"
}
```

Očekáváno:
- ✓ Progress záznam vytvořen
- ✓ Status = ACCEPTED
- ✓ Progress = 0

#### 4. Testování update progressu

```bash
PATCH /api/friend-quests/progress/{progressId}
{
  "progressDelta": 50
}
```

Očekáváno:
- ✓ user1Progress = 50
- ✓ progress = 25 (průměr s user2Progress=0)
- ✓ Status = IN_PROGRESS

#### 5. Testování dokončení

```bash
# Update user1 na 100%
PATCH /api/friend-quests/progress/{progressId}
{ "progressDelta": 50 }

# Update user2 na 100%
PATCH /api/friend-quests/progress/{progressId}
{ "progressDelta": 100 }
```

Očekáváno:
- ✓ Auto-complete triggered
- ✓ Odměny přidány oběma
- ✓ Completion record vytvořen
- ✓ Status = COMPLETED

#### 6. Testování omezení

**ONE_TIME:**
```bash
# Pokusit se přijmout znovu
POST /api/friend-quests/accept
```
Očekáváno: `error: "Quest lze splnit pouze jednou"`

**DAILY s cooldownem:**
```bash
# Dokončit quest
POST /api/friend-quests/complete/{progressId}

# Okamžitě zkusit přijmout znovu
POST /api/friend-quests/accept
```
Očekáváno: `error: "Quest bude dostupný za 23h 59m"`

**LIMITED:**
```bash
# Dokončit quest 3x
# Zkusit přijmout 4. krát
POST /api/friend-quests/accept
```
Očekáváno: `error: "Quest lze splnit pouze 3x"`

### Unit testy (příklad)

```typescript
describe('FriendQuestService', () => {
  describe('canCompleteQuest', () => {
    it('should block ONE_TIME quest after completion', async () => {
      // Arrange
      await createCompletion(questId, user1Id, user2Id);
      
      // Act
      const result = await FriendQuestService['canCompleteQuest'](
        questId, user1Id, user2Id, 
        FriendQuestType.ONE_TIME, null, null
      );
      
      // Assert
      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain('pouze jednou');
    });
    
    it('should allow DAILY quest after cooldown', async () => {
      // Arrange
      await createCompletion(questId, user1Id, user2Id, 
        new Date(Date.now() - 25 * 60 * 60 * 1000) // 25h ago
      );
      
      // Act
      const result = await FriendQuestService['canCompleteQuest'](
        questId, user1Id, user2Id,
        FriendQuestType.DAILY, null, 24
      );
      
      // Assert
      expect(result.canComplete).toBe(true);
    });
  });
});
```

---

## Výkonnost a optimalizace

### Indexy

Databázové indexy pro rychlé dotazy:

```prisma
@@index([questType])
@@index([difficulty])
@@index([isActive])
@@index([status])
@@index([user1Id])
@@index([user2Id])
@@index([completedAt])
```

### Caching strategie

**Dostupné questy:**
- Cache na 5 minut (questy se nemění často)
- Invalidace při vytvoření nového questu

**Aktivní questy:**
- Real-time update po akci
- Optimistic UI updates

**Completion checks:**
- Cache completion counts per quest/user pair
- Invalidace při dokončení

### Database transakce

Reward distribution používá transakce pro **atomicitu**:

```typescript
await prisma.$transaction(async (tx) => {
  // Všechny operace musí uspět, nebo se všechny vrátí zpět
  await tx.xPAudit.createMany({...});
  await tx.user.update({...});
  await tx.reputation.update({...});
  await tx.friendQuestCompletion.create({...});
});
```

---

## Bezpečnost

### Autorizace

1. **Quest creation**: Pouze TEACHER/ADMIN role
2. **Accept/Update/Complete**: Musí být účastníkem progressu
3. **View**: Pouze vlastní questy nebo s příteli

### Validace

1. **Friendship**: Vždy kontrolovat před akcemi
2. **Progress ownership**: `userId === user1Id || userId === user2Id`
3. **Completion requirements**: Oba hráči 100%
4. **Quest limits**: maxCompletions, cooldown validace
5. **Input sanitization**: ProgressDelta 0-100

### Rate limiting

API endpointy mají rate limiting:
- Accept: 10 requests/minute
- Update: 20 requests/minute
- Complete: 5 requests/minute

---

## Troubleshooting

### Common Issues

**"Quest nejde přijmout"**

Debug checklist:
```typescript
✓ Friendship exists?
✓ Quest.isActive === true?
✓ Quest not expired?
✓ User meets requiredLevel?
✓ User meets requiredReputation?
✓ Friendship age >= friendshipMinDays?
✓ Not exceeded maxCompletions?
✓ Cooldown passed?
✓ No existing progress?
```

**"Progress se neaktualizuje"**

Debug:
```typescript
✓ Correct progressId?
✓ userId is participant?
✓ Progress not completed?
✓ progressDelta valid (0-100)?
✓ Database connection OK?
```

**"Odměny se nepřidaly"**

Debug:
```typescript
✓ Both users at 100%?
✓ Transaction completed?
✓ Rewards properly defined?
✓ Database constraints OK?
✓ Check logs for errors
```

---

## Changelog

### v1.0.0 (Initial Release)

- ✅ Databázové schema (4 modely)
- ✅ FriendQuestService (všechny metody)
- ✅ API endpointy (5 routes)
- ✅ Frontend komponenty (Card + Page)
- ✅ Seed data (9 questů)
- ✅ Integrace s 6 systémy
- ✅ Dokumentace

---

## Příští kroky

### Plánované features

1. **Notifications**: Upozornění když přítel aktualizuje progress
2. **Quest chat**: In-quest komunikace mezi hráči
3. **Leaderboards**: Top Friend Quest týmy
4. **Achievements**: Speciální achievementy za Friend Questy
5. **Quest templates**: Šablony pro rychlé vytváření questů
6. **Analytics**: Statistiky úspěšnosti questů

### Možná vylepšení

- **3+ player quests**: Týmové questy pro více hráčů
- **Seasonal quests**: Časově omezené speciální questy
- **Dynamic difficulty**: Auto-adjust podle úspěšnosti
- **Quest chains**: Série navazujících questů
- **Bonus objectives**: Volitelné cíle pro extra odměny

---

## Reference

- [Friends System Documentation](FRIENDS_SYSTEM_DOCUMENTATION.md)
- [Quest System Documentation](QUEST_SYSTEM_DOCUMENTATION.md)
- [Economy Documentation](MONEY_ITEMS_TRADING_DOCUMENTATION.md)
- [Reputation System](GAMIFICATION.md)
- [Quick Reference](FRIEND_QUESTS_QUICK_REFERENCE.md)
