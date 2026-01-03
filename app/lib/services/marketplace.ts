/**
 * Marketplace Service - Dynamický market systém s cenou podle popularity
 * Podobný stock marketu - ceny se mění podle supply, demand a popularity
 */

import { prisma } from '@/app/lib/db';
import { ItemRarity, ListingStatus } from '@/app/lib/generated';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreateListingParams {
  sellerId: string;
  itemId: string;
  quantity: number;
  pricePerUnit?: number; // Pokud není zadáno, použije doporučenou cenu
  gemPrice?: number;
  title?: string;
  description?: string;
  expiresInDays?: number;
}

export interface BuyListingParams {
  listingId: string;
  buyerId: string;
  quantity: number;
}

export interface MarketFilters {
  itemType?: string;
  rarity?: ItemRarity;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'popularity' | 'recent' | 'trending';
  featured?: boolean;
}

export interface MarketStats {
  totalListings: number;
  totalTransactions24h: number;
  totalVolume24h: number;
  trendingItems: Array<{
    itemId: string;
    itemName: string;
    priceChange: number;
    popularityScore: number;
  }>;
}

// ============================================================================
// PRICING ALGORITHM - Dynamic Market Pricing
// ============================================================================

/**
 * Výpočet doporučené ceny podle rarity itemu
 */
const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  COMMON: 1.0,
  UNCOMMON: 2.0,
  RARE: 4.0,
  EPIC: 8.0,
  LEGENDARY: 16.0,
};

/**
 * Výpočet dynamické ceny na základě poptávky a nabídky
 * Funguje jako stock market - vysoká poptávka = vyšší cena, vysoká nabídka = nižší cena
 */
export async function calculateDynamicPrice(itemId: string): Promise<{
  recommendedPrice: number;
  demandMultiplier: number;
  trend: string;
  popularityScore: number;
}> {
  // Získat item a jeho základní cenu
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { price: true, rarity: true, name: true },
  });

  if (!item) {
    throw new Error('Item not found');
  }

  // Získat market demand data
  let demand = await prisma.marketDemand.findUnique({
    where: { itemId },
  });

  // Pokud demand neexistuje, vytvořit
  if (!demand) {
    demand = await createMarketDemand(itemId);
  }

  const basePrice = item.price;
  const rarityMultiplier = RARITY_MULTIPLIERS[item.rarity] || 1.0;

  // Supply & Demand calculation
  const supply = demand.totalListings;
  const sales24h = demand.totalSales24h;
  const views24h = demand.totalViews24h;
  const watchlistCount = demand.watchlistCount;

  // Výpočet demand multiplier (0.5 - 2.0)
  let demandMultiplier = 1.0;

  // Vysoká poptávka = vyšší cena
  if (sales24h > 10) demandMultiplier += 0.3;
  if (sales24h > 20) demandMultiplier += 0.3;
  if (views24h > 50) demandMultiplier += 0.2;
  if (watchlistCount > 10) demandMultiplier += 0.2;

  // Vysoká nabídka = nižší cena
  if (supply > 20) demandMultiplier -= 0.2;
  if (supply > 50) demandMultiplier -= 0.3;

  // Omezení multiplier na rozumné meze
  demandMultiplier = Math.max(0.5, Math.min(2.0, demandMultiplier));

  // Popularity score (0-100)
  const popularityScore = Math.min(
    100,
    Math.floor(
      (sales24h * 2) + 
      (views24h * 0.5) + 
      (watchlistCount * 3) - 
      (supply * 0.5)
    )
  );

  // Trend detection
  let trend = 'STABLE';
  if (demand.priceChange24h > 10) trend = 'RISING';
  else if (demand.priceChange24h < -10) trend = 'FALLING';
  else if (Math.abs(demand.priceChange24h) > 5) trend = 'VOLATILE';

  // Finální cena
  const recommendedPrice = Math.floor(
    basePrice * rarityMultiplier * demandMultiplier
  );

  return {
    recommendedPrice,
    demandMultiplier,
    trend,
    popularityScore,
  };
}

/**
 * Vytvoření nebo aktualizace market demand pro item
 */
async function createMarketDemand(itemId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { price: true },
  });

  return await prisma.marketDemand.create({
    data: {
      itemId,
      recommendedPrice: item?.price || 0,
      currentAvgPrice: item?.price || 0,
      lowestPrice: item?.price || 0,
      highestPrice: item?.price || 0,
    },
  });
}

/**
 * Aktualizace market demand po transakci
 */
