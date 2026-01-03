import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/blackmarket
 * Získá aktuální nabídky na blackmarketu
 * 
 * Query params:
 * - featured?: boolean (pouze featured items)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const featuredParam = searchParams.get('featured');
    const featured = featuredParam === 'true';

    const now = new Date();

    const offers = await prisma.blackMarketOffer.findMany({
      where: {
        isActive: true,
        availableFrom: { lte: now },
        availableTo: { gte: now },
        stock: { gt: 0 }, // Ještě něco zbývá
        ...(featured && { isFeatured: true }),
      },
      orderBy: [
        { isFeatured: 'desc' },
        { rarity: 'desc' },
        { availableTo: 'asc' },
      ],
    });

    // Vypočítat zbývající čas pro každou nabídku
    const offersWithTimeLeft = offers.map(offer => ({
      ...offer,
      timeLeftMs: offer.availableTo.getTime() - now.getTime(),
      stockRemaining: offer.stock - offer.soldCount,
    }));

    return NextResponse.json({
      offers: offersWithTimeLeft,
      featured: offersWithTimeLeft.filter(o => o.isFeatured),
      expiringSoon: offersWithTimeLeft.filter(o => o.timeLeftMs < 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error('Error fetching blackmarket offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}
