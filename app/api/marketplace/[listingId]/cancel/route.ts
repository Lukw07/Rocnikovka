import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

/**
 * DELETE /api/marketplace/[listingId]/cancel
 * Zruší vlastní marketplace listing
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.sellerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only cancel your own listings' },
        { status: 403 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Listing is not active' },
        { status: 400 }
      );
    }

    // Zrušit listing a vrátit items do inventáře
    await prisma.$transaction(async (tx) => {
      // Aktualizovat listing status
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Vrátit items do inventáře
      await tx.userInventory.update({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: listing.itemId,
          },
        },
        data: {
          quantity: { increment: listing.quantity },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Listing cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling listing:', error);
    return NextResponse.json(
      { error: 'Failed to cancel listing' },
      { status: 500 }
    );
  }
}
