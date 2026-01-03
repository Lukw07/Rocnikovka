# 🏪 MARKETPLACE SYSTEM - Dynamický market s cenami jako na burze

## 📋 Přehled systému

Marketplace je decentralizovaný tržiště, kde hráči mohou prodávat a nakupovat itemy. Ceny se dynamicky mění podle **popularity, rarity a poptávky**, podobně jako akcie na burze.

### 🎯 Klíčové vlastnosti

- ✅ **Dynamické ceny** - Ceny se mění podle nabídky a poptávky
- ✅ **Trend tracking** - Sledování trendů (RISING, FALLING, STABLE, VOLATILE)
- ✅ **Popularity score** - Skóre popularity itemů (0-100)
- ✅ **Price history** - Historie cen pro analýzu trendů
- ✅ **Watchlist** - Sledování itemů a notifikace při změně ceny
- ✅ **Market statistics** - Komplexní statistiky trhu
- ✅ **Rarity bonuses** - Bonusy podle rarity itemu
- ✅ **Demand multiplier** - Multiplikátor podle poptávky (0.5 - 2.0)

---

## 🗃️ Databázové modely

### MarketplaceListing
Reprezentuje nabídku itemu na marketu.

```prisma
model MarketplaceListing {
  id               String
  sellerId         String
  itemId           String
  quantity         Int
  pricePerUnit     Int         // Aktuální cena
  originalPrice    Int         // Původní cena
  gemPrice         Int         // Alternativní cena v gems
  demandMultiplier Float       // 0.5 - 2.0
  trendingScore    Int         // 0-100
  views            Int
  favorites        Int
  status           ListingStatus // ACTIVE, SOLD, CANCELLED, EXPIRED
  featured         Boolean
  expiresAt        DateTime?
  soldAt           DateTime?
  buyerId          String?
}
```

### MarketTransaction
Log všech transakcí pro historii a analýzu.

```prisma
model MarketTransaction {
  id           String
  listingId    String
  sellerId     String
  buyerId      String
  itemId       String
  quantity     Int
  pricePerUnit Int
  totalPrice   Int
  demandLevel  Float    // Stav poptávky v čase prodeje
  supplyLevel  Float    // Stav nabídky v čase prodeje
  createdAt    DateTime
}
```

### MarketDemand
Tracking aktuální poptávky a statistik pro každý item.

```prisma
model MarketDemand {
  id                String
  itemId            String   @unique
  totalListings     Int      // Aktuální počet listingů
  totalSales24h     Int      // Prodeje za 24h
  totalSales7d      Int      // Prodeje za 7 dní
  totalViews24h     Int      // Zobrazení za 24h
  watchlistCount    Int      // Kolik má watchlist
  currentAvgPrice   Int      // Průměrná cena
  recommendedPrice  Int      // Doporučená cena
  lowestPrice       Int
  highestPrice      Int
  priceChange24h    Float    // Změna v %
  demandTrend       String   // RISING, FALLING, STABLE, VOLATILE
  popularityScore   Int      // 0-100
  lastUpdated       DateTime
}
```

### ItemPriceHistory
Historie cen pro grafy a analýzy.

```prisma
model ItemPriceHistory {
  id            String
  itemId        String
  averagePrice  Int
  lowestPrice   Int
  highestPrice  Int
  medianPrice   Int
  totalSold     Int
  totalListings Int
  period        String   // "daily", "weekly", "monthly"
  periodStart   DateTime
  periodEnd     DateTime
}
```

---

## ⚙️ Algoritmus dynamických cen

### 1. Základní cena
```
basePrice = item.price (z databáze)
```

### 2. Rarity Multiplier
```typescript
const RARITY_MULTIPLIERS = {
  COMMON: 1.0,
  UNCOMMON: 2.0,
  RARE: 4.0,
  EPIC: 8.0,
  LEGENDARY: 16.0,
};
```

### 3. Demand Multiplier (0.5 - 2.0)
```typescript
let demandMultiplier = 1.0;

// Vysoká poptávka zvyšuje cenu
if (sales24h > 10) demandMultiplier += 0.3;
if (sales24h > 20) demandMultiplier += 0.3;
if (views24h > 50) demandMultiplier += 0.2;
if (watchlistCount > 10) demandMultiplier += 0.2;

// Vysoká nabídka snižuje cenu
if (supply > 20) demandMultiplier -= 0.2;
if (supply > 50) demandMultiplier -= 0.3;

// Omezení na 0.5 - 2.0
demandMultiplier = Math.max(0.5, Math.min(2.0, demandMultiplier));
```

### 4. Finální cena
```
recommendedPrice = basePrice × rarityMultiplier × demandMultiplier
```

### 5. Popularity Score (0-100)
```typescript
popularityScore = Math.min(100, Math.floor(
  (sales24h × 2) + 
  (views24h × 0.5) + 
  (watchlistCount × 3) - 
  (supply × 0.5)
));
```

### 6. Trend Detection
```typescript
if (priceChange24h > 10) → RISING
else if (priceChange24h < -10) → FALLING
else if (abs(priceChange24h) > 5) → VOLATILE
else → STABLE
```

