# Guild System - Quick Reference

## 🚀 Rychlý start

### Pro hráče

**Vytvoření guildy:**
```
1. Jděte na /dashboard/guilds
2. Klikněte "Vytvořit guildu"
3. Vyplňte název a další info
4. Stáváte se LEADER
```

**Připojení k guildě:**
```
1. Jděte na /dashboard/guilds
2. Najděte veřejnou guildu
3. Klikněte "Připojit se"
```

### Pro vývojáře

**Import service:**
```typescript
import { GuildService } from "@/app/lib/services/guilds"
```

**Vytvořit guildu:**
```typescript
const guild = await GuildService.createGuild({
  name: "Dračí rytíři",
  description: "Nejlepší guilda",
  motto: "Společně jsme silnější",
  leaderId: userId
})
```

**Aplikovat guild bonus:**
```typescript
const bonusXP = await GuildService.applyGuildBonus(
  userId,
  100, // base XP
  "XP_BOOST"
)
// Returns: 115 (if +15% bonus)
```

---

## 📡 API Endpointy

### Guild Management
| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/guilds` | Seznam všech guild |
| POST | `/api/guilds` | Vytvořit guildu |
| GET | `/api/guilds/[id]` | Detail guildy |
| PATCH | `/api/guilds/[id]` | Upravit guildu |
| DELETE | `/api/guilds/[id]` | Smazat guildu |

### Membership
| Metoda | Endpoint | Popis |
|--------|----------|-------|
| POST | `/api/guilds/[id]/join` | Připojit se |
| POST | `/api/guilds/[id]/leave` | Opustit |
| GET | `/api/guilds/[id]/members` | Seznam členů |

### Features
| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/guilds/[id]/chat` | Chat zprávy |
| POST | `/api/guilds/[id]/chat` | Poslat zprávu |
| GET | `/api/guilds/[id]/benefits` | Benefity |
| POST | `/api/guilds/[id]/contribute` | Přispět peníze |

---

## 🎮 Komponenty

### `<GuildList />`
```tsx
import { GuildList } from "@/app/components/guilds/guild-list"

<GuildList />
```

### `<CreateGuildForm />`
```tsx
import { CreateGuildForm } from "@/app/components/guilds/create-guild-form"

<CreateGuildForm />
```

### `<GuildMembers />`
```tsx
import { GuildMembers } from "@/app/components/guilds/guild-members"

<GuildMembers 
  guildId="guild_123" 
  currentUserId={session.user.id}
  isLeader={true}
/>
```

### `<GuildChat />`
```tsx
import { GuildChat } from "@/app/components/guilds/guild-chat"

<GuildChat 
  guildId="guild_123"
  currentUserId={session.user.id}
/>
```

### `<GuildBenefits />`
```tsx
import { GuildBenefits } from "@/app/components/guilds/guild-benefits"

<GuildBenefits 
  guildId="guild_123"
  guildLevel={5}
/>
```

---

## 🔗 Integrace

### Quest systém
```typescript
// Quest completion automaticky přidává guild XP a treasury
// Pokud quest.guildId !== null:
// - 10% money reward → guild treasury
// - 50% XP reward → guild XP
// - Member contribution tracking
// - Activity log
```

### Job systém
```typescript
// Team job completion automaticky přidává guild bonusy
// Pokud job.isTeamJob === true:
// - 5% money reward → guild treasury  
// - 25% XP reward → guild XP
// - Member contribution tracking
// - Activity log
```

### XP bonusy
```typescript
// V jakémkoliv reward systému:
import { GuildService } from "@/app/lib/services/guilds"

const baseXP = 100
const withBonus = await GuildService.applyGuildBonus(
  userId,
  baseXP,
  "XP_BOOST"
)
```

---

## 🏆 Guild Leveling

```
XP → Level conversion:
- 0-999 XP = Level 1
- 1000-1999 XP = Level 2
- 2000-2999 XP = Level 3
...

Formula: level = Math.floor(xp / 1000) + 1
```

**XP zdroje:**
- Guild questy: 50% XP z questu
- Team joby: 25% XP z jobu
- Direct contributions: 100% (budoucí)

---

## 💎 Benefity

| Level | Název | Typ | Bonus |
|-------|-------|-----|-------|
| 1 | XP Boost I | XP_BOOST | +5% |
| 2 | Shop Discount I | SHOP_DISCOUNT | -5% |
| 3 | Quest Bonus I | QUEST_BONUS | +10% |
| 5 | XP Boost II | XP_BOOST | +10% |
| 7 | Money Boost | MONEY_BOOST | +15% |
| 10 | Shop Discount II | SHOP_DISCOUNT | -10% |

**Poznámka:** Stejné typy se sčítají! (Level 5 = +15% XP boost)

---

## 🔒 Role & Oprávnění

| Role | Ikon | Oprávnění |
|------|------|-----------|
| LEADER | 👑 | Vše (včetně smazání guildy) |
| OFFICER | 🛡️ | Úpravy guildy, správa členů |
| MEMBER | 👤 | Chat, contribute, basic access |

**Matice oprávnění:**

| Akce | MEMBER | OFFICER | LEADER |
|------|:------:|:-------:|:------:|
| Zobrazit detail | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ |
| Contribute | ✅ | ✅ | ✅ |
| Leave | ✅ | ✅ | ❌ |
| Edit info | ❌ | ✅ | ✅ |
| Manage members | ❌ | ✅ | ✅ |
| Change roles | ❌ | ❌ | ✅ |
| Delete guild | ❌ | ❌ | ✅ |

