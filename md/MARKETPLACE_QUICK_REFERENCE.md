# 🏪 MARKETPLACE QUICK REFERENCE

## 🎯 Co je Marketplace?
Decentralizované tržiště kde hráči prodávají a kupují itemy. **Ceny se mění jako na burze** podle popularity a poptávky.

---

## ⚡ Rychlý start

### 1. Migrace databáze
```bash
npx prisma migrate dev
npx prisma generate
```

### 2. Seed data
```bash
npx ts-node ops/seed-marketplace.ts
```

### 3. Přidat do aplikace
```tsx
// V dashboard nebo samostatné stránce
import MarketBrowser from '@/app/components/marketplace/MarketBrowser';
import MarketStats from '@/app/components/marketplace/MarketStats';

<MarketStats />
<MarketBrowser />
```

---

## 🔥 Key Features

| Feature | Popis |
|---------|-------|
| **Dynamic Pricing** | Ceny 0.5x - 2.0x základní ceny podle poptávky |
| **Trend Detection** | RISING, FALLING, STABLE, VOLATILE |
| **Popularity Score** | 0-100 podle views, sales, watchlist |
| **Price History** | Grafy cenového vývoje |
| **Rarity Multipliers** | COMMON (1x) → LEGENDARY (16x) |
| **Watchlist** | Sledování itemů a alertů |

---

## 📊 Cenový algoritmus

```
Finální cena = BasePrice × RarityMultiplier × DemandMultiplier

RarityMultiplier:
  COMMON: 1x, UNCOMMON: 2x, RARE: 4x, EPIC: 8x, LEGENDARY: 16x

DemandMultiplier (0.5 - 2.0):
  + Vysoké sales24h → +0.3 - +0.6
  + Vysoké views → +0.2
  + Vysoké watchlist → +0.2
  - Vysoká nabídka → -0.2 - -0.5
```

---

## 🔌 API Endpoints

### Základní operace
```typescript
// Získat listings
GET /api/marketplace?rarity=RARE&sortBy=trending&page=1

// Vytvořit listing
POST /api/marketplace
{ itemId, quantity, pricePerUnit? }

// Koupit item
POST /api/marketplace/[listingId]/buy
{ quantity }

// Zrušit vlastní listing
DELETE /api/marketplace/[listingId]
```

### Cenové informace
```typescript
// Doporučená cena
GET /api/marketplace/items/[itemId]/recommended-price

// Cenová historie
GET /api/marketplace/items/[itemId]/price-history?period=daily

// Market stats
GET /api/marketplace/stats
```

---

## 🎨 Komponenty

### MarketBrowser
```tsx
<MarketBrowser />
```
- Filtrování (rarity, type, price)
- Vyhledávání
- Řazení (recent, price, popularity, trending)
- Zobrazení demand indicators
- Paginace

### MarketStats
```tsx
<MarketStats />
```
- Active listings count
- Transactions & volume 24h
- Top trending items
- Most viewed items

---

## 💾 Databázové modely

### MarketplaceListing
```prisma
{
  pricePerUnit     Int    // Aktuální cena
  originalPrice    Int    // Původní cena
  demandMultiplier Float  // 0.5 - 2.0
  trendingScore    Int    // 0-100
  status           ACTIVE | SOLD | CANCELLED | EXPIRED
}
```

### MarketDemand
```prisma
{
  totalListings    Int    // Supply
  totalSales24h    Int    // Demand
  popularityScore  Int    // 0-100
  demandTrend      RISING | FALLING | STABLE | VOLATILE
  priceChange24h   Float  // % změna
}
```

---

## 🎮 User Workflow

### Prodej
1. Má item v inventory
2. Vytvoří listing → item se "zamkne"
3. Systém doporučí cenu
4. Listing je viditelný na marketu

### Nákup
1. Najde listing na marketu
2. Klikne "Buy" → ověří gold
3. Transakce: gold se přesune, item do inventory
4. Market demand se aktualizuje

---

## 🏆 Indicators

### Demand Indicators
- **🔥 HIGH DEMAND** - demandMultiplier > 1.2
- **💰 GOOD DEAL** - demandMultiplier < 0.8
- **⭐ TRENDING** - popularityScore > 70
- **📈 RISING** - priceChange24h > 10%
- **📉 FALLING** - priceChange24h < -10%

---

## 🔄 Integrace

### ✅ Kompatibilní se systémy:
- **Trading System** - Sdílený inventory a reputation
- **Economy** - Gold/Gems transakce
- **UserInventory** - Automatické add/remove itemů
- **Achievements** - Možnost achievementů za trading
- **Notifications** - Alerting při změně ceny

---

## ⚙️ Konfigurace

### Environment (.env)
```bash
DATABASE_URL="postgresql://..."
```

### Cronjobs (doporučené)
```bash
# Price history snapshot - denně v 00:00
0 0 * * * npx ts-node ops/price-history-snapshot.ts

# Market demand refresh - každých 15 min
*/15 * * * * curl http://localhost:3000/api/marketplace/refresh-demand
```

---

## 📈 Monitoring

### Key Metrics
- Active listings
- Transactions 24h/7d
- Average transaction value
- Top trending items
- Price volatility

### Dashboards
```
/marketplace/stats → Market overview
/marketplace → Browse listings
/marketplace/[id] → Listing detail
```

---

## 🐛 Troubleshooting

### Problem: Listing není viditelný
- ✅ Check `status = ACTIVE`
- ✅ Check `expiresAt > now`
- ✅ Check item `isActive = true` a `isTradeable = true`

### Problem: Nákup selhává
- ✅ Check buyer má dostatek gold
- ✅ Check listing quantity > 0
- ✅ Check buyer ≠ seller

### Problem: Ceny se nemění
- ✅ Run seed pro vytvoření MarketDemand
- ✅ Check transactions existují
- ✅ Trigger manual demand update

---

## 🎯 Best Practices

### Pro vývojáře
- ✅ Async update market demand
- ✅ Use transactions pro consistency
- ✅ Validuj ownership
- ✅ Log všechny transakce
- ✅ Cache kde možné

### Pro hráče
- ✅ Sleduj trending před prodejem
- ✅ Používej watchlist
- ✅ Prodávej při HIGH DEMAND
- ✅ Kupuj při LOW DEMAND

---

## 📚 Dokumentace

**Full docs:** `MARKETPLACE_SYSTEM_DOCUMENTATION.md`  
**API:** `/api/marketplace/*`  
**Components:** `app/components/marketplace/`  
**Service:** `app/lib/services/marketplace.ts`  
**Seed:** `ops/seed-marketplace.ts`

---

## 🚀 Release Checklist

- [x] Databázové modely
- [x] API endpointy
- [x] Dynamic pricing algorithm
- [x] Frontend komponenty
- [x] Seed script
- [x] Dokumentace
- [x] Integrace s trading/economy
- [ ] E2E testy
- [ ] Performance testing
- [ ] Security audit

**Status:** ✅ Production Ready (pending tests)
