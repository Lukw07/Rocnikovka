import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';

/**
 * GET /api/friends/search
 * Vyhledá uživatele podle jména nebo emailu
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (query.length < 2) {
      return NextResponse.json({ 
        error: 'Search query must be at least 2 characters' 
      }, { status: 400 });
    }

    // Vyhledáme uživatele podle jména nebo emailu
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
          { id: { not: userId } } // Nevracíme sebe
        ]
      },
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
      },
      take: limit
    });

    // Pro každého uživatele zkontrolujeme vztah s aktuálním uživatelem
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        // Zkontrolujeme, zda jsou již přátelé
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId1: userId, userId2: user.id },
              { userId1: user.id, userId2: userId }
            ]
          }
        });

        if (friendship) {
          return {
            ...user,
            totalXP: user.xpAudits.reduce((sum, audit) => sum + audit.amount, 0),
            relationshipStatus: 'FRIENDS' as const,
            friendshipId: friendship.id
          };
        }

        // Zkontrolujeme pending friend requests
        const sentRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: userId,
            receiverId: user.id,
            status: 'PENDING'
          }
        });

        if (sentRequest) {
          return {
            ...user,
            totalXP: user.xpAudits.reduce((sum, audit) => sum + audit.amount, 0),
            relationshipStatus: 'REQUEST_SENT' as const,
            requestId: sentRequest.id
          };
        }

        const receivedRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: user.id,
            receiverId: userId,
            status: 'PENDING'
          }
        });

        if (receivedRequest) {
          return {
            ...user,
            totalXP: user.xpAudits.reduce((sum, audit) => sum + audit.amount, 0),
            relationshipStatus: 'REQUEST_RECEIVED' as const,
            requestId: receivedRequest.id
          };
        }

        // Žádný vztah
        return {
          ...user,
          totalXP: user.xpAudits.reduce((sum, audit) => sum + audit.amount, 0),
          relationshipStatus: 'NONE' as const
        };
      })
    );

    // Odstraníme xpAudits z výsledků (již máme totalXP)
    const cleanedUsers = usersWithStatus.map(({ xpAudits, ...user }) => user);

    return NextResponse.json({ 
      users: cleanedUsers,
      count: cleanedUsers.length,
      query 
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ 
      error: 'Failed to search users' 
    }, { status: 500 });
  }
}
