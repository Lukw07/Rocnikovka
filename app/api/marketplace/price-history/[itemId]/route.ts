import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/marketplace/price-history/[itemId]
 * Získá cenovou historii konkrétního itemu
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'daily';

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        name: true,
        price: true,
        rarity: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Získat historii cen
    const priceHistory = await prisma.itemPriceHistory.findMany({
      where: {
        itemId,
        period,
      },
      orderBy: {
        periodStart: 'desc',
      },
      take: 30,
    });

    // Aktuální aktivní listings pro tento item
    const currentListings = await prisma.marketplaceListing.findMany({
      where: {
        itemId,
        status: 'ACTIVE',
      },
      select: {
        pricePerUnit: true,
        quantity: true,
      },
      orderBy: {
        pricePerUnit: 'asc',
      },
    });

    // Statistiky
    const avgCurrentPrice = currentListings.length > 0
      ? currentListings.reduce((sum, l) => sum + l.pricePerUnit, 0) / currentListings.length
      : item.price;

    const lowestCurrentPrice = currentListings.length > 0
      ? Math.min(...currentListings.map(l => l.pricePerUnit))
      : item.price;

    const highestCurrentPrice = currentListings.length > 0
      ? Math.max(...currentListings.map(l => l.pricePerUnit))
      : item.price;

    // Celkový počet prodejů
    const totalSales = await prisma.tradingTransaction.count({
      where: {
        itemId,
        transactionType: 'MARKETPLACE',
      },
    });

    return NextResponse.json({
      item,
      priceHistory,
      currentMarket: {
        activeListings: currentListings.length,
        availableQuantity: currentListings.reduce((sum, l) => sum + l.quantity, 0),
        avgPrice: Math.round(avgCurrentPrice),
        lowestPrice: lowestCurrentPrice,
        highestPrice: highestCurrentPrice,
        basePrice: item.price,
      },
      stats: {
        totalSales,
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
