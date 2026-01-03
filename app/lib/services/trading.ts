import prisma from '@/app/lib/prisma';

/**
 * Trading Service - Business logika pro marketplace a trading
 * Obsahuje anti-abuse mechanismy, price suggestions, a validace
 */

export class TradingService {
  /**
   * Zkontroluje, zda uživatel má právo obchodovat
   * Anti-abuse: rate limiting, level requirement, reputation check
   */
  static async canUserTrade(userId: string): Promise<{ canTrade: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        xpAudits: {
          select: { amount: true },
          orderBy: { createdAt: 'desc' },
          take: 100, // get last 100 audits to calculate total
        },
      },
    });

    if (!user) {
      return { canTrade: false, reason: 'Uživatel nenalezen' };
    }

    // Minimální level requirement (level 5)
    const totalXp = user.xpAudits.reduce((sum, audit) => sum + audit.amount, 0);
    const level = Math.floor(totalXp / 100) + 1; // Simplified level calculation
    
    if (level < 5) {
      return { 
        canTrade: false, 
        reason: 'Pro trading musíš být alespoň level 5' 
      };
    }

    // Rate limiting - max 50 listings za den
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayListings = await prisma.marketplaceListing.count({
      where: {
        sellerId: userId,
        createdAt: { gte: today },
      },
    });

    if (todayListings >= 50) {
      return {
        canTrade: false,
        reason: 'Dosáhl jsi denní limit 50 nabídek',
      };
    }

    // Check reputation
    const reputation = await prisma.tradingReputation.findUnique({
      where: { userId },
    });

    if (reputation && reputation.trustScore < 20) {
      return {
        canTrade: false,
        reason: 'Tvoje trading reputace je příliš nízká',
      };
    }

    return { canTrade: true };
  }

  /**
   * Doporučená cena pro item na základě market data
   */
  static async getSuggestedPrice(itemId: string): Promise<{
    suggested: number;
    basePrice: number;
    marketAvg: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { price: true },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    // Získat recent market data
    const recentListings = await prisma.marketplaceListing.findMany({
      where: {
        itemId,
        status: 'ACTIVE',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: { pricePerUnit: true },
    });

    const recentSales = await prisma.tradingTransaction.findMany({
      where: {
        itemId,
        transactionType: 'MARKETPLACE',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: { goldAmount: true },
    });

    // Calculate market average
    let marketAvg = item.price;
    if (recentListings.length > 0) {
      const sum = recentListings.reduce((acc, l) => acc + l.pricePerUnit, 0);
      marketAvg = Math.round(sum / recentListings.length);
    }

    // Trend detection
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (marketAvg > item.price * 1.1) trend = 'up';
    else if (marketAvg < item.price * 0.9) trend = 'down';

    // Suggested price: slight discount from market avg for quick sale
    const suggested = Math.round(marketAvg * 0.95);

    return {
      suggested: Math.max(suggested, 1), // Never 0
      basePrice: item.price,
      marketAvg,
      trend,
    };
  }

  /**
   * Validace trading price - prevence extrémních cen
   */
  static validatePrice(itemBasePrice: number, sellingPrice: number): { valid: boolean; reason?: string } {
    // Minimální cena: 10% base price
    if (sellingPrice < itemBasePrice * 0.1) {
      return {
        valid: false,
        reason: 'Cena je příliš nízká (min 10% základní ceny)',
      };
    }

    // Maximální cena: 500% base price (proti price gouging)
    if (sellingPrice > itemBasePrice * 5) {
      return {
        valid: false,
        reason: 'Cena je příliš vysoká (max 500% základní ceny)',
      };
    }

    return { valid: true };
  }

  /**
   * Detekce podezřelé activity (možný exploit nebo RMT)
   */
  static async detectSuspiciousActivity(userId: string): Promise<boolean> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Velké množství transakcí za krátkou dobu
    const recentTransactions = await prisma.tradingTransaction.count({
      where: {
        OR: [{ sellerId: userId }, { buyerId: userId }],
        createdAt: { gte: last24h },
      },
    });

    if (recentTransactions > 100) {
      return true; // Suspicious: >100 transactions in 24h
    }

    // Abnormální množství získaného goldu
    const recentEarnings = await prisma.moneyTx.aggregate({
      where: {
        userId,
        type: 'EARNED',
        createdAt: { gte: last24h },
      },
      _sum: {
        amount: true,
      },
    });

    if ((recentEarnings._sum.amount || 0) > 100000) {
      return true; // Suspicious: >100k gold earned in 24h
    }

    return false;
  }

  /**
   * Calculate trading fees (např. 5% marketplace fee)
   */
  static calculateFees(price: number, quantity: number): {
    totalPrice: number;
    sellerReceives: number;
    marketplaceFee: number;
  } {
    const totalPrice = price * quantity;
    const feeRate = 0.05; // 5% fee
    const marketplaceFee = Math.round(totalPrice * feeRate);
    const sellerReceives = totalPrice - marketplaceFee;

    return {
      totalPrice,
      sellerReceives,
      marketplaceFee,
    };
  }

  /**
   * Update item price history - mělo by se volat cronem denně
   */
  static async updatePriceHistory(itemId: string, period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    let periodStart: Date;
    let periodEnd = new Date(now);

    if (period === 'daily') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 1);
    }

    // Get all transactions for this item in the period
    const transactions = await prisma.tradingTransaction.findMany({
      where: {
        itemId,
        transactionType: 'MARKETPLACE',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        goldAmount: true,
        quantity: true,
      },
    });

    if (transactions.length === 0) {
      return; // No data to update
    }

    // Calculate stats
    const prices = transactions.map(t => t.goldAmount / t.quantity);
    const totalSold = transactions.reduce((sum, t) => sum + t.quantity, 0);
    const averagePrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
    const lowestPrice = Math.min(...prices) ?? 0;
    const highestPrice = Math.max(...prices) ?? 0;
    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] ?? 0;

    // Count active listings
    const totalListings = await prisma.marketplaceListing.count({
      where: {
        itemId,
        status: 'ACTIVE',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Upsert price history
    await prisma.itemPriceHistory.upsert({
      where: {
        itemId_period_periodStart: {
          itemId,
          period,
          periodStart,
        },
      },
      create: {
        itemId,
        period,
        periodStart,
        periodEnd,
        averagePrice,
        lowestPrice: Math.round(lowestPrice),
        highestPrice: Math.round(highestPrice),
        medianPrice: Math.round(medianPrice),
        totalSold,
        totalListings,
      },
      update: {
        periodEnd,
        averagePrice,
        lowestPrice: Math.round(lowestPrice),
        highestPrice: Math.round(highestPrice),
        medianPrice: Math.round(medianPrice),
        totalSold,
        totalListings,
      },
    });
  }

  /**
   * Award trading reputation points
   */
  static async awardReputationPoints(userId: string, points: number, reason: string) {
    await prisma.tradingReputation.upsert({
      where: { userId },
      create: {
        userId,
        trustScore: Math.min(100, 100 + points),
      },
      update: {
        trustScore: {
          increment: points,
        },
      },
    });

    // Cap trust score between 0-100
    const rep = await prisma.tradingReputation.findUnique({
      where: { userId },
    });

    if (rep) {
      const newScore = Math.max(0, Math.min(100, rep.trustScore));
      await prisma.tradingReputation.update({
        where: { userId },
        data: { trustScore: newScore },
      });
    }
  }

  /**
   * Cleanup expired listings - mělo by se volat cronem
   */
  static async cleanupExpiredListings() {
    const now = new Date();

    const expiredListings = await prisma.marketplaceListing.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lte: now,
        },
      },
    });

    for (const listing of expiredListings) {
      await prisma.$transaction(async (tx) => {
        // Update status
        await tx.marketplaceListing.update({
          where: { id: listing.id },
          data: { status: 'EXPIRED' },
        });

        // Return items to inventory
        await tx.userInventory.update({
          where: {
            userId_itemId: {
              userId: listing.sellerId,
              itemId: listing.itemId,
            },
          },
          data: {
            quantity: { increment: listing.quantity },
          },
        });

        // Notify seller
        await tx.notification.create({
          data: {
            userId: listing.sellerId,
            type: 'SYSTEM',
            title: '⏰ Nabídka expirovala',
            message: `Tvoje nabídka na ${listing.quantity}x items expirovala`,
            data: { listingId: listing.id },
          },
        });
      });
    }

    return expiredListings.length;
  }
}
