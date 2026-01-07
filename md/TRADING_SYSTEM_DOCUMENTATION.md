# 🛒 Trading & Marketplace System - Kompletní Dokumentace

## 📋 Přehled Systému

Trading systém v EduRPG umožňuje studentům:
- **Prodávat** své itemy na veřejném marketplace
- **Kupovat** itemy od ostatních hráčů
- **Obchodovat** P2P (peer-to-peer) přímou výměnou itemů
- **Sledovat** cenové trendy a historii
- **Budovat** trading reputaci

---

## 🗄️ Databázové Modely

### 1. MarketplaceListing
```prisma
model MarketplaceListing {
  id          String          @id @default(cuid())
  sellerId    String
  itemId      String
  quantity    Int             @default(1)
  pricePerUnit Int            // Cena za kus v gold
  gemPrice    Int             @default(0)
  status      ListingStatus   @default(ACTIVE)
  title       String?
  description String?
  views       Int             @default(0)
  createdAt   DateTime        @default(now())
  expiresAt   DateTime?
  updatedAt   DateTime        @updatedAt
  soldAt      DateTime?
  buyerId     String?
}
```

**Účel:** Veřejné nabídky itemů na marketplace

**Statusy:**
- `ACTIVE` - Aktivní nabídka
- `SOLD` - Prodáno
- `CANCELLED` - Zrušeno prodejcem
- `EXPIRED` - Vypršela expirace

### 2. TradingTransaction
```prisma
model TradingTransaction {
  id              String            @id @default(cuid())
  sellerId        String
  buyerId         String
  itemId          String
  quantity        Int               @default(1)
  goldAmount      Int               @default(0)
  gemAmount       Int               @default(0)
  transactionType TransactionType   @default(MARKETPLACE)
  tradeId         String?
  listingId       String?
  createdAt       DateTime          @default(now())
}
```

**Účel:** Kompletní audit log všech obchodních transakcí

**Transaction Types:**
- `MARKETPLACE` - Prodej přes marketplace
- `P2P_TRADE` - Přímý trade mezi hráči
- `SHOP_PURCHASE` - Nákup z oficiálního shopu
- `BLACK_MARKET` - Nákup z black marketu
- `QUEST_REWARD`, `EVENT_REWARD`, `ADMIN_GRANT`

### 3. ItemPriceHistory
```prisma
model ItemPriceHistory {
  id              String   @id @default(cuid())
  itemId          String
  averagePrice    Int
  lowestPrice     Int
  highestPrice    Int
  medianPrice     Int
  totalSold       Int      @default(0)
  totalListings   Int      @default(0)
  period          String   // "daily", "weekly", "monthly"
  periodStart     DateTime
  periodEnd       DateTime
  createdAt       DateTime @default(now())
}
```

**Účel:** Historie cen pro dynamické pricing a trendy