---

## 🔌 API Endpointy

### GET /api/marketplace
Získat všechny listings s filtry.

**Query params:**
- `itemType` - Filtr podle typu
- `rarity` - Filtr podle rarity (COMMON, RARE, EPIC, atd.)
- `minPrice` - Minimální cena
- `maxPrice` - Maximální cena
- `searchQuery` - Vyhledávání v názvu/popisu
- `sortBy` - Řazení: recent, price_asc, price_desc, popularity, trending
- `featured` - Pouze featured listings
- `page` - Číslo stránky
- `limit` - Počet na stránku (default: 20)

**Response:**
```json
{
  "listings": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### POST /api/marketplace
Vytvořit nový listing.

**Body:**
```json
{
  "itemId": "item_123",
  "quantity": 3,
  "pricePerUnit": 1000,  // Optional - použije doporučenou cenu
  "gemPrice": 10,        // Optional
  "title": "Super item", // Optional
  "description": "...",  // Optional
  "expiresInDays": 30    // Optional
}
```

### POST /api/marketplace/[listingId]/buy
Koupit item z listingu.

**Body:**
```json
{
  "quantity": 1
}
```

### GET /api/marketplace/stats
Získat statistiky marketu.

**Response:**
```json
{
  "summary": {
    "totalListings": 150,
    "totalTransactions24h": 45,
    "totalVolume24h": 125000,
    "averageTransactionValue": 2777
  },
  "trending": [...],
  "mostViewed": [...]
}
```

### GET /api/marketplace/items/[itemId]/price-history
Získat cenovou historii itemu.

**Query params:**
- `period` - daily, weekly, monthly (default: daily)
- `limit` - Počet záznamů (default: 30)

**Response:**
```json
{
  "item": {...},
  "currentMarket": {...},
  "history": [...],
  "summary": {
    "averagePrice": 1500,
    "lowestPrice": 1000,
    "highestPrice": 2000,
    "totalSold": 150
  }
}
```

### GET /api/marketplace/items/[itemId]/recommended-price
Získat doporučenou cenu pro item.

**Response:**
```json
{
  "item": {...},
  "pricing": {
    "recommendedPrice": 1500,
    "minRecommended": 1200,
    "maxRecommended": 1800,
    "currentAvgPrice": 1550,
    "lowestListing": 1300,
    "highestListing": 1700
  },
  "market": {
    "demandMultiplier": 1.2,
    "rarityMultiplier": 4.0,
    "popularityScore": 75,
    "trend": "RISING",
    "priceChange24h": 12.5
  },
  "stats": {...},
  "advice": "High demand! You can price above recommended."
}
```

---

## 🎨 Frontend komponenty

### MarketBrowser
Hlavní komponenta pro procházení marketu s filtry a řazením.

**Použití:**
```tsx
import MarketBrowser from '@/app/components/marketplace/MarketBrowser';

<MarketBrowser />
```

**Funkce:**
- ✅ Filtrování podle typu, rarity, ceny
- ✅ Vyhledávání
- ✅ Řazení (recent, price, popularity, trending)
- ✅ Zobrazení demand indicators
- ✅ Paginace

### MarketStats
Dashboard se statistikami a trending items.

**Použití:**
```tsx
import MarketStats from '@/app/components/marketplace/MarketStats';

