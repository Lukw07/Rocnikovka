import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/trading/reputation
 * Získá trading reputaci uživatele nebo leaderboard
 * 
 * Query params:
 * - userId?: string (konkrétní uživatel, jinak current user)
 * - leaderboard?: boolean (zobrazit top traders)
 * - limit?: number (pro leaderboard, default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    const targetUserId = searchParams.get('userId');
    const showLeaderboard = searchParams.get('leaderboard') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Leaderboard mode
    if (showLeaderboard) {
      const topTraders = await prisma.tradingReputation.findMany({
        orderBy: [
          { trustScore: 'desc' },
          { totalSales: 'desc' },
        ],
        take: limit,
      });

      return NextResponse.json({
        leaderboard: topTraders,
      });
    }

    // Single user mode
    if (!session?.user?.email && !targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = targetUserId;
    
    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Získat nebo vytvořit reputation
    const reputation = await prisma.tradingReputation.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        trustScore: 100,
      },
      update: {},
    });

    // Získat recent transactions
    const recentTransactions = await prisma.tradingTransaction.findMany({
      where: {
        OR: [
          { sellerId: userId },
          { buyerId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        sellerId: true,
        buyerId: true,
        itemId: true,
        goldAmount: true,
        gemAmount: true,
        createdAt: true,
      },
    });

    // Active listings count
    const activeListingsCount = await prisma.marketplaceListing.count({
      where: {
        sellerId: userId,
        status: 'ACTIVE',
      },
    });

    // Reputation tier calculation
    let tier = 'Newcomer';
    let tierBadge = '🆕';
    
    if (reputation.totalSales >= 100) {
      tier = 'Legendary Merchant';
      tierBadge = '👑';
    } else if (reputation.totalSales >= 50) {
      tier = 'Master Trader';
      tierBadge = '⭐';
    } else if (reputation.totalSales >= 20) {
      tier = 'Expert Trader';
      tierBadge = '💎';
    } else if (reputation.totalSales >= 5) {
      tier = 'Experienced Trader';
      tierBadge = '✨';
    }

    return NextResponse.json({
      reputation: {
        ...reputation,
        tier,
        tierBadge,
        activeListings: activeListingsCount,
      },
      recentTransactions,
    });
  } catch (error) {
    console.error('Error fetching trading reputation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trading reputation' },
      { status: 500 }
    );
  }
}
