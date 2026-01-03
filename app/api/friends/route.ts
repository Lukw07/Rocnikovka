import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';

/**
 * GET /api/friends
 * Vrací seznam přátel aktuálního uživatele
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Získáme friendshipy kde je uživatel buď jako user1 nebo user2
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: userId },
          { userId2: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            grade: true,
            classId: true,
            xpAudits: {
              select: {
                amount: true
              }
            }
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            grade: true,
            classId: true,
            xpAudits: {
              select: {
                amount: true
              }
            }
          }
        }
      }
    });

    // Transformujeme data, aby každý friend byl z pohledu aktuálního uživatele
    const friends = friendships.map(friendship => {
      const isFriend1 = friendship.userId1 === userId;
      const friendData = isFriend1 ? friendship.user2 : friendship.user1;
      
      // Vypočítáme celkové XP
      const totalXP = friendData.xpAudits.reduce((sum, audit) => sum + audit.amount, 0);
      
      return {
        id: friendData.id,
        name: friendData.name,
        email: friendData.email,
        avatarUrl: friendData.avatarUrl,
        role: friendData.role,
        grade: friendData.grade,
        classId: friendData.classId,
        totalXP,
        friendshipId: friendship.id,
        friendSince: friendship.createdAt
      };
    });

    return NextResponse.json({ 
      friends,
      count: friends.length 
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch friends' 
    }, { status: 500 });
  }
}
