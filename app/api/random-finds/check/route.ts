import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/random-finds/check
 * Zkontroluje, zda může uživatel najít další item
 */
export async function GET(req: NextRequest) {
  try {
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

    const cooldown = await prisma.randomFindCooldown.findUnique({
      where: { userId: user.id },
    });

    const now = new Date();
    
    if (!cooldown) {
      // První náhodný nález - může hned
      return NextResponse.json({
        canFind: true,
        findsToday: 0,
        dailyLimit: 5,
        nextAvailableAt: null,
      });
    }

    const canFind = cooldown.nextAvailableAt <= now && 
                    cooldown.findsToday < cooldown.dailyLimit;

    return NextResponse.json({
      canFind,
      findsToday: cooldown.findsToday,
      dailyLimit: cooldown.dailyLimit,
      nextAvailableAt: cooldown.nextAvailableAt,
      timeUntilNext: cooldown.nextAvailableAt.getTime() - now.getTime(),
    });
  } catch (error) {
    console.error('Error checking find cooldown:', error);
    return NextResponse.json(
      { error: 'Failed to check cooldown' },
      { status: 500 }
    );
  }
}
