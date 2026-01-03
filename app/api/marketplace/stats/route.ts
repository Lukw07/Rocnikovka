import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/marketplace/stats
 * Získá statistiky marketplace - nejprodávanější items, trendy cen, atd.
 * 
 * Query params:
 * - period?: 'daily' | 'weekly' | 'monthly' (default: 'weekly')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'weekly';

    // Časové rozmezí
    const now = new Date();
    let startDate = new Date();
    if (period === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Top selling items (podle počtu transakcí)
    const topSellingItems = await prisma.tradingTransaction.groupBy({
      by: ['itemId'],
      where: {
        createdAt: { gte: startDate },
        transactionType: 'MARKETPLACE',
      },
      _count: {
        id: true,
      },
      _sum: {
        goldAmount: true,
        quantity: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Získat detaily itemů
    const itemIds = topSellingItems.map(item => item.itemId);
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        rarity: true,
      },
    });

    const topSelling = topSellingItems.map(stat => {
      const item = items.find(i => i.id === stat.itemId);
      return {
        item,
        totalSales: stat._count.id,
        totalGoldVolume: stat._sum.goldAmount || 0,
        totalQuantitySold: stat._sum.quantity || 0,
      };
    });

    // Aktivní listings stats
    const activeListingsCount = await prisma.marketplaceListing.count({
      where: { status: 'ACTIVE' },
    });

    // Total transactions
    const totalTransactions = await prisma.tradingTransaction.count({
      where: {
        createdAt: { gte: startDate },
        transactionType: 'MARKETPLACE',
      },
    });

    // Total volume (gold traded)
    const volumeStats = await prisma.tradingTransaction.aggregate({
      where: {
        createdAt: { gte: startDate },
        transactionType: 'MARKETPLACE',
      },
      _sum: {
        goldAmount: true,
        gemAmount: true,
      },
    });

    // Top traders (by sales volume)
    const topTraders = await prisma.tradingReputation.findMany({
      orderBy: {
        totalSales: 'desc',
      },
      take: 10,
      select: {
        userId: true,
        totalSales: true,
        totalGoldEarned: true,
        trustScore: true,
        isVerifiedTrader: true,
      },
    });

    // Recent price changes
    const recentPriceChanges = await prisma.itemPriceHistory.findMany({
      where: {
        period,
        periodStart: { gte: startDate },
      },
      orderBy: {
        periodStart: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({
      period,
      stats: {
        topSelling,
        activeListingsCount,
        totalTransactions,
        totalGoldVolume: volumeStats._sum.goldAmount || 0,
        totalGemVolume: volumeStats._sum.gemAmount || 0,
        topTraders,
        recentPriceChanges,
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace stats' },
      { status: 500 }
    );
  }
}
