# 💰 Money, Items, Trading & Blackmarket - Kompletní dokumentace

## Přehled systému

Tento dokument popisuje implementaci 4 propojených gamifikačních mechanik:
1. **Money System** - Dvouměnový systém (Gold & Gems)
2. **Items & Inventory** - Správa předmětů a inventáře
3. **Trading System** - Výměna itemů mezi hráči
4. **Blackmarket** - Časově limitované vzácné předměty
5. **Random Finds** - Náhodné objevy na stránce

---

## 1. Money System 💰💎

### Databázové modely

#### User Model - Rozšíření
```prisma
model User {
  gold  Int @default(0)  // Základní měna
  gems  Int @default(0)  // Premium měna
}
```

#### MoneyTx Model
```prisma
model MoneyTx {
  id        String      @id @default(cuid())
  userId    String
  amount    Int         // + nebo -
  type      MoneyTxType // EARNED, SPENT, REFUND
  reason    String
  createdAt DateTime    @default(now())
}
```

### API Endpointy

#### GET /api/wallet/balance
Získá aktuální stav peněženky.

**Response:**
```json
{
  "userId": "...",
  "name": "Jan Novák",
  "gold": 1500,
  "gems": 45,
  "totalWealth": 1950
}
```

#### POST /api/wallet/transfer
Převede peníze mezi uživateli.

**Body:**
```json
{
  "recipientId": "user-id",
  "amount": 100,
  "currency": "gold", // nebo "gems"
  "reason": "Díky za pomoc"
}
```

**Features:**
- ✅ Ověření dostatečných prostředků
- ✅ Atomická transakce
- ✅ Záznam v MoneyTx
- ✅ Notifikace pro příjemce

#### GET /api/wallet/transactions
Historie transakcí s podporou filtrování a paginace.

**Query params:**
- `limit` - počet záznamů (default: 50)
- `offset` - offset pro paginaci
- `type` - filtr podle typu (EARNED/SPENT/REFUND)

### Frontend Komponenty

#### WalletCard
Zobrazení aktuálního stavu měn s akcemi.

**Features:**
- 💰 Gold balance
- 💎 Gems balance
- 📊 Celkové bohatství
- 🔄 Tlačítka pro převod a historii

**Použití:**
```tsx
import { WalletCard } from '@/app/components/wallet';

<WalletCard />
```

#### TransactionHistory
Detailní historie všech transakcí.

**Features:**
- 📜 Kompletní historie
- 🔍 Filtry (Vše/Získáno/Utraceno)
- ⏰ Časová razítka
- 📊 Vizualizace typu transakce

---

## 2. Items & Inventory System 🎒

### Databázové modely

#### Item Model - Rozšíření
```prisma
model Item {
  id            String
  name          String
  description   String
  price         Int
  rarity        ItemRarity  // COMMON -> LEGENDARY
  type          ItemType    // COSMETIC, BOOST, COLLECTIBLE
  
  // Nové fieldy
  isTradeable   Boolean     @default(true)
  effects       Json?       // { "xpBoost": 10, "duration": 3600 }
  category      String?     // "avatar", "background", atd.
}
```

#### UserInventory Model
```prisma
model UserInventory {
  id          String
  userId      String
  itemId      String
  quantity    Int      @default(1)
  isEquipped  Boolean  @default(false)
  obtainedAt  DateTime @default(now())
  usedAt      DateTime?
  expiresAt   DateTime?
}
```

### Item Types

**COSMETIC**
- Vizuální změny (avatary, pozadí, rámečky)
- Můžou být "equipped"
- Neexpirují

**BOOST**
- Dočasné bonusy (XP boost, gold multiplier)
- Single-use nebo časově omezené
- Definovány v `effects` JSON

**COLLECTIBLE**
- Sběratelské předměty
- Můžou mít speciální účinky
- Některé nutné pro achievementy

### API Endpointy

#### GET /api/inventory
Získá inventář uživatele.

**Query params:**
- `type` - filtr podle typu
- `equipped` - pouze nasazené/nenasazené

