# 🚀 Quick Reference - Money, Items, Trading & Blackmarket

## Rychlý Start

### 1. Databáze Setup
```bash
# Spustit migraci
npx prisma migrate dev --name add_economy_systems

# Generovat client
npx prisma generate

# Seed data (volitelné)
npx tsx prisma/seed-economy.ts
```

### 2. Import komponent
```tsx
// Wallet
import { WalletCard, TransactionHistory } from '@/app/components/wallet';

// Inventory
import { InventoryGrid } from '@/app/components/inventory';

// Random Finds
import { RandomFindTrigger } from '@/app/components/random-finds';

// Blackmarket
import { BlackMarketShop } from '@/app/components/blackmarket';

// Helper
import { grantRewards, grantJobRewards } from '@/app/lib/rewards';
```

### 3. Základní použití

#### Zobrazit peněženku
```tsx
<WalletCard />
```

#### Zobrazit inventář
```tsx
<InventoryGrid />
```

#### Přidat Random Finds (floating button)
```tsx
// Do layout.tsx nebo main dashboard
<RandomFindTrigger />
```

#### Blackmarket stránka
```tsx
// app/dashboard/blackmarket/page.tsx
export default function BlackMarketPage() {
  return <BlackMarketShop />;
}
```

---

## API Endpoints - Cheat Sheet

### Wallet
```typescript
// Get balance
GET /api/wallet/balance

// Transfer money
POST /api/wallet/transfer
Body: { recipientId, amount, currency, reason }

// Transaction history
GET /api/wallet/transactions?limit=50&type=EARNED
```

### Inventory
```typescript
// Get inventory
GET /api/inventory?type=COSMETIC&equipped=true

// Use item
POST /api/inventory/use
Body: { inventoryId }

// Equip/unequip
POST /api/inventory/equip
Body: { inventoryId, equip: true }
```

### Trading
```typescript
// Get trades
GET /api/trading?status=PENDING&type=received

// Create trade
POST /api/trading
Body: { recipientId, offeredItems[], requestedItems[], message }

// Accept trade
POST /api/trading/[tradeId]/accept

// Reject trade
POST /api/trading/[tradeId]/reject
```

### Blackmarket
```typescript
// Get offers
GET /api/blackmarket?featured=true

// Purchase item
POST /api/blackmarket/purchase
Body: { offerId, currency: 'gold' | 'gems' }
```

### Random Finds
```typescript
// Check cooldown
GET /api/random-finds/check

// Trigger find
POST /api/random-finds/trigger
```

---

## Reward Helper - Rychlé příklady

### Udělit komplexní odměny
```typescript
import { grantRewards } from '@/app/lib/rewards';

await grantRewards({
  userId: user.id,
  gold: 150,
  gems: 5,
  xp: 300,
  skillpoints: 2,
  reputation: 25,
  itemId: 'special-sword',
  itemQuantity: 1,
  reason: 'Epic quest completed',
  sourceType: 'quest',
  sourceId: questId,
});
```

### Job rewards
```typescript
import { grantJobRewards } from '@/app/lib/rewards';

// Automaticky vezme rewards z Job modelu
await grantJobRewards(userId, jobId);
```

### Quest rewards
```typescript
import { grantQuestRewards } from '@/app/lib/rewards';

await grantQuestRewards(userId, questId);
```

### Achievement rewards
```typescript
import { grantAchievementRewards } from '@/app/lib/rewards';

await grantAchievementRewards(userId, achievementId);
```

### Guild rewards
```typescript
import { grantGuildRewards } from '@/app/lib/rewards';

// Přispívá i do guild treasury
await grantGuildRewards(userId, guildId, 'quest_completed');
```

### Streak rewards
```typescript
import { grantStreakReward } from '@/app/lib/rewards';

await grantStreakReward(userId, streakDays);
```

---

## Databázové modely - Quick Reference

### User additions
```typescript
gold: number      // Základní měna
gems: number      // Premium měna
```

### UserInventory
```typescript
{
  userId: string
  itemId: string
  quantity: number
  isEquipped: boolean
  usedAt?: Date
  expiresAt?: Date
}
```

### Item extensions
```typescript
{
  isTradeable: boolean
  effects?: {
    xpBoost?: number
    goldBonus?: number
    duration?: number
  }
  category?: string  // avatar, frame, background
}
```

### Trade
```typescript
{
  requesterId: string
  recipientId: string
  status: TradeStatus
  tradeItems: TradeItem[]
}
```

### TradeItem
```typescript
{
  tradeId: string
  itemId: string
  quantity: number
  isOffered: boolean  // true = offer, false = request
}
```

### BlackMarketOffer
```typescript
{
  name: string
  price: number
  gemPrice: number
  rarity: ItemRarity
  stock: number
  soldCount: number
  discount: number
  availableFrom: Date
  availableTo: Date
  isFeatured: boolean
}
```

