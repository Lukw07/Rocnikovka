# Guild Systém - Dokumentace

## 📋 Přehled

Guild systém umožňuje hráčům vytvářet a připojovat se ke skupinám (guildám/cechům), společně plnit úkoly a získávat týmové benefity. Systém je plně integrován s existujícími mechanikami: XP, joby, questy, peníze a skillpoints.

## 🏗️ Architektura

### Databázové modely

#### Guild
```prisma
model Guild {
  id            String        @id @default(cuid())
  name          String        @unique
  description   String?
  motto         String?       // Motto guildy
  logoUrl       String?       // Logo guildy
  leaderId      String
  treasury      Int           @default(0) // Skupinové peníze
  level         Int           @default(1) // Úroveň gildy
  xp            Int           @default(0) // Celkové XP gildy
  memberCount   Int           @default(1)
  maxMembers    Int           @default(10) // Maximum členů
  isPublic      Boolean       @default(true) // Veřejná vs. soukromá
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  members       GuildMember[]
  quests        Quest[]       // Guild questy
  activities    GuildActivity[]
  benefits      GuildBenefit[]
  chatMessages  GuildChatMessage[]
}
```

#### GuildMember
```prisma
model GuildMember {
  id                String   @id @default(cuid())
  userId            String
  guildId           String
  role              GuildMemberRole @default(MEMBER)
  contributedXP     Int      @default(0) // XP přispěl do gildy
  contributedMoney  Int      @default(0) // Peníze přispěl do gildy
  joinedAt          DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id])
  guild             Guild    @relation(fields: [guildId], references: [id])
  chatMessages      GuildChatMessage[]
}
```

**Role:**
- `LEADER` - Vůdce guildy (může vše včetně smazání guildy)
- `OFFICER` - Důstojník (může upravovat guildu, spravovat členy)
- `MEMBER` - Běžný člen

#### GuildBenefit
```prisma
model GuildBenefit {
  id              String   @id @default(cuid())
  guildId         String
  name            String
  description     String
  benefitType     String   // "XP_BOOST", "MONEY_BOOST", "QUEST_BONUS", "SHOP_DISCOUNT"
  value           Int      // Procentuální bonus (10 = 10%)
  requiredLevel   Int      @default(1)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}
```

**Typy benefitů:**
- `XP_BOOST` - Bonus XP ze všech zdrojů
- `MONEY_BOOST` - Bonus peněz ze všech zdrojů
- `QUEST_BONUS` - Bonus odměn z questů
- `SHOP_DISCOUNT` - Sleva v obchodě