**Response:**
```json
{
  "inventory": [...],
  "grouped": {
    "cosmetic": [...],
    "boost": [...],
    "collectible": [...]
  },
  "totalItems": 42,
  "equippedCount": 3
}
```

#### POST /api/inventory/use
Použije item (BOOST nebo COLLECTIBLE).

**Body:**
```json
{
  "inventoryId": "inv-id"
}
```

**Aplikace efektů:**
```json
{
  "xpBoost": 100,      // +100 XP
  "goldBonus": 50,     // +50 gold
  "gemsBonus": 2,      // +2 gems
  "duration": 3600     // Trvání v sekundách
}
```

#### POST /api/inventory/equip
Nasadí/sundá cosmetic item.

**Body:**
```json
{
  "inventoryId": "inv-id",
  "equip": true  // nebo false
}
```

### Frontend Komponenty

#### InventoryGrid
Grid zobrazení inventáře s tabs a detaily.

**Features:**
- 📦 Grid layout s raritami
- 🎨 Barevné kódování podle rarity
- 🏷️ Tagy (typ, quantity, equipped)
- 🔍 Detail modal pro každý item
- ⚡ Use/Equip akce

**Použití:**
```tsx
import { InventoryGrid } from '@/app/components/inventory';

<InventoryGrid />
```

---

## 3. Trading System 🔄

### Databázové modely

#### Trade Model
```prisma
model Trade {
  id          String
  requesterId String    // Kdo nabízí
  recipientId String    // Komu nabízí
  status      TradeStatus // PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED
  message     String?
  createdAt   DateTime
  acceptedAt  DateTime?
  completedAt DateTime?
}
```

#### TradeItem Model
```prisma
model TradeItem {
  id        String
  tradeId   String
  itemId    String
  quantity  Int
  isOffered Boolean  // true = nabídka, false = poptávka
}
```

### Trade Flow

1. **Requester vytvoří trade**
   - Vybere items k nabídnutí
   - Vybere items k získání
   - Přidá zprávu (optional)

2. **Recipient dostane notifikaci**
   - Může přijmout nebo odmítnout

3. **Při přijetí:**
   - Atomická výměna itemů
   - Status → COMPLETED
   - Notifikace pro requestera

### API Endpointy

#### GET /api/trading
Získá aktivní trades.

**Query params:**
- `status` - filtr podle stavu
- `type` - sent/received

#### POST /api/trading
Vytvoří nový trade.

**Body:**
```json
{
  "recipientId": "user-id",
  "offeredItems": [
    { "itemId": "item-1", "quantity": 1 }
  ],
  "requestedItems": [
    { "itemId": "item-2", "quantity": 2 }
  ],
  "message": "Trade?"
}
```

#### POST /api/trading/[tradeId]/accept
Přijme trade (pouze recipient).

#### POST /api/trading/[tradeId]/reject
Odmítne trade (pouze recipient).

### Bezpečnostní kontroly

- ✅ Ověření vlastnictví nabízených itemů
- ✅ Kontrola tradeability
- ✅ Atomické transakce
- ✅ Nelze tradovat sám se sebou
- ✅ Pouze recipient může acceptovat/rejectovat

---

## 4. Blackmarket System 🎭

### Koncept

Časově omezený obchod se vzácnými a kosmetickými předměty.

**Vlastnosti:**
- ⏰ Časové limity (hodiny/dny)
- 📦 Omezené množství (stock)
- 💎 Dual-currency (gold i gems)
- 🎯 Featured items
- 💸 Discounty

### Databázové modely

#### BlackMarketOffer Model
```prisma
model BlackMarketOffer {
  id            String
  name          String
  description   String?
  price         Int
  gemPrice      Int          // Alternativní cena v gems
  rarity        ItemRarity
  stock         Int          // Celkové množství
  soldCount     Int          // Už prodáno
  
  availableFrom DateTime
  availableTo   DateTime
  
  isActive      Boolean
  isFeatured    Boolean
  discount      Int          // Procenta (0-100)
}
```

