import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * POST /api/trading/[tradeId]/accept
 * Přijme trade request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId } = await params;
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        tradeItems: {
          include: {
            item: true,
          },
        },
        requester: true,
      },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Pouze příjemce může přijmout
    if (trade.recipientId !== user.id) {
      return NextResponse.json(
        { error: 'Only recipient can accept' },
        { status: 403 }
      );
    }

    // Trade musí být pending
    if (trade.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Trade is not pending' },
        { status: 400 }
      );
    }

    // Provést trade
    const result = await prisma.$transaction(async (tx) => {
      const offeredItems = trade.tradeItems.filter(ti => ti.isOffered);
      const requestedItems = trade.tradeItems.filter(ti => !ti.isOffered);

      // Převést nabízené itemy od requestera k recipientovi
      for (const ti of offeredItems) {
        // Odečíst od requestera
        const requesterInventory = await tx.userInventory.findFirst({
          where: {
            userId: trade.requesterId,
            itemId: ti.itemId,
          },
        });

        if (!requesterInventory || requesterInventory.quantity < ti.quantity) {
          throw new Error(`Requester doesn't have enough of ${ti.item.name}`);
        }

        if (requesterInventory.quantity === ti.quantity) {
          await tx.userInventory.delete({
            where: { id: requesterInventory.id },
          });
        } else {
          await tx.userInventory.update({
            where: { id: requesterInventory.id },
            data: { quantity: { decrement: ti.quantity } },
          });
        }

        // Přidat recipientovi
        await tx.userInventory.upsert({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: ti.itemId,
            },
          },
          create: {
            userId: user.id,
            itemId: ti.itemId,
            quantity: ti.quantity,
          },
          update: {
            quantity: { increment: ti.quantity },
          },
        });
      }

      // Převést požadované itemy od recipienta k requesterovi
      for (const ti of requestedItems) {
        const recipientInventory = await tx.userInventory.findFirst({
          where: {
            userId: user.id,
            itemId: ti.itemId,
          },
        });

        if (!recipientInventory || recipientInventory.quantity < ti.quantity) {
          throw new Error(`You don't have enough of ${ti.item.name}`);
        }

        if (recipientInventory.quantity === ti.quantity) {
          await tx.userInventory.delete({
            where: { id: recipientInventory.id },
          });
        } else {
          await tx.userInventory.update({
            where: { id: recipientInventory.id },
            data: { quantity: { decrement: ti.quantity } },
          });
        }

        await tx.userInventory.upsert({
          where: {
            userId_itemId: {
              userId: trade.requesterId,
              itemId: ti.itemId,
            },
          },
          create: {
            userId: trade.requesterId,
            itemId: ti.itemId,
            quantity: ti.quantity,
          },
          update: {
            quantity: { increment: ti.quantity },
          },
        });
      }

      // Aktualizovat trade status
      const updatedTrade = await tx.trade.update({
        where: { id: tradeId },
        data: {
          status: 'COMPLETED',
          acceptedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // Notifikace pro requestera
      await tx.notification.create({
        data: {
          userId: trade.requesterId,
          type: 'SYSTEM',
          title: '✅ Trade dokončen!',
          message: `${user.name} přijal tvou trade nabídku`,
          data: {
            tradeId,
          },
        },
      });

      return updatedTrade;
    });

    return NextResponse.json({
      success: true,
      message: 'Trade completed successfully',
      trade: result,
    });
  } catch (error) {
    console.error('Error accepting trade:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept trade' },
      { status: 500 }
    );
  }
}
