import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * POST /api/wallet/transfer
 * Převede peníze mezi uživateli
 * 
 * Body:
 * - recipientId: string (ID příjemce)
 * - amount: number (částka v gold)
 * - currency: 'gold' | 'gems'
 * - reason?: string (důvod převodu)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipientId, amount, currency = 'gold', reason } = body;

    // Validace
    if (!recipientId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid transfer data' },
        { status: 400 }
      );
    }

    if (currency !== 'gold' && currency !== 'gems') {
      return NextResponse.json(
        { error: 'Invalid currency type' },
        { status: 400 }
      );
    }

    // Najít odesílatele
    const sender = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    // Zkontrolovat dostatek prostředků
    const senderBalance = currency === 'gold' ? sender.gold : sender.gems;
    if (senderBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    // Najít příjemce
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Nemohu posílat sám sobě
    if (sender.id === recipient.id) {
      return NextResponse.json(
        { error: 'Cannot transfer to yourself' },
        { status: 400 }
      );
    }

    // Provést transakci
    const result = await prisma.$transaction(async (tx) => {
      // Odečíst od odesílatele
      await tx.user.update({
        where: { id: sender.id },
        data: {
          [currency]: { decrement: amount },
        },
      });

      // Přidat příjemci
      await tx.user.update({
        where: { id: recipient.id },
        data: {
          [currency]: { increment: amount },
        },
      });

      // Zalogovat transakce
      await tx.moneyTx.createMany({
        data: [
          {
            userId: sender.id,
            amount: -amount,
            type: 'SPENT',
            reason: reason || `Transfer to ${recipient.name}`,
          },
          {
            userId: recipient.id,
            amount: amount,
            type: 'EARNED',
            reason: reason || `Transfer from ${sender.name}`,
          },
        ],
      });

      // Vytvořit notifikaci pro příjemce
      await tx.notification.create({
        data: {
          userId: recipient.id,
          type: 'SYSTEM',
          title: `${currency === 'gold' ? '💰' : '💎'} Obdržel jsi peníze!`,
          message: `${sender.name} ti poslal ${amount} ${currency === 'gold' ? 'gold' : 'gems'}`,
          data: {
            senderId: sender.id,
            amount,
            currency,
          },
        },
      });

      return { sender, recipient, amount, currency };
    });

    return NextResponse.json({
      success: true,
      message: `Transferred ${amount} ${currency} to ${recipient.name}`,
      transaction: result,
    });
  } catch (error) {
    console.error('Error transferring money:', error);
    return NextResponse.json(
      { error: 'Failed to transfer money' },
      { status: 500 }
    );
  }
}