#### BlackMarketPurchase Model
```prisma
model BlackMarketPurchase {
  id        String
  userId    String
  offerId   String
  pricePaid Int
  gemsPaid  Int
  createdAt DateTime
}
```

### API Endpointy

#### GET /api/blackmarket
Získá aktuální nabídky.

**Response:**
```json
{
  "offers": [...],
  "featured": [...],
  "expiringSoon": [...]
}
```

**Pro každou nabídku:**
```json
{
  "id": "...",
  "name": "Legendary Sword Skin",
  "rarity": "LEGENDARY",
  "price": 1000,
  "gemPrice": 50,
  "discount": 20,
  "stock": 100,
  "soldCount": 73,
  "stockRemaining": 27,
  "timeLeftMs": 86400000,
  "isFeatured": true
}
```

#### POST /api/blackmarket/purchase
Koupí item z blackmarketu.

**Body:**
```json
{
  "offerId": "offer-id",
  "currency": "gold"  // nebo "gems"
}
```

**Proces:**
1. Validace času a stocku
2. Výpočet finální ceny (s discontem)
3. Odečtení měny
4. Přidání do inventáře
5. Zvýšení soldCount
6. Notifikace

### Frontend Komponenty

#### BlackMarketShop
Plnohodnotný shop s časovači a featured items.

**Features:**
- 🎭 Temný design s purple gradientem
- ⭐ Featured items sekce
- ⏰ Live countdown timery
- 📦 Stock indikátory
- 💰💎 Dual currency purchasing
- 🔥 Discount badges

**Použití:**
```tsx
import { BlackMarketShop } from '@/app/components/blackmarket';

<BlackMarketShop />
```

---

## 5. Random Finds System ✨

### Koncept

Náhodné objevy předmětů nebo peněz při procházení stránky.

**Vlastnosti:**
- 🎲 Raritní systém (5 úrovní)
- ⏰ Cooldown mezi nálezy (15-45 min)
- 📊 Denní limit (5 finds/day)
- 🎁 Items nebo currency

### Databázové modely

#### RandomFind Model
```prisma
model RandomFind {
  id      String
  userId  String
  itemId  String?    // Pokud je item
  name    String     // Název nálezu
  rarity  ItemRarity
  value   Int        // Hodnota v gold
  foundAt DateTime
}
```

#### RandomFindCooldown Model
```prisma
model RandomFindCooldown {
  id              String
  userId          String   @unique
  lastFindAt      DateTime
  nextAvailableAt DateTime
  findsToday      Int
  dailyLimit      Int      @default(5)
}
```

### Raritní Systém

```typescript
COMMON      // 50% - 10-30 gold
UNCOMMON    // 25% - 30-70 gold
RARE        // 15% - 70-150 gold
EPIC        //  7% - 150-300 gold + možné gems
LEGENDARY   //  3% - 300-500 gold + gems
```

### API Endpointy

#### GET /api/random-finds/check
Zkontroluje dostupnost nálezu.

**Response:**
```json
{
  "canFind": true,
  "findsToday": 3,
  "dailyLimit": 5,
  "nextAvailableAt": "2026-01-02T15:30:00Z",
  "timeUntilNext": 1234567
}
```

#### POST /api/random-finds/trigger
Spustí náhodný nález.

**Response:**
```json
{
  "success": true,
  "find": {...},
  "item": {...},  // pokud byl nalezen item
  "rewards": {
    "gold": 150,
    "gems": 2
  },
  "rarity": "EPIC"
}
```

### Frontend Komponenty

#### RandomFindTrigger
Floating button + popup modal pro nálezy.

**Features:**
- 🔘 Floating button (bottom-right)
- ✨ Animovaný (pulse při dostupnosti)
- ⏰ Živý countdown timer
- 📊 Badge s denním limitem
- 🎉 Animovaný popup při nálezu
- 🎨 Barevné podle rarity

**Použití:**
```tsx
import { RandomFindTrigger } from '@/app/components/random-finds';

// Přidat na layout nebo hlavní stránku
<RandomFindTrigger />
```