async function updateMarketDemand(itemId: string): Promise<void> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Získat statistiky
  const [activeListings, transactions24h, transactions7d] = await Promise.all([
    prisma.marketplaceListing.count({
      where: { itemId, status: 'ACTIVE' },
    }),
    prisma.marketTransaction.count({
      where: { itemId, createdAt: { gte: last24h } },
    }),
    prisma.marketTransaction.count({
      where: { itemId, createdAt: { gte: last7d } },
    }),
  ]);

  // Získat cenové statistiky
  const priceStats = await prisma.marketTransaction.aggregate({
    where: { itemId, createdAt: { gte: last24h } },
    _avg: { pricePerUnit: true },
    _min: { pricePerUnit: true },
    _max: { pricePerUnit: true },
  });

  // Watchlist count
  const watchlistCount = await prisma.itemWatchlist.count({
    where: { itemId },
  });

  // Views za 24h (z aktivních listingů)
  const viewsSum = await prisma.marketplaceListing.aggregate({
    where: { itemId, status: 'ACTIVE' },
    _sum: { views: true },
  });

  // Získat předchozí průměrnou cenu pro výpočet trendu
  const currentDemand = await prisma.marketDemand.findUnique({
    where: { itemId },
  });

  const oldAvgPrice = currentDemand?.currentAvgPrice || 0;
  const newAvgPrice = priceStats._avg.pricePerUnit || 0;
  const priceChange24h = oldAvgPrice > 0 
    ? ((newAvgPrice - oldAvgPrice) / oldAvgPrice) * 100 
    : 0;

  // Vypočítat trend
  let demandTrend = 'STABLE';
  if (priceChange24h > 15) demandTrend = 'RISING';
  else if (priceChange24h < -15) demandTrend = 'FALLING';
  else if (Math.abs(priceChange24h) > 8) demandTrend = 'VOLATILE';

  // Popularity score
  const popularityScore = Math.min(
    100,
    Math.floor(
      (transactions24h * 5) +
      (viewsSum._sum.views || 0) * 0.1 +
      (watchlistCount * 3) -
      (activeListings * 0.5)
    )
  );

  // Upsert market demand
  await prisma.marketDemand.upsert({
    where: { itemId },
    create: {
      itemId,
      totalListings: activeListings,
      totalSales24h: transactions24h,
      totalSales7d: transactions7d,
      totalViews24h: viewsSum._sum.views || 0,
      watchlistCount,
      currentAvgPrice: newAvgPrice,
      lowestPrice: priceStats._min.pricePerUnit || 0,
      highestPrice: priceStats._max.pricePerUnit || 0,
      priceChange24h,
      demandTrend,
      popularityScore,
      lastUpdated: now,
    },
    update: {
      totalListings: activeListings,
      totalSales24h: transactions24h,
      totalSales7d: transactions7d,
      totalViews24h: viewsSum._sum.views || 0,
      watchlistCount,
      currentAvgPrice: newAvgPrice,
      lowestPrice: priceStats._min.pricePerUnit || 0,
      highestPrice: priceStats._max.pricePerUnit || 0,
      priceChange24h,
      demandTrend,
      popularityScore,
      lastUpdated: now,
    },
  });
}

// ============================================================================
// MARKETPLACE OPERATIONS
// ============================================================================

/**
 * Vytvoření nového listingu na marketplace
 */
export async function createListing(params: CreateListingParams) {
  const { 
    sellerId, 
    itemId, 
    quantity, 
    pricePerUnit, 
    gemPrice = 0, 
    title, 
    description,
    expiresInDays = 30,
  } = params;

  // Ověřit, že prodávající vlastní item
  const inventory = await prisma.userInventory.findUnique({
    where: { 
      userId_itemId: { userId: sellerId, itemId },
    },
  });

  if (!inventory || inventory.quantity < quantity) {
    throw new Error('Insufficient item quantity in inventory');
  }

  // Získat doporučenou cenu pokud není zadána
  let finalPrice = pricePerUnit;
  if (!finalPrice) {
    const pricing = await calculateDynamicPrice(itemId);
    finalPrice = pricing.recommendedPrice;
  }

  // Vypočítat demand multiplier a trending score
  const pricing = await calculateDynamicPrice(itemId);

  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  // Vytvořit listing
  const listing = await prisma.$transaction(async (tx) => {
    // Odebrat z inventory (reserved for sale)
    await tx.userInventory.update({
      where: { 
        userId_itemId: { userId: sellerId, itemId },
      },
      data: {
        quantity: { decrement: quantity },
      },
    });

    // Vytvořit listing
    const newListing = await tx.marketplaceListing.create({
      data: {
        sellerId,
        itemId,
        quantity,
        pricePerUnit: finalPrice,
        originalPrice: finalPrice,
        gemPrice,
        title,
        description,
        expiresAt,
        demandMultiplier: pricing.demandMultiplier,
        trendingScore: pricing.popularityScore,
        status: 'ACTIVE',
      },
    });

    return newListing;
  });

  // Aktualizovat market demand
  await updateMarketDemand(itemId);

  return listing;
}

