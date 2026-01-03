import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';

/**
 * PATCH /api/friends/requests/[id]
 * Přijme nebo odmítne friend request
 */
export async function PATCH(
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
    const requestId = id;
    const body = await req.json();
    const { action } = body; // 'accept' nebo 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Use "accept" or "decline"' 
      }, { status: 400 });
    }

    // Najdeme friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!friendRequest) {
      return NextResponse.json({ 
        error: 'Friend request not found' 
      }, { status: 404 });
    }

    // Ověříme, že uživatel je příjemce requestu
    if (friendRequest.receiverId !== userId) {
      return NextResponse.json({ 
        error: 'You can only respond to requests sent to you' 
      }, { status: 403 });
    }

    // Ověříme, že request je stále PENDING
    if (friendRequest.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'This request has already been responded to' 
      }, { status: 400 });
    }

    if (action === 'accept') {
      // Přijmeme request a vytvoříme friendship
      const [updatedRequest, friendship] = await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date()
          }
        }),
        prisma.friendship.create({
          data: {
            userId1: friendRequest.senderId < friendRequest.receiverId 
              ? friendRequest.senderId 
              : friendRequest.receiverId,
            userId2: friendRequest.senderId < friendRequest.receiverId 
              ? friendRequest.receiverId 
              : friendRequest.senderId
          }
        }),
        // Vytvoříme notifikaci pro odesilatele
        prisma.notification.create({
          data: {
            userId: friendRequest.senderId,
            type: 'FRIEND_REQUEST_ACCEPTED',
            title: 'Friend Request Accepted',
            message: `${friendRequest.receiver.name} accepted your friend request!`,
            data: JSON.stringify({ friendId: userId })
          }
        })
      ]);

      return NextResponse.json({ 
        message: 'Friend request accepted',
        friendship 
      });

    } else {
      // Odmítneme request
      const updatedRequest = await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: {
            status: 'DECLINED',
            respondedAt: new Date()
          }
        }),
        // Volitelně: Vytvoříme notifikaci pro odesilatele (nebo ne, aby nedošlo k nepříjemným pocitům)
        // Zde ji nevytváříme
      ]);

      return NextResponse.json({ 
        message: 'Friend request declined' 
      });
    }

  } catch (error) {
    console.error('Error responding to friend request:', error);
    return NextResponse.json({ 
      error: 'Failed to respond to friend request' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/friends/requests/[id]
 * Zruší odeslaný friend request (pouze odesílatel může zrušit)
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
    const requestId = id;

    // Najdeme friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest) {
      return NextResponse.json({ 
        error: 'Friend request not found' 
      }, { status: 404 });
    }

    // Ověříme, že uživatel je odesílatel requestu
    if (friendRequest.senderId !== userId) {
      return NextResponse.json({ 
        error: 'You can only cancel requests you sent' 
      }, { status: 403 });
    }

    // Ověříme, že request je stále PENDING
    if (friendRequest.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'This request has already been responded to' 
      }, { status: 400 });
    }

    // Zrušíme request
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        respondedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Friend request cancelled' 
    });

  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel friend request' 
    }, { status: 500 });
  }
}
