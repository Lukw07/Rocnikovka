import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/trading
 * Získá aktivní trades pro uživatele
 * 
 * Query params:
 * - status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
 * - type?: 'sent' | 'received' (trades odeslané / přijaté)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;
    const type = searchParams.get('type');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const where: any = {
      ...(status && { status }),
    };

    if (type === 'sent') {
      where.requesterId = user.id;
    } else if (type === 'received') {
      where.recipientId = user.id;
    } else {
      // Obojí
      where.OR = [
        { requesterId: user.id },
        { recipientId: user.id },
      ];
    }

    const trades = await prisma.trade.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        tradeItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      trades,
      sent: trades.filter(t => t.requesterId === user.id),
      received: trades.filter(t => t.recipientId === user.id),
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trading
 * Vytvoří nový trade request
 * 
 * Body:
 * - recipientId: string (ID příjemce)
 * - offeredItems: Array<{ itemId: string, quantity: number }>
 * - requestedItems: Array<{ itemId: string, quantity: number }>
 * - message?: string (zpráva k tradu)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipientId, offeredItems = [], requestedItems = [], message } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID required' },
        { status: 400 }
      );
    }

    if (offeredItems.length === 0 && requestedItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one item must be offered or requested' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Nelze tradovat sám se sebou
    if (user.id === recipientId) {
      return NextResponse.json(
        { error: 'Cannot trade with yourself' },
        { status: 400 }
      );
    }

    // Ověřit, že uživatel vlastní nabízené itemy
    for (const offered of offeredItems) {
      const inventoryItem = await prisma.userInventory.findFirst({
        where: {
          userId: user.id,
          itemId: offered.itemId,
          quantity: { gte: offered.quantity },
        },
        include: {
          item: true,
        },
      });

      if (!inventoryItem) {
        return NextResponse.json(
          { error: `You don't own enough of item ${offered.itemId}` },
          { status: 400 }
        );
      }

      if (!inventoryItem.item.isTradeable) {
        return NextResponse.json(
          { error: `Item ${inventoryItem.item.name} is not tradeable` },
          { status: 400 }
        );
      }
    }

    // Vytvořit trade
    const trade = await prisma.$transaction(async (tx) => {
      // Vytvořit trade offer
      const offer = await tx.tradeOffer.create({
        data: {
          offeredItemIds: offeredItems.map((i: any) => i.itemId),
          wantedItemIds: requestedItems.map((i: any) => i.itemId),
        },
      });

      // Vytvořit trade
      const newTrade = await tx.trade.create({
        data: {
          offerId: offer.id,
          requesterId: user.id,
          recipientId,
          message,
          status: 'PENDING',
        },
        include: {
          requester: true,
          recipient: true,
        },
      });

      // Vytvořit trade items
      const allItems = [
        ...offeredItems.map((i: any) => ({ ...i, isOffered: true })),
        ...requestedItems.map((i: any) => ({ ...i, isOffered: false })),
      ];

      await tx.tradeItem.createMany({
        data: allItems.map((i: any) => ({
          tradeId: newTrade.id,
          itemId: i.itemId,
          quantity: i.quantity,
          isOffered: i.isOffered,
        })),
      });

      // Notifikace pro příjemce
      await tx.notification.create({
        data: {
          userId: recipientId,
          type: 'SYSTEM',
          title: '🔄 Nový trade request!',
          message: `${user.name} ti poslal trade nabídku`,
          data: {
            tradeId: newTrade.id,
            requesterId: user.id,
          },
        },
      });

      return newTrade;
    });

    return NextResponse.json({
      success: true,
      trade,
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