/**
 * Nákup itemu z marketplace
 */
export async function buyListing(params: BuyListingParams) {
  const { listingId, buyerId, quantity } = params;

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'ACTIVE') {
    throw new Error('Listing is not active');
  }

  if (listing.quantity < quantity) {
    throw new Error('Insufficient quantity available');
  }

  if (listing.sellerId === buyerId) {
    throw new Error('Cannot buy your own listing');
  }

  // Ověřit, že kupující má dostatek gold
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { gold: true, gems: true },
  });

  const totalPrice = listing.pricePerUnit * quantity;
  if (!buyer || buyer.gold < totalPrice) {
    throw new Error('Insufficient gold');
  }

  // Provést transakci
  const result = await prisma.$transaction(async (tx) => {
    // Odebrat gold kupujícímu
    await tx.user.update({
      where: { id: buyerId },
      data: { gold: { decrement: totalPrice } },
    });

    // Přidat gold prodávajícímu
    await tx.user.update({
      where: { id: listing.sellerId },
      data: { gold: { increment: totalPrice } },
    });

    // Přidat item do inventory kupujícího
    await tx.userInventory.upsert({
      where: {
        userId_itemId: { userId: buyerId, itemId: listing.itemId },
      },
      create: {
        userId: buyerId,
        itemId: listing.itemId,
        quantity,
      },
      update: {
        quantity: { increment: quantity },
      },
    });

    // Aktualizovat nebo smazat listing
    if (listing.quantity === quantity) {
      // Kompletní prodej - označit jako SOLD
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          status: 'SOLD',
          soldAt: new Date(),
          buyerId,
          quantity: 0,
        },
      });
    } else {
      // Částečný prodej - snížit quantity
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          quantity: { decrement: quantity },
        },
      });
    }

    // Vytvořit transaction log
    const transaction = await tx.marketTransaction.create({
      data: {
        listingId,
        sellerId: listing.sellerId,
        buyerId,
        itemId: listing.itemId,
        quantity,
        pricePerUnit: listing.pricePerUnit,
        totalPrice,
        gemPrice: 0,
        demandLevel: listing.demandMultiplier,
        supplyLevel: 1.0,
      },
    });

    return { transaction, listing };
  });

  // Aktualizovat market demand (asynchronně)
  updateMarketDemand(listing.itemId).catch(console.error);

  return result;
}

/**
 * Zrušení vlastního listingu
 */
export async function cancelListing(listingId: string, userId: string) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.sellerId !== userId) {
    throw new Error('Unauthorized - not listing owner');
  }

  if (listing.status !== 'ACTIVE') {
    throw new Error('Listing is not active');
  }

  // Vrátit item zpět do inventory a zrušit listing
  await prisma.$transaction(async (tx) => {
    // Vrátit item do inventory
    await tx.userInventory.upsert({
      where: {
        userId_itemId: { userId, itemId: listing.itemId },
      },
      create: {
        userId,
        itemId: listing.itemId,
        quantity: listing.quantity,
      },
      update: {
        quantity: { increment: listing.quantity },
      },
    });

    // Označit listing jako CANCELLED
    await tx.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: 'CANCELLED',
        quantity: 0,
      },
    });
  });

  // Aktualizovat market demand
  await updateMarketDemand(listing.itemId);

  return { success: true };
}

/**
 * Získat marketplace listings s filtry
 */