---

## 🛠️ Service Methods

### CRUD
```typescript
GuildService.createGuild(data, requestId?)
GuildService.getAllGuilds()
GuildService.getGuildDetails(guildId)
GuildService.updateGuild(guildId, data, userId)
GuildService.deleteGuild(guildId, userId)
```

### Membership
```typescript
GuildService.joinGuild(guildId, userId, requestId?)
GuildService.leaveGuild(guildId, userId, requestId?)
GuildService.getGuildMembers(guildId)
GuildService.changeMemberRole(guildId, targetUserId, newRole, actorId)
```

### Features
```typescript
GuildService.getChatMessages(guildId, limit?)
GuildService.sendChatMessage(guildId, userId, content)
GuildService.getGuildBenefits(guildId)
GuildService.contributeMoney(guildId, userId, amount)
GuildService.addGuildXP(guildId, userId, xpAmount, source)
```

### Bonuses
```typescript
GuildService.calculateGuildBonus(userId, bonusType)
GuildService.applyGuildBonus(userId, baseAmount, bonusType)
```

---

## 📊 Databázové query příklady

### Získat guildu s členy
```typescript
const guild = await prisma.guild.findUnique({
  where: { id: guildId },
  include: {
    members: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    }
  }
})
```

### Najít guildu uživatele
```typescript
const member = await prisma.guildMember.findFirst({
  where: { userId },
  include: {
    guild: true
  }
})
```

### Top contributors
```typescript
const topContributors = await prisma.guildMember.findMany({
  where: { guildId },
  orderBy: { contributedXP: 'desc' },
  take: 10,
  include: { user: true }
})
```

---

## 🐛 Debugging

### Problem: Guild nedostává XP
```typescript
// Check 1: Je quest guild quest?
const quest = await prisma.quest.findUnique({
  where: { id: questId },
  select: { guildId: true }
})
console.log("Guild ID:", quest?.guildId)

// Check 2: Je hráč členem?
const member = await prisma.guildMember.findFirst({
  where: { userId, guildId: quest.guildId }
})
console.log("Member:", member)
```

### Problem: Benefity se neaplikují
```typescript
// Check level vs required level
const guild = await prisma.guild.findUnique({
  where: { id: guildId },
  select: { level: true }
})

const benefits = await prisma.guildBenefit.findMany({
  where: {
    guildId,
    requiredLevel: { lte: guild.level },
    isActive: true
  }
})
console.log("Active benefits:", benefits)
```

### Problem: Chat se nezobrazuje
```typescript
// Check member access
const member = await prisma.guildMember.findFirst({
  where: { userId, guildId }
})
if (!member) {
  console.error("User is not a guild member")
}
```

---

## 📝 Typické patterny

### Pattern 1: Check membership
```typescript
async function checkMembership(userId: string, guildId: string) {
  const member = await prisma.guildMember.findUnique({
    where: {
      userId_guildId: { userId, guildId }
    }
  })
  return !!member
}
```

### Pattern 2: Apply guild bonuses
```typescript
async function awardReward(userId: string, baseXP: number, baseMoney: number) {
  const xp = await GuildService.applyGuildBonus(userId, baseXP, "XP_BOOST")
  const money = await GuildService.applyGuildBonus(userId, baseMoney, "MONEY_BOOST")
  
  // Award to user...
}
```

### Pattern 3: Guild activity logging
```typescript
async function logActivity(guildId: string, userId: string, action: string) {
  await prisma.guildActivity.create({
    data: {
      guildId,
      userId,
      action,
      details: `User completed ${action}`
    }
  })
}
```

---

## ✅ Testing checklist

- [ ] Vytvořit guildu
- [ ] Připojit se k guildě
- [ ] Poslat chat zprávu
- [ ] Přispět peníze do treasury
- [ ] Dokončit guild quest (kontrola XP + treasury)
- [ ] Dokončit team job (kontrola XP + treasury)
- [ ] Ověřit guild level up
- [ ] Ověřit aktivaci benefitů
- [ ] Opustit guildu
- [ ] Změnit roli člena (jako leader)
- [ ] Upravit info guildy (jako officer)
- [ ] Smazat guildu (jako leader)

---

## 📦 File struktura

```
app/
├── api/guilds/
│   ├── route.ts                    # GET, POST /api/guilds
│   └── [id]/
│       ├── route.ts                # GET, PATCH, DELETE
│       ├── join/route.ts           # POST
│       ├── leave/route.ts          # POST
│       ├── members/route.ts        # GET
│       ├── chat/route.ts           # GET, POST
│       ├── benefits/route.ts       # GET
│       └── contribute/route.ts     # POST
├── components/guilds/
│   ├── guild-list.tsx
│   ├── create-guild-form.tsx
│   ├── guild-members.tsx
│   ├── guild-chat.tsx
│   └── guild-benefits.tsx
├── dashboard/guilds/
│   ├── page.tsx                    # /dashboard/guilds
│   ├── create/page.tsx             # /dashboard/guilds/create
│   └── [id]/page.tsx               # /dashboard/guilds/[id]
└── lib/
    └── services/
        └── guilds.ts               # GuildService

prisma/
└── schema.prisma                   # Guild models
```

---

**Rychlá reference připravena!** ✅

Pro detailní dokumentaci viz: `GUILD_SYSTEM_DOCUMENTATION.md`
