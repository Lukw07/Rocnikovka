import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/inventory
 * Získá inventář uživatele
 * 
 * Query params:
 * - type?: 'COSMETIC' | 'BOOST' | 'COLLECTIBLE'
 * - equipped?: boolean
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'COSMETIC' | 'BOOST' | 'COLLECTIBLE' | null;
    const equippedParam = searchParams.get('equipped');
    const equipped = equippedParam ? equippedParam === 'true' : undefined;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const inventory = await prisma.userInventory.findMany({
      where: {
        userId: user.id,
        ...(equipped !== undefined && { isEquipped: equipped }),
        item: {
          ...(type && { type }),
          isActive: true,
        },
      },
      include: {
        item: true,
      },
      orderBy: [
        { isEquipped: 'desc' },
        { obtainedAt: 'desc' },
      ],
    });

    // Seskupit podle kategorie
    const grouped = {
      cosmetic: inventory.filter(i => i.item.type === 'COSMETIC'),
      boost: inventory.filter(i => i.item.type === 'BOOST'),
      collectible: inventory.filter(i => i.item.type === 'COLLECTIBLE'),
    };

    return NextResponse.json({
      inventory,
      grouped,
      totalItems: inventory.length,
      equippedCount: inventory.filter(i => i.isEquipped).length,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