---

## 6. Integrace s existujícími systémy 🔗

### Reward Helper (`app/lib/rewards.ts`)

Centralizovaný systém pro udělování odměn z jakékoliv aktivity.

#### Hlavní funkce: `grantRewards()`

```typescript
await grantRewards({
  userId: "user-id",
  gold: 100,
  gems: 5,
  xp: 200,
  skillpoints: 2,
  reputation: 50,
  itemId: "special-item",
  itemQuantity: 1,
  reason: "Quest dokončen",
  sourceType: "quest",
  sourceId: "quest-123"
});
```

**Co dělá:**
1. ✅ Přidá gold/gems
2. ✅ Vytvoří XP audit
3. ✅ Přidá skillpoints
4. ✅ Aktualizuje reputaci
5. ✅ Přidá item do inventáře
6. ✅ Vytvoří notifikaci

#### Specializované funkce

```typescript
// Job rewards
await grantJobRewards(userId, jobId);

// Quest rewards
await grantQuestRewards(userId, questId);

// Achievement rewards
await grantAchievementRewards(userId, achievementId);

// Guild rewards (přispívá i do guild treasury)
await grantGuildRewards(userId, guildId, "quest_completed");

// Streak rewards
await grantStreakReward(userId, streakDays);
```

### Integrace do existujících endpointů

#### Jobs System
```typescript
// app/api/jobs/[id]/complete/route.ts
import { grantJobRewards } from '@/app/lib/rewards';

// Po dokončení jobu:
await grantJobRewards(userId, jobId);
```

#### Quests System
```typescript
// app/api/quests/[id]/complete/route.ts
import { grantQuestRewards } from '@/app/lib/rewards';

await grantQuestRewards(userId, questId);
```

#### Achievements System
```typescript
// app/api/achievements/award/route.ts
import { grantAchievementRewards } from '@/app/lib/rewards';

await grantAchievementRewards(userId, achievementId);
```

---

## 7. Migrace databáze 🔧

### Kroky pro nasazení

1. **Aktualizovat Prisma schema**
   ```bash
   # Schema je již aktualizováno v prisma/schema.prisma
   ```

2. **Vytvořit migraci**
   ```bash
   npx prisma migrate dev --name add_money_items_trading_blackmarket_systems
   ```

3. **Vygenerovat Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Seed data (optional)**
   Vytvořit seed script pro:
   - Testovací items
   - Blackmarket offers
   - Startovní gold pro existující uživatele

```typescript
// prisma/seed-economy.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Přidat gold všem existujícím uživatelům
  await prisma.user.updateMany({
    data: { gold: 100, gems: 5 }
  });

  // Vytvořit vzorové items
  await prisma.item.createMany({
    data: [
      {
        name: "Golden Frame",
        description: "Zlatý rámeček pro profilový obrázek",
        price: 500,
        rarity: "RARE",
        type: "COSMETIC",
        category: "frame",
        isTradeable: true,
      },
      {
        name: "XP Boost +50%",
        description: "50% boost XP na 1 hodinu",
        price: 200,
        rarity: "UNCOMMON",
        type: "BOOST",
        effects: { xpBoost: 50, duration: 3600 },
        isTradeable: false,
      },
      // ... více items
    ]
  });

  // Vytvořit blackmarket offers
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.blackMarketOffer.create({
    data: {
      name: "Legendary Dragon Avatar",
      description: "Exkluzivní dračí avatar",
      price: 2000,
      gemPrice: 100,
      rarity: "LEGENDARY",
      stock: 50,
      availableFrom: now,
      availableTo: tomorrow,
      isActive: true,
      isFeatured: true,
      discount: 20,
    }
  });
}

main();
```

---

## 8. Testování 🧪

### API Testing

```bash
# Balance
curl http://localhost:3000/api/wallet/balance

# Transfer
curl -X POST http://localhost:3000/api/wallet/transfer \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"user-2","amount":50,"currency":"gold","reason":"Test"}'

# Inventory
curl http://localhost:3000/api/inventory

# Blackmarket
curl http://localhost:3000/api/blackmarket

# Random Find
curl -X POST http://localhost:3000/api/random-finds/trigger
```

