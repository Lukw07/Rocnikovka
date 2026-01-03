import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';

/**
 * GET /api/friends/requests
 * Vrací friend requests - jak odeslané, tak přijaté
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'sent', 'received', 'all'

    const whereConditions: any = {
      status: 'PENDING'
    };

    if (type === 'sent') {
      whereConditions.senderId = userId;
    } else if (type === 'received') {
      whereConditions.receiverId = userId;
    } else {
      // 'all' - obě směry
      whereConditions.OR = [
        { senderId: userId },
        { receiverId: userId }
      ];
    }

    const requests = await prisma.friendRequest.findMany({
      where: whereConditions,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            grade: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            grade: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      requests,
      count: requests.length 
    });

  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch friend requests' 
    }, { status: 500 });
  }
}

/**
 * POST /api/friends/requests
 * Vytvoří nový friend request
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const senderId = session.user.id;
    const body = await req.json();
    const { receiverId, message } = body;

    if (!receiverId) {
      return NextResponse.json({ 
        error: 'Receiver ID is required' 
      }, { status: 400 });
    }

    // Nemohu poslat request sám sobě
    if (senderId === receiverId) {
      return NextResponse.json({ 
        error: 'Cannot send friend request to yourself' 
      }, { status: 400 });
    }

    // Zkontrolujeme, zda příjemce existuje
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Zkontrolujeme, zda již nejsou přátelé
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: senderId, userId2: receiverId },
          { userId1: receiverId, userId2: senderId }
        ]
      }
    });

    if (existingFriendship) {
      return NextResponse.json({ 
        error: 'Already friends' 
      }, { status: 400 });
    }

    // Zkontrolujeme, zda již neexistuje pending request v obou směrech
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'PENDING' },
          { senderId: receiverId, receiverId: senderId, status: 'PENDING' }
        ]
      }
    });

    if (existingRequest) {
      // Pokud má příjemce již poslaný request k odesilateli, můžeme ho rovnou přijmout
      if (existingRequest.senderId === receiverId && existingRequest.receiverId === senderId) {
        // Automaticky přijmeme - uživatel chce být přítelem s někým, kdo mu již poslal request
        await prisma.$transaction([
          // Označíme existující request jako přijatý
          prisma.friendRequest.update({
            where: { id: existingRequest.id },
            data: {
              status: 'ACCEPTED',
              respondedAt: new Date()
            }
          }),
          // Vytvoříme friendship
          prisma.friendship.create({
            data: {
              userId1: senderId < receiverId ? senderId : receiverId,
              userId2: senderId < receiverId ? receiverId : senderId
            }
          }),
          // Vytvoříme notifikace pro oba uživatele
          prisma.notification.create({
            data: {
              userId: receiverId,
              type: 'FRIEND_REQUEST_ACCEPTED',
              title: 'Friend Request Accepted',
              message: `${session.user.name} accepted your friend request!`,
              data: JSON.stringify({ friendId: senderId })
            }
          })
        ]);

        return NextResponse.json({ 
          message: 'Friend request automatically accepted',
          autoAccepted: true
        }, { status: 201 });
      }

      return NextResponse.json({ 
        error: 'Friend request already exists' 
      }, { status: 400 });
    }

    // Vytvoříme nový friend request
    const friendRequest = await prisma.$transaction([
      prisma.friendRequest.create({
        data: {
          senderId,
          receiverId,
          message,
          status: 'PENDING'
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      }),
      // Vytvoříme notifikaci pro příjemce
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'FRIEND_REQUEST',
          title: 'New Friend Request',
          message: `${session.user.name} sent you a friend request`,
          data: JSON.stringify({ senderId, message })
        }
      })
    ]);

    return NextResponse.json({ 
      request: friendRequest[0],
      message: 'Friend request sent successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json({ 
      error: 'Failed to create friend request' 
    }, { status: 500 });
  }
}
