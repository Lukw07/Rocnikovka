/**
 * Item Price History API
 * GET /api/marketplace/items/[itemId]/price-history
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    // Získat historii cen
    const priceHistory = await prisma.itemPriceHistory.findMany({
      where: {
        itemId,
        period: period as 'daily' | 'weekly' | 'monthly',
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });

    // Získat aktuální market demand
    const currentDemand = await prisma.marketDemand.findUnique({
      where: { itemId },
    });

    // Získat item info
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        rarity: true,
        imageUrl: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      item,
      currentMarket: currentDemand,
      history: priceHistory.reverse(), // Chronological order
      summary: {
        averagePrice: priceHistory.length > 0
          ? Math.floor(
              priceHistory.reduce((sum, h) => sum + h.averagePrice, 0) / priceHistory.length
            )
          : item.price,
        lowestPrice: priceHistory.length > 0
          ? Math.min(...priceHistory.map((h) => h.lowestPrice))
          : item.price,
        highestPrice: priceHistory.length > 0
          ? Math.max(...priceHistory.map((h) => h.highestPrice))
          : item.price,
        totalSold: priceHistory.reduce((sum, h) => sum + h.totalSold, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