<MarketStats />
```

**Zobrazuje:**
- ✅ Active listings count
- ✅ Transactions 24h
- ✅ Volume 24h
- ✅ Trending items s popularity score
- ✅ Most viewed items

---

## 🔄 Integrace se systémem

### Kompatibilita s Trading systémem
Market systém je plně kompatibilní s existujícím P2P trading systémem:

- **Sdílený inventory** - Oba systémy používají `UserInventory`
- **Transaction log** - Všechny transakce se logují do `TradingTransaction`
- **Trading reputation** - Market transakce ovlivňují trading reputation
- **Watchlist** - Společný watchlist systém

### Kompatibilita s ekonomikou
- **Gold** - Hlavní měna pro marketplace
- **Gems** - Alternativní premium měna pro rare items
- **MoneyTx** - Všechny transakce se logují
- **TeacherDailyBudget** - Učitelé mohou kontrolovat aktivitu

### Kompatibilita s Inventory
- **UserInventory** - Itemy se automaticky odebírají/přidávají
- **Item locking** - Itemy v listingu jsou "zamčené" dokud se neprodají nebo listing není zrušen
- **Quantity tracking** - Přesné sledování množství

---

## 🚀 Workflow

### Prodej itemu
1. Hráč má item v `UserInventory`
2. Vytvoří `MarketplaceListing`
3. Item se odebere z inventory (locked for sale)
4. Listing se zobrazí na marketu
5. Systém vypočítá doporučenou cenu

### Nákup itemu
1. Kupující vybere listing
2. Systém ověří:
   - Dostatek gold
   - Listing je ACTIVE
   - Není to vlastní listing
3. Provede transakci:
   - Odebere gold kupujícímu
   - Přidá gold prodávajícímu
   - Přidá item do inventory kupujícího
   - Aktualizuje listing (SOLD nebo sníží quantity)
   - Vytvoří `MarketTransaction`
   - Vytvoří `TradingTransaction`
4. Asynchronně aktualizuje `MarketDemand`

### Update market demand (automaticky)
Spouští se po každé transakci:
1. Získá statistiky za 24h a 7d
2. Vypočítá average, min, max ceny
3. Spočítá popularity score
4. Detekuje trend
5. Upsertne `MarketDemand`

### Price history snapshot (cronjob)
Mělo by běžet denně/týdně:
1. Projde všechny itemy s transakcemi
2. Agreguje cenové statistiky
3. Vytvoří `ItemPriceHistory` záznam
4. Používá se pro grafy

---

## 📊 Metriky a monitoring

### Key Performance Indicators (KPIs)
- **Daily Active Listings** - Počet aktivních nabídek
- **Transaction Volume** - Objem transakcí v gold
- **Average Transaction Value** - Průměrná hodnota transakce
- **Popular Items** - Nejvíce obchodované itemy
- **Price Volatility** - Volatilita cen
- **User Engagement** - Views, watchlist additions

### Trending Algorithm
Item je "trending" pokud:
- `popularityScore > 70`
- `sales24h > 5`
- `priceChange24h > 10%` (RISING trend)

---

## 🎮 Gamifikační prvky

### Achievement možnosti
- **Market Mogul** - Prodej 100 itemů
- **Bargain Hunter** - Kup item pod doporučenou cenou
- **Whale Trader** - Proveď transakci nad 10,000 gold
- **Trend Spotter** - Kup item před tím, než je trending
- **Market Expert** - Dosáhni trading reputation 90+

### Motivation features
- **Featured listings** - Zvýraznění pro premium hráče
- **Price alerts** - Notifikace při změně ceny
- **Trading badges** - Odznaky pro aktivní tradery
- **Leaderboards** - Žebříčky top prodejců/kupců

---

## 🛠️ Seed a inicializace

### Spuštění seed
```bash
npx ts-node ops/seed-marketplace.ts
```

**Co vytvoří:**
- ✅ MarketDemand pro všechny tradeable items
- ✅ 15-20 demo marketplace listings
- ✅ Historical transactions
- ✅ Price history snapshots (7 dní)
- ✅ Watchlist entries

---

## ⚡ Performance optimalizace

### Indexy v databázi
```prisma
@@index([itemId])
@@index([status])
@@index([pricePerUnit])
@@index([trendingScore])
@@index([popularityScore])
@@index([demandTrend])
```

### Caching strategie
- Market stats: cache 1 minuta
- Price history: cache 1 hodina
- Recommended price: cache 5 minut
- Listings: real-time (no cache)

### Batch updates
- Market demand: update po každé transakci (async)
- Price history: cronjob denně/týdně
- Trending calculation: každých 15 minut

---

## 🔮 Budoucí rozšíření

### Plánované featury
- [ ] **Auction system** - Aukce s bidding
- [ ] **Bulk operations** - Hromadné nákupy/prodeje
- [ ] **Market notifications** - Push notifikace
- [ ] **Price predictions** - ML predikce budoucích cen
- [ ] **Trading bots** - Automatické obchodování
- [ ] **Market maker** - Systém pro udržení likvidity
- [ ] **Tax system** - Daně z transakcí
- [ ] **Market manipulation detection** - Detekce manipulace s cenami

---

## 📝 Příklady použití

### Vytvoření listingu
```typescript
import * as marketplaceService from '@/app/lib/services/marketplace';

const listing = await marketplaceService.createListing({
  sellerId: userId,
  itemId: 'item_123',
  quantity: 3,
  // pricePerUnit není povinné - použije se doporučená cena
  expiresInDays: 7,
});
```

### Nákup itemu
```typescript
const result = await marketplaceService.buyListing({
  listingId: 'listing_123',
  buyerId: userId,
  quantity: 1,
});
```

### Získání doporučené ceny
```typescript
const pricing = await marketplaceService.calculateDynamicPrice('item_123');

console.log(pricing.recommendedPrice);  // 1500
console.log(pricing.demandMultiplier);  // 1.2
console.log(pricing.trend);             // "RISING"
console.log(pricing.popularityScore);   // 75
```

---

## 🎯 Best Practices

### Pro hráče
- ✅ Sleduj trendy před prodejem
- ✅ Používej watchlist pro sledování cen
- ✅ Prodávej při HIGH DEMAND
- ✅ Kupuj při LOW DEMAND nebo FALLING trend
- ✅ Kontroluj recommended price před prodejem

### Pro vývojáře
- ✅ Vždy async update market demand
- ✅ Používej transactions pro consistency
- ✅ Validuj ownership před prodejem
- ✅ Loguj všechny transakce
- ✅ Cache kde je to možné
- ✅ Monitoruj performance indexů

---

## 📞 Podpora

Pro otázky nebo problémy:
1. Zkontroluj dokumentaci
2. Podívej se do seed skriptu
3. Prohlédni si příklady v kódu
4. Zkontroluj API response v network tabu

---

**Vytvořeno:** 2026-01-03  
**Verze:** 1.0.0  
**Status:** ✅ Production Ready
