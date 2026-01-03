import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * POST /api/trading/[tradeId]/reject
 * Odmítne trade request
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
        requester: true,
      },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    if (trade.recipientId !== user.id) {
      return NextResponse.json(
        { error: 'Only recipient can reject' },
        { status: 403 }
      );
    }

    if (trade.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Trade is not pending' },
        { status: 400 }
      );
    }

    const updatedTrade = await prisma.$transaction(async (tx) => {
      const updated = await tx.trade.update({
        where: { id: tradeId },
        data: {
          status: 'REJECTED',
        },
      });

      await tx.notification.create({
        data: {
          userId: trade.requesterId,
          type: 'SYSTEM',
          title: '❌ Trade odmítnut',
          message: `${user.name} odmítl tvou trade nabídku`,
          data: {
            tradeId,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Trade rejected',
      trade: updatedTrade,
    });
  } catch (error) {
    console.error('Error rejecting trade:', error);
    return NextResponse.json(
      { error: 'Failed to reject trade' },
      { status: 500 }
    );
  }
}
