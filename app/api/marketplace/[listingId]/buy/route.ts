import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

/**
 * POST /api/marketplace/[listingId]/buy
 * Koupí item z marketplace
 */
export async function POST(
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

    const body = await req.json();
    const { quantity: requestedQuantity = 1, useGems = false } = body;

    // Získat listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Získat item
    const item = await prisma.item.findUnique({
      where: { id: listing.itemId }
    });

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 });
    }

    if (listing.sellerId === user.id) {
      return NextResponse.json(
        { error: 'Cannot buy your own listing' },
        { status: 400 }
      );
    }

    if (requestedQuantity > listing.quantity) {
      return NextResponse.json(
        { error: 'Insufficient quantity available' },
        { status: 400 }
      );
    }

    // Kontrola expirace
    if (listing.expiresAt && listing.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Listing has expired' }, { status: 400 });
    }

    // Výpočet ceny
    const totalPrice = useGems 
      ? listing.gemPrice * requestedQuantity 
      : listing.pricePerUnit * requestedQuantity;

    // Kontrola dostatečných prostředků
    if (useGems) {
      if (user.gems < totalPrice) {
        return NextResponse.json(
          { error: 'Insufficient gems' },
          { status: 400 }
        );
      }
    } else {
      if (user.gold < totalPrice) {
        return NextResponse.json(
          { error: 'Insufficient gold' },
          { status: 400 }
        );
      }
    }

    // Provést nákup v transakci
    const result = await prisma.$transaction(async (tx) => {
      // Odečíst peníze od kupce
      await tx.user.update({
        where: { id: user.id },
        data: useGems
          ? { gems: { decrement: totalPrice } }
          : { gold: { decrement: totalPrice } },
      });

      // Přidat peníze prodejci
      await tx.user.update({
        where: { id: listing.sellerId },
        data: useGems
          ? { gems: { increment: totalPrice } }
          : { gold: { increment: totalPrice } },
      });

      // Přidat item do inventáře kupce
      const existingInventory = await tx.userInventory.findFirst({
        where: {
          userId: user.id,
          itemId: listing.itemId,
        },
      });

      if (existingInventory) {
        await tx.userInventory.update({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: listing.itemId,
            },
          },
          data: {
            quantity: { increment: requestedQuantity },
          },
        });
      } else {
        await tx.userInventory.create({
          data: {
            userId: user.id,
            itemId: listing.itemId,
            quantity: requestedQuantity,
          },
        });
      }

      // Aktualizovat listing
      const remainingQuantity = listing.quantity - requestedQuantity;
      const newStatus = remainingQuantity === 0 ? 'SOLD' : 'ACTIVE';

      const updatedListing = await tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          quantity: remainingQuantity,
          status: newStatus,
          ...(newStatus === 'SOLD' && {
            soldAt: new Date(),
            buyerId: user.id,
          }),
        },
      });

      // Vytvořit transakční záznam
      await tx.tradingTransaction.create({
        data: {
          sellerId: listing.sellerId,
          buyerId: user.id,
          itemId: listing.itemId,
          quantity: requestedQuantity,
          goldAmount: useGems ? 0 : totalPrice,
          gemAmount: useGems ? totalPrice : 0,
          transactionType: 'MARKETPLACE',
          listingId: listing.id,
        },
      });

      // Money transaction logs
      await tx.moneyTx.create({
        data: {
          userId: user.id,
          amount: -totalPrice,
          type: 'SPENT',
          reason: `Bought ${requestedQuantity}x ${item?.name || 'item'} from marketplace`,
        },
      });

      await tx.moneyTx.create({
        data: {
          userId: listing.sellerId,
          amount: totalPrice,
          type: 'EARNED',
          reason: `Sold ${requestedQuantity}x ${item?.name || 'item'} on marketplace`,
        },
      });

      // Aktualizovat trading reputation
      await tx.tradingReputation.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          totalPurchases: 1,
          totalGoldSpent: useGems ? 0 : totalPrice,
          lastTradeAt: new Date(),
        },
        update: {
          totalPurchases: { increment: 1 },
          totalGoldSpent: useGems ? {} : { increment: totalPrice },
          lastTradeAt: new Date(),
        },
      });

      await tx.tradingReputation.upsert({
        where: { userId: listing.sellerId },
        create: {
          userId: listing.sellerId,
          totalSales: 1,
          totalGoldEarned: useGems ? 0 : totalPrice,
          lastTradeAt: new Date(),
        },
        update: {
          totalSales: { increment: 1 },
          totalGoldEarned: useGems ? {} : { increment: totalPrice },
          lastTradeAt: new Date(),
        },
      });

      // Notifikace pro prodejce
      await tx.notification.create({
        data: {
          userId: listing.sellerId,
          type: 'SYSTEM',
          title: '💰 Item prodán!',
          message: `${user.name} koupil ${requestedQuantity}x ${item?.name || 'item'} za ${totalPrice} ${useGems ? 'gems' : 'gold'}`,
          data: {
            listingId: listing.id,
            buyerId: user.id,
            itemId: listing.itemId,
            quantity: requestedQuantity,
            price: totalPrice,
          },
        },
      });

      return updatedListing;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${requestedQuantity}x ${item?.name || 'item'}`,
      listing: result,
      totalPaid: totalPrice,
      currency: useGems ? 'gems' : 'gold',
    });
  } catch (error) {
    console.error('Error buying from marketplace:', error);
    return NextResponse.json(
      { error: 'Failed to complete purchase' },
      { status: 500 }
    );
  }
}