#### GuildChatMessage
```prisma
model GuildChatMessage {
  id        String   @id @default(cuid())
  guildId   String
  memberId  String   // GuildMember ID
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### GuildActivity
```prisma
model GuildActivity {
  id        String   @id @default(cuid())
  guildId   String
  userId    String
  action    String   // "quest_completed", "member_joined", "treasure_added", atd.
  details   String?
  createdAt DateTime @default(now())
}
```

---

## 🔌 API Endpointy

### Guild Management

#### `GET /api/guilds`
Získat seznam všech guild.

**Response:**
```json
{
  "guilds": [
    {
      "id": "guild_123",
      "name": "Dračí rytíři",
      "description": "Nejlepší guilda na serveru",
      "motto": "Společně jsme silnější",
      "level": 5,
      "xp": 4250,
      "treasury": 1500,
      "memberCount": 8,
      "maxMembers": 10,
      "isPublic": true
    }
  ]
}
```

#### `POST /api/guilds`
Vytvořit novou guildu.

**Request:**
```json
{
  "name": "Dračí rytíři",
  "description": "Guilda pro odvážné dobrodruhy",
  "motto": "Společně jsme silnější",
  "isPublic": true,
  "maxMembers": 10
}
```

**Response:**
```json
{
  "guild": {
    "id": "guild_123",
    "name": "Dračí rytíři",
    "leaderId": "user_456",
    "level": 1,
    "xp": 0,
    "treasury": 0,
    "memberCount": 1
  }
}
```

#### `GET /api/guilds/[id]`
Detail guildy.

#### `PATCH /api/guilds/[id]`
Aktualizovat guildu (pouze leader/officer).

#### `DELETE /api/guilds/[id]`
Smazat guildu (pouze leader).

### Membership

#### `POST /api/guilds/[id]/join`
Připojit se k guildě.

#### `POST /api/guilds/[id]/leave`
Opustit guildu.

#### `GET /api/guilds/[id]/members`
Seznam členů guildy.

### Guild Features

#### `GET /api/guilds/[id]/chat`
Získat chat zprávy guildy.

**Query params:**
- `limit` (optional) - počet zpráv (default: 50)

#### `POST /api/guilds/[id]/chat`
Poslat zprávu do guild chatu.

```json
{
  "content": "Ahoj všichni!"
}
```

#### `GET /api/guilds/[id]/benefits`
Získat aktivní benefity guildy.

#### `POST /api/guilds/[id]/contribute`
Přispět peníze do guild treasury.

```json
{
  "amount": 100
}
```

---

## 🎮 Frontend Komponenty

### `<GuildList />`
Seznam všech guild s filtrováním.

**Props:**
- Žádné

**Features:**
- Zobrazení základních info (level, členů, treasury)
- Quick join button pro veřejné guildy
- Link na detail guildy

### `<CreateGuildForm />`
Formulář pro vytvoření nové guildy.

**Props:**
- Žádné

**Fields:**
- Název guildy (required, min 3 znaky)
- Motto (optional)
- Popis (optional, max 500 znaků)
- Maximální počet členů (5-50)
- Veřejná/soukromá

### `<GuildMembers />`
Seznam členů guildy s jejich příspěvky.

**Props:**
```typescript
{
  guildId: string
  currentUserId?: string
  isLeader?: boolean
}
```

**Features:**
- Zobrazení role člena (ikona)
- Contributed XP a money
- Reputation členů

### `<GuildChat />`
Real-time chat pro guild členy.

**Props:**
```typescript
{
  guildId: string
  currentUserId: string
}
```

**Features:**
- Zobrazení posledních 50 zpráv
- Auto-refresh každých 5 sekund
- Odlišení vlastních zpráv
- Avatar a jméno odesílatele

### `<GuildBenefits />`
Zobrazení aktivních a budoucích benefitů.

**Props:**
```typescript
{
  guildId: string
  guildLevel: number
}
```

**Features:**
- Seznam aktivních bonusů
- Preview nadcházejících benefitů
- Progress bar k dalšímu benefitu

---

## 🔗 Integrace s existujícími systémy

### Quest Systém

Při dokončení **guild questu** (`quest.guildId !== null`):

1. **10% money reward** jde do guild treasury
2. **50% XP reward** jde do guild XP
3. Member contribution tracking
4. Guild level up check (každých 1000 XP = +1 level)
5. Activity log

```typescript
// V quests.ts
if (quest.guildId) {
  // Treasury contribution
  const treasuryContribution = Math.floor(quest.moneyReward * 0.1)
  
  // Guild XP
  const guildXP = Math.floor(quest.xpReward * 0.5)
  
  // Update guild and member
  // Check for level up
  // Log activity
}
```

### Job Systém

Při dokončení **team jobu** (`job.isTeamJob === true`):

1. **5% money reward** jde do guild treasury
2. **25% XP reward** jde do guild XP
3. Member contribution tracking
4. Activity log

```typescript
// V jobs.ts
if (job.isTeamJob && guildMember) {
  const treasuryBonus = Math.floor(moneyPerStudent * 0.05)
  const guildXP = Math.floor(xpPerStudent * 0.25)
  // Update guild...
}
```

### XP & Money Bonusy

Guild benefity poskytují bonusy na všechny zdroje XP a peněz:

```typescript
// Použití v jakémkoliv reward systému
const baseXP = 100
const bonusXP = await GuildService.applyGuildBonus(
  userId, 
  baseXP, 
  "XP_BOOST"
)
// bonusXP = 115 (pokud má +15% bonus)
```

**Helper funkce:**
```typescript
// Vypočítat % bonus
GuildService.calculateGuildBonus(userId, "XP_BOOST")

