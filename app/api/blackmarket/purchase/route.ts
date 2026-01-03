import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * POST /api/blackmarket/purchase
 * Koupí item z blackmarketu
 * 
 * Body:
 * - offerId: string (ID nabídky)
 * - currency: 'gold' | 'gems' (měna pro nákup)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { offerId, currency = 'gold' } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const offer = await prisma.blackMarketOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Kontroly
    const now = new Date();
    if (!offer.isActive || offer.availableFrom > now || offer.availableTo < now) {
      return NextResponse.json(
        { error: 'Offer is not available' },
        { status: 400 }
      );
    }

    if (offer.stock <= offer.soldCount) {
      return NextResponse.json(
        { error: 'Offer is out of stock' },
        { status: 400 }
      );
    }

    // Určit cenu podle měny
    const price = currency === 'gems' ? offer.gemPrice : offer.price;
    
    if (price === 0 && currency === 'gems') {
      return NextResponse.json(
        { error: 'This item cannot be purchased with gems' },
        { status: 400 }
      );
    }

    // Aplikovat discount
    const finalPrice = Math.floor(price * (1 - offer.discount / 100));

    // Zkontrolovat balance
    const userBalance = currency === 'gold' ? user.gold : user.gems;
    if (userBalance < finalPrice) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    // Provést nákup
    const result = await prisma.$transaction(async (tx) => {
      // Odečíst peníze
      await tx.user.update({
        where: { id: user.id },
        data: {
          [currency]: { decrement: finalPrice },
        },
      });

      // Zvýšit počet prodaných
      await tx.blackMarketOffer.update({
        where: { id: offerId },
        data: {
          soldCount: { increment: 1 },
        },
      });

      // Zalogovat purchase
      const purchase = await tx.blackMarketPurchase.create({
        data: {
          userId: user.id,
          offerId,
          pricePaid: currency === 'gold' ? finalPrice : 0,
          gemsPaid: currency === 'gems' ? finalPrice : 0,
        },
      });

      // Najít nebo vytvořit item pro blackmarket
      let item = await tx.item.findFirst({
        where: { name: offer.name },
      });

      if (!item) {
        // Vytvořit speciální blackmarket item
        item = await tx.item.create({
          data: {
            name: offer.name,
            description: offer.description || 'Rare blackmarket item',
            price: offer.price,
            rarity: offer.rarity,
            type: 'COSMETIC',
            isPurchasable: false, // Není v běžném shopu
            isTradeable: true,
            category: 'blackmarket',
          },
        });
      }

      // Přidat do inventáře
      await tx.userInventory.upsert({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: item.id,
          },
        },
        create: {
          userId: user.id,
          itemId: item.id,
          quantity: 1,
        },
        update: {
          quantity: { increment: 1 },
        },
      });

      // Zalogovat transakci
      await tx.moneyTx.create({
        data: {
          userId: user.id,
          amount: -finalPrice,
          type: 'SPENT',
          reason: `Blackmarket purchase: ${offer.name}`,
        },
      });

      // Notifikace
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: '🎭 Blackmarket nákup!',
          message: `Zakoupil jsi ${offer.name} za ${finalPrice} ${currency}`,
          data: {
            offerId,
            itemId: item.id,
            price: finalPrice,
            currency,
          },
        },
      });

      return { purchase, item, offer };
    });

    return NextResponse.json({
      success: true,
      message: `Purchased ${offer.name}`,
      purchase: result.purchase,
      item: result.item,
    });
  } catch (error) {
    console.error('Error purchasing from blackmarket:', error);
    return NextResponse.json(
      { error: 'Failed to purchase item' },
      { status: 500 }
    );
  }
}