export async function getMarketListings(filters: MarketFilters = {}, page = 1, limit = 20) {
  const {
    itemType,
    rarity,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy = 'recent',
    featured,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: 'ACTIVE',
    quantity: { gt: 0 },
  };

  if (itemType) {
    where.item = { type: itemType };
  }

  if (rarity) {
    where.item = { ...where.item, rarity };
  }

  if (minPrice !== undefined) {
    where.pricePerUnit = { ...where.pricePerUnit, gte: minPrice };
  }

  if (maxPrice !== undefined) {
    where.pricePerUnit = { ...where.pricePerUnit, lte: maxPrice };
  }

  if (searchQuery) {
    where.OR = [
      { item: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  // Sorting
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'price_asc') orderBy = { pricePerUnit: 'asc' };
  if (sortBy === 'price_desc') orderBy = { pricePerUnit: 'desc' };
  if (sortBy === 'popularity') orderBy = { views: 'desc' };
  if (sortBy === 'trending') orderBy = { trendingScore: 'desc' };

  const [listings, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where }),
  ]);

  return {
    listings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Získat detail listingu a zvýšit view count
 */
export async function getListingDetail(listingId: string) {
  // Zvýšit view count
  const listing = await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: {
      views: { increment: 1 },
    },
  });

  // Získat market demand pro pricing info
  const demand = await prisma.marketDemand.findUnique({
    where: { itemId: listing.itemId },
  });

  return {
    listing,
    marketInfo: demand,
  };
}

/**
 * Získat market statistiky
 */
export async function getMarketStats(): Promise<MarketStats> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalListings, totalTransactions24h, volumeData, trending] = await Promise.all([
    prisma.marketplaceListing.count({
      where: { status: 'ACTIVE' },
    }),
    prisma.marketTransaction.count({
      where: { createdAt: { gte: last24h } },
    }),
    prisma.marketTransaction.aggregate({
      where: { createdAt: { gte: last24h } },
      _sum: { totalPrice: true },
    }),
    prisma.marketDemand.findMany({
      where: { popularityScore: { gt: 60 } },
      orderBy: { popularityScore: 'desc' },
      take: 5,
    }),
  ]);

  const trendingItems = trending.map((t: any) => ({
    itemId: t.itemId,
    itemName: t.item?.name || 'Unknown',
    priceChange: t.priceChange24h,
    popularityScore: t.popularityScore,
  }));

  return {
    totalListings,
    totalTransactions24h,
    totalVolume24h: volumeData._sum.totalPrice || 0,
    trendingItems,
  };
}

/**
 * Přidat item na watchlist
 */
export async function addToWatchlist(userId: string, itemId: string, maxPrice?: number) {
  return await prisma.itemWatchlist.upsert({
    where: {
      userId_itemId: { userId, itemId },
    },
    create: {
      userId,
      itemId,
      maxPrice,
    },
    update: {
      maxPrice,
    },
  });
}

/**
 * Odebrat z watchlistu
 */
export async function removeFromWatchlist(userId: string, itemId: string) {
  return await prisma.itemWatchlist.delete({
    where: {
      userId_itemId: { userId, itemId },
    },
  });
}

/**
 * Získat watchlist uživatele
 */
export async function getUserWatchlist(userId: string) {
  return await prisma.itemWatchlist.findMany({
    where: { userId },
  });
}

// ============================================================================
// PRICE HISTORY & ANALYTICS
// ============================================================================

/**
 * Uložit snapshot cen do history (volat periodicky - cronjob)
 */
export async function snapshotPriceHistory(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(periodStart);
  if (period === 'daily') periodEnd.setDate(periodEnd.getDate() + 1);
  if (period === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7);
  if (period === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Získat všechny unique items, které mají transakce
  const items = await prisma.marketTransaction.findMany({
    where: {
      createdAt: {
        gte: periodStart,
        lt: periodEnd,
      },
    },
    select: { itemId: true },
    distinct: ['itemId'],
  });

  for (const { itemId } of items) {
    const transactions = await prisma.marketTransaction.findMany({
      where: {
        itemId,
        createdAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
      select: { pricePerUnit: true },
    });

    if (transactions.length === 0) continue;

    const prices = transactions.map(t => t.pricePerUnit).sort((a, b) => a - b);
    const sum = prices.reduce((acc, p) => acc + p, 0);

    const avgPrice = Math.floor(sum / prices.length);
    const minPrice = prices[0] ?? 0;
    const maxPrice = prices[prices.length - 1] ?? 0;
    const medianPrice = prices[Math.floor(prices.length / 2)] ?? 0;

    await prisma.itemPriceHistory.create({
      data: {
        itemId,
        averagePrice: avgPrice,
        lowestPrice: minPrice,
        highestPrice: maxPrice,
        medianPrice,
        totalSold: transactions.length,
        totalListings: await prisma.marketplaceListing.count({
          where: { itemId, status: 'ACTIVE' },
        }),
        period,
        periodStart,
        periodEnd,
      },
    });
  }
}

/**
 * Získat cenovou historii itemu
 */
export async function getItemPriceHistory(itemId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily', limit = 30) {
  return await prisma.itemPriceHistory.findMany({
    where: { itemId, period },
    orderBy: { periodStart: 'desc' },
    take: limit,
  });
}