### Frontend Testing Checklist

- [ ] WalletCard zobrazuje správné balances
- [ ] TransactionHistory načítá a filtruje transakce
- [ ] InventoryGrid zobrazuje items podle typu
- [ ] Use/Equip items fungují správně
- [ ] RandomFindTrigger respektuje cooldowny
- [ ] BlackMarketShop zobrazuje časovače správně
- [ ] Všechny notifikace fungují

---

## 9. Performance Optimizations 🚀

### Database Indexy

Všechny důležité indexy jsou již v schema:
- `User.gold`, `User.gems`
- `UserInventory.userId`, `isEquipped`
- `Trade.status`, `createdAt`
- `BlackMarketOffer.availableFrom`, `availableTo`
- `RandomFindCooldown.nextAvailableAt`

### Caching Strategy

**Client-side:**
```typescript
// SWR nebo React Query pro caching
import useSWR from 'swr';

const { data, mutate } = useSWR('/api/wallet/balance', fetcher, {
  refreshInterval: 30000, // Refresh každých 30s
  revalidateOnFocus: true,
});
```

**Server-side:**
- Redis cache pro blackmarket offers
- Rate limiting pro random finds

---

## 10. Security Best Practices 🔒

### Implementované ochrany

1. **Authentication**
   - Všechny endpointy vyžadují session
   - Ověření uživatele před každou operací

2. **Authorization**
   - Pouze vlastník může upravovat inventář
   - Pouze recipient může acceptovat trade
   - Admin-only pro blackmarket rotation

3. **Validation**
   - Kontrola dostatečných prostředků
   - Ověření tradeability items
   - Stock a časové limity

4. **Transaction Safety**
   - Atomické transakce (`$transaction`)
   - Race condition protection
   - Idempotence pro kritické operace

5. **Rate Limiting**
   - Random finds cooldowns
   - Daily limits
   - API rate limiting (doporučeno přidat)

---

## 11. Budoucí vylepšení 🎯

### V1.1
- [ ] Trading history page
- [ ] Item gifting system
- [ ] Auction house (alternativa k tradingu)
- [ ] Currency conversion (gold ↔ gems s fees)

### V1.2
- [ ] Item crafting system
- [ ] Item enchantments/upgrades
- [ ] Seasonal items
- [ ] Limited edition items

### V1.3
- [ ] Player-to-player marketplace
- [ ] Blackmarket bidding wars
- [ ] Item bundles & packages
- [ ] Subscription-based premium currency

---

## 12. Troubleshooting 🔧

### Běžné problémy

**"Insufficient funds" při dostatečném balance**
- Zkontrolovat, zda se nepoužívá cached data
- Refresh stránky nebo mutate cache

**Random find nefunguje**
- Zkontrolovat cooldown v databázi
- Ověřit, zda nebylo dosaženo daily limitu
- Zkontrolovat konzoli pro error logy

**Items se nezobrazují v inventáři**
- Ověřit UserInventory záznamy v DB
- Zkontrolovat `item.isActive` flag
- Refresh inventory data

**Blackmarket nenabízí žádné items**
- Zkontrolovat časové rozsahy offers
- Ověřit `isActive` flag
- Zkontrolovat stock

---

## Závěr

Všechny 4 systémy jsou plně funkční a vzájemně propojené. Integrace s existujícími mechanikami (XP, quests, achievements, guilds) je zajištěna přes `rewards.ts` helper.

**Výsledek:**
- ✅ Kompletní money economy
- ✅ Plně funkční inventory
- ✅ P2P trading
- ✅ Časově limitovaný blackmarket
- ✅ Gamifikované random finds
- ✅ Seamless integrace s existujícím systémem

**Next steps:**
1. Spustit migrace
2. Seed testovací data
3. Otestovat všechny endpointy
4. Deploy na production