### 4. TradingReputation
```prisma
model TradingReputation {
  id                  String   @id @default(cuid())
  userId              String   @unique
  totalSales          Int      @default(0)
  totalPurchases      Int      @default(0)
  totalGoldEarned     Int      @default(0)
  totalGoldSpent      Int      @default(0)
  trustScore          Int      @default(100) // 0-100
  positiveReviews     Int      @default(0)
  negativeReviews     Int      @default(0)
  isVerifiedTrader    Boolean  @default(false)
  isTrustedSeller     Boolean  @default(false)
  lastTradeAt         DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

**Účel:** Reputační systém pro bezpečnost a důvěru

**Reputation Tiers:**
- `Newcomer` (0-4 prodeje) 🆕
- `Experienced Trader` (5-19 prodejů) ✨
- `Expert Trader` (20-49 prodejů) 💎
- `Master Trader` (50-99 prodejů) ⭐
- `Legendary Merchant` (100+ prodejů) 👑

### 5. ItemWatchlist
```prisma
model ItemWatchlist {
  id         String   @id @default(cuid())
  userId     String
  itemId     String
  maxPrice   Int?     // Notifikuj když cena klesne pod tuto hodnotu
  createdAt  DateTime @default(now())
}
```

**Účel:** Notifikace o cenových změnách sledovaných itemů

---

## 🔌 API Endpointy

### Marketplace Endpoints

#### `GET /api/marketplace`
Získá aktivní marketplace listings

**Query Params:**
```typescript
{
  itemId?: string;         // Filtr podle itemu
  rarity?: ItemRarity;     // Filtr podle rarity
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'date' | 'popular';
  sortOrder?: 'asc' | 'desc';
  limit?: number;          // default: 50
  offset?: number;         // default: 0
}
```

**Response:**
```json
{
  "listings": [
    {
      "id": "...",
      "sellerId": "...",
      "itemId": "...",
      "quantity": 5,
      "pricePerUnit": 100,
      "gemPrice": 10,
      "status": "ACTIVE",
      "views": 25,
      "createdAt": "2026-01-02T...",
      "item": {
        "id": "...",
        "name": "Legendary Sword",
        "description": "...",
        "rarity": "LEGENDARY",
        "type": "COSMETIC",
        "imageUrl": "..."
      }
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### `POST /api/marketplace`
Vytvoří novou marketplace listing

**Body:**
```json
{
  "itemId": "item-123",
  "quantity": 5,
  "pricePerUnit": 100,
  "gemPrice": 10,          // optional
  "title": "Legendární meč - super stav!",    // optional
  "description": "Získán z legendárního questu...",  // optional
  "expiresAt": "2026-01-09T00:00:00Z"  // optional
}
```

**Validace:**
- ✅ Uživatel vlastní item
- ✅ Item je tradeable
- ✅ Dostatečné množství v inventáři
- ✅ Level 5+ requirement
- ✅ Rate limiting (50 listings/den)
- ✅ Price validation (10-500% base price)

**Response:**
```json
{
  "success": true,
  "listing": { /* listing object */ }
}
```

#### `POST /api/marketplace/[listingId]/buy`
Koupí item z marketplace

**Body:**
```json
{
  "quantity": 2,
  "useGems": false  // true = platba gems, false = gold
}
```

**Process:**
1. Validace: listing existuje, je ACTIVE, dostatek prostředků
2. Atomická transakce:
   - Odečtení peněz od kupce
   - Přidání peněz prodejci
   - Převod itemů do inventáře kupce
   - Update listing (SOLD pokud quantity = 0)
   - Vytvoření TradingTransaction
   - MoneyTx logy
   - Update trading reputation
   - Notifikace pro prodejce

**Response:**
```json
{
  "success": true,
  "message": "Successfully purchased 2x Legendary Sword",
  "listing": { /* updated listing */ },
  "totalPaid": 200,
  "currency": "gold"
}
```

#### `DELETE /api/marketplace/[listingId]/cancel`
Zruší vlastní marketplace listing

**Process:**
1. Validace: user je owner, status je ACTIVE
2. Atomická transakce:
   - Update status na CANCELLED
   - Vrátit items do inventáře

#### `GET /api/marketplace/stats`
Získá marketplace statistiky

**Query Params:**
```typescript
{
  period?: 'daily' | 'weekly' | 'monthly'  // default: 'weekly'
}
```

**Response:**
```json
{
  "period": "weekly",
  "stats": {
    "topSelling": [
      {
        "item": { /* item details */ },
        "totalSales": 150,
        "totalGoldVolume": 15000,
        "totalQuantitySold": 200
      }
    ],
    "activeListingsCount": 250,
    "totalTransactions": 1500,
    "totalGoldVolume": 500000,
    "totalGemVolume": 5000,
    "topTraders": [
      {
        "userId": "...",
        "totalSales": 100,
        "totalGoldEarned": 50000,
        "trustScore": 98,
        "isVerifiedTrader": true
      }
    ],
    "recentPriceChanges": [ /* price history entries */ ]
  }
}
```

#### `GET /api/marketplace/price-history/[itemId]`
Získá cenovou historii konkrétního itemu

**Query Params:**
```typescript
{
  period?: 'daily' | 'weekly' | 'monthly'  // default: 'daily'
}
```

**Response:**
```json
{
  "item": {
    "id": "...",
    "name": "Legendary Sword",
    "price": 1000,
    "rarity": "LEGENDARY"
  },
  "priceHistory": [
    {
      "periodStart": "2026-01-01T00:00:00Z",
      "averagePrice": 950,
      "lowestPrice": 800,
      "highestPrice": 1200,
      "totalSold": 50
    }
  ],
  "currentMarket": {
    "activeListings": 15,
    "availableQuantity": 45,
    "avgPrice": 980,
    "lowestPrice": 850,
    "highestPrice": 1100,
    "basePrice": 1000
  },
  "stats": {
    "totalSales": 500
  }
}
```

### Trading Reputation Endpoints

#### `GET /api/trading/reputation`
Získá trading reputaci

**Query Params:**
```typescript
{
  userId?: string;        // konkrétní user, jinak current
  leaderboard?: boolean;  // zobrazit top traders
  limit?: number;         // pro leaderboard, default: 20
}
```

**Response:**
```json
{
  "reputation": {
    "userId": "...",
    "totalSales": 50,
    "totalPurchases": 30,
    "totalGoldEarned": 50000,
    "totalGoldSpent": 20000,
    "trustScore": 95,
    "positiveReviews": 10,
    "negativeReviews": 0,
    "isVerifiedTrader": true,
    "tier": "Master Trader",
    "tierBadge": "⭐",
    "activeListings": 5,
    "lastTradeAt": "2026-01-02T..."
  },
  "recentTransactions": [ /* last 10 transactions */ ]
}
```

### Existing Trade Endpoints

#### `GET /api/trading`
Získá P2P trades (již existující)

#### `POST /api/trading`
Vytvoří P2P trade request (již existující)

#### `POST /api/trading/[tradeId]/accept`
Přijme P2P trade (již existující)

#### `POST /api/trading/[tradeId]/reject`
Odmítne P2P trade (již existující)

---

## ⚙️ Trading Service (Anti-Abuse)

### `TradingService.canUserTrade(userId)`
Kontrola, zda user může obchodovat

**Checks:**
- ✅ Minimální level 5
- ✅ Rate limiting: max 50 listings/den
- ✅ Trust score ≥ 20

### `TradingService.getSuggestedPrice(itemId)`
Doporučená cena na základě market data

**Returns:**
```typescript
{
  suggested: number;      // 95% market avg (quick sale)
  basePrice: number;      // Base item price
  marketAvg: number;      // Current market average
  trend: 'up' | 'down' | 'stable';
}
```

### `TradingService.validatePrice(basePrice, sellingPrice)`
Validace ceny proti extrémům

**Rules:**
- Min: 10% base price
- Max: 500% base price (anti price-gouging)

### `TradingService.detectSuspiciousActivity(userId)`
Detekce podezřelé aktivity

**Flags:**
- > 100 transakcí za 24h
- > 100,000 gold earned za 24h

### `TradingService.calculateFees(price, quantity)`
Výpočet marketplace fees

**Fee Structure:**
- 5% marketplace fee
- Prodejce dostane 95% ceny

```typescript
{
  totalPrice: 1000,
  sellerReceives: 950,
  marketplaceFee: 50
}
```

### `TradingService.updatePriceHistory(itemId, period)`
Aktualizuje cenovou historii (CRON)

**Mělo by se volat:**
- `daily` - každý den v 00:00
- `weekly` - každou neděli
- `monthly` - první den měsíce

### `TradingService.cleanupExpiredListings()`
Čištění expirovaných listings (CRON)

**Process:**
- Najde ACTIVE listings s expiresAt < now
- Update status na EXPIRED
- Vrátí items do inventáře
- Notifikace pro prodejce

---

## 🎨 Frontend Komponenty

### `MarketplaceView`
**Soubor:** `app/components/marketplace/MarketplaceView.tsx`

**Features:**
- 📋 Grid view všech aktivních listings
- 🔍 Search & filtry (rarity, price range)
- 🔄 Sorting (date, price, popular)
- 💰 Nákupní dialog s quantity selectorem
- 💎 Volba gold/gems platby

**Props:** žádné (používá session)

**Použití:**
```tsx
import { MarketplaceView } from '@/app/components/marketplace/MarketplaceView';

<MarketplaceView />
```

### `SellItemDialog` & `MyListingsView`
**Soubor:** `app/components/marketplace/SellItem.tsx`

**Features:**
- 📦 Item selector z inventáře (pouze tradeable)
- 💵 Price suggestion
- ✍️ Custom title & description
- 📊 Moje aktivní nabídky
- ❌ Zrušení nabídky

**Použití:**
```tsx
import { SellItemDialog, MyListingsView } from '@/app/components/marketplace/SellItem';

<SellItemDialog />
<MyListingsView />
```

### `ItemPriceChart`
**Soubor:** `app/components/marketplace/PriceTracking.tsx`

**Features:**
- 📈 Line chart cenového vývoje
- 📊 Current market stats
- 🔥 Trend indicator

**Props:**
```typescript
{
  itemId: string;  // Item ID pro zobrazení
}
```

**Použití:**
```tsx
import { ItemPriceChart } from '@/app/components/marketplace/PriceTracking';

<ItemPriceChart itemId="item-123" />
```

### `MarketplaceStats`
**Soubor:** `app/components/marketplace/PriceTracking.tsx`

**Features:**
- 📊 Overview metrics
- 🔥 Top selling items
- 🏆 Top traders leaderboard
- 📅 Period selector (daily/weekly/monthly)

**Použití:**
```tsx
import { MarketplaceStats } from '@/app/components/marketplace/PriceTracking';

<MarketplaceStats />
```

---

## 🔐 Bezpečnost & Anti-Abuse

### Level Requirement
- **Minimum Level 5** pro trading
- Prevents spam accounts

### Rate Limiting
- **50 listings per day** per user
- Prevents marketplace flooding

### Price Validation
- **Min: 10% base price**
- **Max: 500% base price**
- Prevents extreme pricing

### Trust Score System
- **0-100 score**
- Klesá při negative reviews
- < 20 = trading disabled

### Transaction Logging
- Kompletní audit trail
- Suspicious activity detection
- Admin oversight

### Fees
- **5% marketplace fee**
- Disincentivizes flip trading
- Economy gold sink

---

## 🔗 Integrace s Ostatními Systémy

### 💰 Economy System
**Kompatibilita:** ✅ Plně integrováno

- Používá `User.gold` a `User.gems`
- `MoneyTx` log pro každou transakci
- Wallet balance checks

### ⭐ XP & Level System
**Kompatibilita:** ✅ Level requirement

- Trading unlock na level 5
- Motivuje progression

### 🎯 Skillpoints & Reputation
**Možnost rozšíření:**

```typescript
// Trading skill
{
  name: "Trading",
  category: "Economic",
  description: "Master the marketplace",
  bonuses: [
    "Level 1: -1% marketplace fee",
    "Level 5: Verified Trader badge",
    "Level 10: Featured listings"
  ]
}

// Reputation bonuses
{
  reputationTier: 5,
  benefit: "Trusted sellers get priority in search results"
}
```

### 🏆 Achievements
**Trading Achievements:**

```typescript
const tradingAchievements = [
  {
    key: "FIRST_SALE",
    name: "První prodej",
    description: "Prodej svůj první item na marketplace",
    reward: { xp: 50, gold: 100 }
  },
  {
    key: "MASTER_TRADER",
    name: "Master Trader",
    description: "Proveď 100 úspěšných obchodů",
    reward: { xp: 500, gems: 50, badge: "⭐ Master Trader" }
  },
  {
    key: "GOLD_TYCOON",
    name: "Zlatý magnát",
    description: "Vydělej 100,000 gold z tradingu",
    reward: { xp: 1000, badge: "💰 Tycoon" }
  }
];
```

### 🎯 Questy
**Trading Questy:**

```typescript
{
  title: "Marketplace Debut",
  description: "Prodej 5 itemů na marketplace",
  objectives: [
    { type: "SELL_ITEMS", target: 5 }
  ],
  rewards: {
    xp: 200,
    gold: 500,
    skillpoints: 1
  }
}
```

---

## 🚀 Deployment Checklist

### Database Migration
```bash
npx prisma migrate dev --name add-trading-system
npx prisma generate
```

### Seed Initial Data
```typescript
// seed-trading.ts
- Create sample items
- Set up price history for popular items
- Initialize reputation for existing users
```

### Cron Jobs Setup
```typescript
// Denní cleanup (00:00)
TradingService.cleanupExpiredListings();
TradingService.updatePriceHistory(itemId, 'daily');

// Týdenní stats (neděle 00:00)
TradingService.updatePriceHistory(itemId, 'weekly');

// Měsíční reports (1. den měsíce)
TradingService.updatePriceHistory(itemId, 'monthly');
```

### Monitoring
- Transaction volume alerts
- Suspicious activity logs
- Price anomaly detection
- User reports system

---

## 📝 TODO: Budoucí Rozšíření

### 🔔 Watchlist & Notifications
- Item watchlist s price alerts
- Email/push notifikace
- "Item dostupný" alerts

### ⚖️ Auction System
- Dražby namísto fixed price
- Bidding systém
- Auto-bid bot protection

### 💬 Buyer-Seller Chat
- Vyjednávání o ceně
- Trade negotiation
- Dispute resolution

### 📊 Advanced Analytics
- Personal trading dashboard
- Profit/loss tracking
- ROI calculator
- Market trend predictions

### 🎁 Gift System
- Send items jako dárek
- Gift messages
- Charity donations

### 🏪 Player Shops
- Vlastní "obchod" namísto marketplace
- Customizable shop page
- Shop reputation & reviews

---

## 🎉 Závěr

Trading systém je **kompletně implementován** a připraven k použití. Obsahuje:

✅ Databázové modely  
✅ Backend API endpointy  
✅ Frontend komponenty  
✅ Anti-abuse mechanismy  
✅ Price tracking & statistics  
✅ Reputation systém  
✅ Kompatibilita s existujícími systémy  

**Systém je ready for production!** 🚀
