import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * POST /api/inventory/use
 * Použije item z inventáře (pro BOOST a COLLECTIBLE typy)
 * 
 * Body:
 * - inventoryId: string (ID záznamu v inventáři)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { inventoryId } = body;

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

    // Najít item v inventáři
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

    // Zkontrolovat, zda již není použitý
    if (inventoryItem.usedAt) {
      return NextResponse.json(
        { error: 'Item already used' },
        { status: 400 }
      );
    }

    // Zkontrolovat expiraci
    if (inventoryItem.expiresAt && inventoryItem.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Item expired' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Aplikovat efekty itemu
      const effects = inventoryItem.item.effects as any;
      const updates: any = {};

      if (effects?.xpBoost) {
        // XP boost - přidat XP
        await tx.xPAudit.create({
          data: {
            userId: user.id,
            amount: effects.xpBoost,
            reason: `Used item: ${inventoryItem.item.name}`,
          },
        });
      }

      if (effects?.goldBonus) {
        updates.gold = { increment: effects.goldBonus };
      }

      if (effects?.gemsBonus) {
        updates.gems = { increment: effects.gemsBonus };
      }

      // Aktualizovat uživatele
      if (Object.keys(updates).length > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: updates,
        });
      }

      // Označit item jako použitý
      const updatedInventoryItem = await tx.userInventory.update({
        where: { id: inventoryId },
        data: {
          usedAt: new Date(),
          quantity: inventoryItem.quantity > 1 
            ? { decrement: 1 } 
            : inventoryItem.quantity,
        },
      });

      // Pokud byl poslední kus, smazat z inventáře
      if (inventoryItem.quantity === 1) {
        await tx.userInventory.delete({
          where: { id: inventoryId },
        });
      }

      // Vytvořit notifikaci
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: '✨ Item použit!',
          message: `Použil jsi ${inventoryItem.item.name}`,
          data: {
            itemId: inventoryItem.item.id,
            effects,
          },
        },
      });

      return { inventoryItem, effects, updatedInventoryItem };
    });

    return NextResponse.json({
      success: true,
      message: `Used ${inventoryItem.item.name}`,
      effects: result.effects,
    });
  } catch (error) {
    console.error('Error using item:', error);
    return NextResponse.json(
      { error: 'Failed to use item' },
      { status: 500 }
    );
  }
}