### RandomFindCooldown
```typescript
{
  userId: string
  lastFindAt: Date
  nextAvailableAt: Date
  findsToday: number
  dailyLimit: number  // default: 5
}
```

---

## Enum Values

### ItemRarity
```typescript
COMMON      // ⚪ 50%
UNCOMMON    // 🟢 25%
RARE        // 🔵 15%
EPIC        // 🟣 7%
LEGENDARY   // 🟡 3%
```

### ItemType
```typescript
COSMETIC     // Vizuální, equipovatelné
BOOST        // Dočasné bonusy
COLLECTIBLE  // Sběratelské
```

### TradeStatus
```typescript
PENDING      // Čeká na reakci
ACCEPTED     // Přijato (processing)
REJECTED     // Odmítnuto
COMPLETED    // Dokončeno
CANCELLED    // Zrušeno
```

### MoneyTxType
```typescript
EARNED   // Získáno
SPENT    // Utraceno
REFUND   // Vráceno
```

---

## Běžné use-casy

### Přidat gold po dokončení aktivity
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { gold: { increment: 100 } }
});

await prisma.moneyTx.create({
  data: {
    userId,
    amount: 100,
    type: 'EARNED',
    reason: 'Activity completed'
  }
});
```

### Přidat item do inventáře
```typescript
await prisma.userInventory.upsert({
  where: {
    userId_itemId: { userId, itemId }
  },
  create: {
    userId,
    itemId,
    quantity: 1
  },
  update: {
    quantity: { increment: 1 }
  }
});
```

### Zkontrolovat, zda má uživatel dostatek gold
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { gold: true }
});

if (user.gold < requiredAmount) {
  throw new Error('Insufficient funds');
}
```

### Vytvořit Blackmarket offer (admin)
```typescript
const now = new Date();
const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

await prisma.blackMarketOffer.create({
  data: {
    name: "Legendary Dragon Skin",
    description: "Vzácný dračí skin",
    price: 5000,
    gemPrice: 250,
    rarity: "LEGENDARY",
    stock: 100,
    availableFrom: now,
    availableTo: weekLater,
    isActive: true,
    isFeatured: true,
    discount: 15
  }
});
```

---

## UI/UX Tips

### Rarity Colors
```typescript
const rarityColors = {
  COMMON: 'bg-gray-100 text-gray-700',
  UNCOMMON: 'bg-green-100 text-green-700',
  RARE: 'bg-blue-100 text-blue-700',
  EPIC: 'bg-purple-100 text-purple-700',
  LEGENDARY: 'bg-yellow-100 text-yellow-700',
};
```

### Currency Icons
```tsx
💰 Gold
💎 Gems
```

### Type Icons
```tsx
<Sparkles />  // COSMETIC
<Zap />       // BOOST
<Star />      // COLLECTIBLE
```

### Status Badges
```tsx
{trade.status === 'PENDING' && <Badge variant="outline">Čeká</Badge>}
{trade.status === 'COMPLETED' && <Badge variant="default">Hotovo</Badge>}
{trade.status === 'REJECTED' && <Badge variant="destructive">Odmítnuto</Badge>}
```

---

## Testing Commands

```bash
# Test balance endpoint
curl http://localhost:3000/api/wallet/balance

# Test inventory
curl http://localhost:3000/api/inventory

# Test random find trigger
curl -X POST http://localhost:3000/api/random-finds/trigger

# Test blackmarket
curl http://localhost:3000/api/blackmarket
```

---

## Common Patterns

### Transaction with notification
```typescript
await prisma.$transaction(async (tx) => {
  // Perform action
  await tx.user.update({
    where: { id: userId },
    data: { gold: { increment: 100 } }
  });

  // Create notification
  await tx.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: '💰 Obdržel jsi peníze!',
      message: 'Získal jsi 100 gold',
      data: { amount: 100 }
    }
  });
});
```

### Item with expiration
```typescript
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

await prisma.userInventory.create({
  data: {
    userId,
    itemId,
    quantity: 1,
    expiresAt
  }
});
```

### Progressive pricing
```typescript
const basePrice = 100;
const discount = 20; // %
const finalPrice = Math.floor(basePrice * (1 - discount / 100));
// finalPrice = 80
```

---

## Debug Checklist

- [ ] Prisma migrace proběhla
- [ ] Prisma client je vygenerovaný
- [ ] User má gold a gems fields
- [ ] API endpointy vrací 200
- [ ] Komponenty se renderují
- [ ] Notifikace fungují
- [ ] Transakce jsou atomické
- [ ] Cooldowny se respektují

---

## Production Checklist

- [ ] Rate limiting nastaveno
- [ ] Redis cache pro blackmarket
- [ ] Indexes zkontrolovány
- [ ] Security audit proveden
- [ ] Error handling všude
- [ ] Logging nastaven
- [ ] Monitoring připojen
- [ ] Backup strategy definována

---

**Happy coding! 🚀**