// Aplikovat bonus na částku
GuildService.applyGuildBonus(userId, amount, "MONEY_BOOST")
```

---

## 📊 Guild Leveling

### Level System
- **1000 XP = 1 level**
- Začíná na level 1
- Žádné maximum

### XP zdroje
1. **Guild questy** - 50% XP z questu
2. **Team joby** - 25% XP z jobu
3. **Přímé contributions** (budoucí feature)

### Benefity podle levelu

| Level | Benefit | Typ | Hodnota |
|-------|---------|-----|---------|
| 1 | XP Boost I | XP_BOOST | +5% |
| 2 | Shop Discount I | SHOP_DISCOUNT | -5% |
| 3 | Quest Bonus I | QUEST_BONUS | +10% |
| 5 | XP Boost II | XP_BOOST | +10% |
| 7 | Money Boost | MONEY_BOOST | +15% |
| 10 | Shop Discount II | SHOP_DISCOUNT | -10% |

**Poznámka:** Bonusy stejného typu se sčítají! (např. level 5 guild má +15% XP boost)

---

## 🎯 User Flow

### Vytvoření guildy
1. Hráč klikne "Vytvořit guildu"
2. Vyplní formulář (název, motto, popis)
3. Stane se LEADER
4. Guilda začíná na level 1
5. Default benefity jsou vytvořeny

### Připojení k guildě
1. Hráč najde guildu v seznamu
2. Klikne "Připojit se" (jen veřejné guildy)
3. Stane se MEMBER
4. Může chatovat a přispívat

### Opuštění guildy
1. Člen klikne "Opustit guildu"
2. Potvrzení
3. Členství je ukončeno
4. **Leader nemůže opustit guildu** - musí ji smazat nebo předat vedení

### Přispění do treasury
1. Člen klikne "Přispět"
2. Zadá částku
3. Peníze jsou odečteny z jeho účtu
4. Přidány do guild treasury
5. Tracked v contributedMoney

---

## 🔒 Oprávnění

| Akce | MEMBER | OFFICER | LEADER |
|------|--------|---------|--------|
| Zobrazit detail | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ |
| Přispět money | ✅ | ✅ | ✅ |
| Opustit guildu | ✅ | ✅ | ❌ |
| Upravit info | ❌ | ✅ | ✅ |
| Pozvat/vyhodit členy | ❌ | ✅ | ✅ |
| Měnit role | ❌ | ❌ | ✅ |
| Smazat guildu | ❌ | ❌ | ✅ |

---

## 🚀 Deployment

### 1. Spustit migraci
```bash
npx prisma migrate dev --name add-guild-system
```

### 2. Vygenerovat Prisma client
```bash
npx prisma generate
```

### 3. (Optional) Seed data
Vytvořit několik testovacích guild:

```typescript
// V seed skriptu
const guild = await prisma.guild.create({
  data: {
    name: "Test Guild",
    leaderId: someUserId,
    treasury: 0,
    level: 1,
    xp: 0,
    memberCount: 1
  }
})

// Přidat leadera jako člena
await prisma.guildMember.create({
  data: {
    userId: someUserId,
    guildId: guild.id,
    role: "LEADER"
  }
})

