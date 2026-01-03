import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';

/**
 * DELETE /api/friends/[id]
 * Odstraní přátelství (unfriend)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const friendshipId = id;

    // Najdeme friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return NextResponse.json({ 
        error: 'Friendship not found' 
      }, { status: 404 });
    }

    // Ověříme, že uživatel je součástí tohoto přátelství
    if (friendship.userId1 !== userId && friendship.userId2 !== userId) {
      return NextResponse.json({ 
        error: 'You are not part of this friendship' 
      }, { status: 403 });
    }

    // Smažeme friendship
    await prisma.friendship.delete({
      where: { id: friendshipId }
    });

    return NextResponse.json({ 
      message: 'Friendship removed' 
    });

  } catch (error) {
    console.error('Error removing friendship:', error);
    return NextResponse.json({ 
      error: 'Failed to remove friendship' 
    }, { status: 500 });
  }
}
