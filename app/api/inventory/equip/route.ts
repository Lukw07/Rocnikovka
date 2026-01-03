import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * POST /api/inventory/equip
 * Nasadí/odebere cosmetic item
 * 
 * Body:
 * - inventoryId: string (ID záznamu v inventáři)
 * - equip: boolean (true = nasadit, false = sundat)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { inventoryId, equip = true } = body;

    if (!inventoryId) {
      return NextResponse.json(
        { error: 'Inventory ID required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const inventoryItem = await prisma.userInventory.findFirst({
      where: {
        id: inventoryId,
        userId: user.id,
      },
      include: {
        item: true,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Pouze cosmetic items můžou být equipnuté
    if (inventoryItem.item.type !== 'COSMETIC') {
      return NextResponse.json(
        { error: 'Only cosmetic items can be equipped' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Pokud equipujeme, odpojit ostatní items stejné kategorie
      if (equip && inventoryItem.item.category) {
        await tx.userInventory.updateMany({
          where: {
            userId: user.id,
            isEquipped: true,
            item: {
              category: inventoryItem.item.category,
            },
          },
          data: {
            isEquipped: false,
          },
        });
      }

      // Aktualizovat item
      const updated = await tx.userInventory.update({
        where: { id: inventoryId },
        data: {
          isEquipped: equip,
        },
        include: {
          item: true,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: equip ? 'Item equipped' : 'Item unequipped',
      item: result,
    });
  } catch (error) {
    console.error('Error equipping item:', error);
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 }
    );
  }
}