// Vytvořit default benefity
// (automaticky voláno v GuildService.createGuild)
```

---

## 🧪 Testování

### Manuální test flow

1. **Vytvořit guildu**
   - Přihlásit se jako student
   - Jít na /dashboard/guilds
   - Kliknout "Vytvořit guildu"
   - Vyplnit formulář a odeslat

2. **Připojit druhého hráče**
   - Přihlásit se jako jiný student
   - Jít na /dashboard/guilds
   - Najít guildu
   - Kliknout "Připojit se"

3. **Otestovat chat**
   - V detailu guildy přejít na tab "Chat"
   - Poslat zprávu
   - Ověřit, že se zobrazí

4. **Otestovat quest integraci**
   - Vytvořit guild quest (jako učitel)
   - Přijmout a dokončit quest (jako člen guildy)
   - Ověřit, že guild dostala XP a treasury

5. **Otestovat benefity**
   - Přidat manuálně XP do guildy (přes databázi nebo API)
   - Překročit 1000 XP
   - Ověřit level up
   - Zkontrolovat aktivní benefity v UI

---

## 📈 Budoucí rozšíření

### Plánované funkce:
- [ ] Guild wars (PvP mezi guildami)
- [ ] Guild challenges (týdenní výzvy)
- [ ] Guild shop (speciální předměty)
- [ ] Guild hall customization
- [ ] Guild rankings/leaderboard
- [ ] Private invitations (pro soukromé guildy)
- [ ] Officer specific permissions
- [ ] Guild alliance system
- [ ] Guild reputation system
- [ ] Member activity tracking

---

## 🐛 Známé problémy & řešení

### Problem: Chat se nerefreshuje
**Řešení:** Implementovat WebSocket místo pollingu

### Problem: Guild level nedostává XP
**Řešení:** Zkontrolovat, že quest má `guildId` nastaveno

### Problem: Benefity se neaplikují
**Řešení:** Zkontrolovat, že `requiredLevel <= guild.level` a `isActive = true`

---

## 📝 Poznámky pro vývojáře

### Service struktura
```
GuildService
├── CRUD operace (create, update, delete)
├── Membership (join, leave, changeMemberRole)
├── Chat (getChatMessages, sendChatMessage)
├── Benefits (getGuildBenefits, calculateGuildBonus)
├── Treasury (contributeMoney, addGuildXP)
└── Helpers (createDefaultBenefits, applyGuildBonus)
```

### Typické use-case pattern
```typescript
// 1. Najít guild member
const member = await prisma.guildMember.findFirst({
  where: { userId, guildId }
})

// 2. Aplikovat guild bonus
const bonusAmount = await GuildService.applyGuildBonus(
  userId,
  baseAmount,
  "XP_BOOST"
)

// 3. Update guild XP a check level up
await GuildService.addGuildXP(guildId, userId, xpAmount, "quest")
```

### Import paths
```typescript
import { GuildService } from "@/app/lib/services/guilds"
import { GuildMemberRole } from "@/app/lib/generated"
```

---

## ✅ Checklist kompletnosti

- [x] Databázové schéma (Guild, GuildMember, GuildBenefit, GuildActivity, GuildChatMessage)
- [x] API endpointy (CRUD, membership, chat, benefits, contribute)
- [x] Service layer (GuildService s všemi metodami)
- [x] Frontend komponenty (GuildList, CreateGuildForm, GuildMembers, GuildChat, GuildBenefits)
- [x] Dashboard stránky (/guilds, /guilds/create, /guilds/[id])
- [x] Integrace s Quest systémem
- [x] Integrace s Job systémem
- [x] Guild bonusy (XP_BOOST, MONEY_BOOST, etc.)
- [x] Guild leveling (1000 XP = 1 level)
- [x] Member contributions tracking
- [x] Chat systém (polling)
- [x] Permission system (LEADER, OFFICER, MEMBER)

---

**Status:** ✅ **KOMPLETNĚ IMPLEMENTOVÁNO**

Systém je plně funkční a připravený k použití. Všechny core funkce jsou implementovány a integrovány s existujícími systémy (jobs, quests, XP, money, skillpoints).
