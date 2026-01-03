'use server';

import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Získá seznam přátel aktuálního uživatele
 */
export async function getFriends() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;

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

    const friends = friendships.map(friendship => {
      const isFriend1 = friendship.userId1 === userId;
      const friendData = isFriend1 ? friendship.user2 : friendship.user1;
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
        friendSince: friendship.createdAt.toISOString()
      };
    });

    return { success: true, friends };
  } catch (error: any) {
    console.error('Error getting friends:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Získá friend requests (odeslané i přijaté)
 */
export async function getFriendRequests(type: 'sent' | 'received' | 'all' = 'all') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;

    const whereConditions: any = {
      status: 'PENDING'
    };

    if (type === 'sent') {
      whereConditions.senderId = userId;
    } else if (type === 'received') {
      whereConditions.receiverId = userId;
    } else {
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

    return { success: true, requests };
  } catch (error: any) {
    console.error('Error getting friend requests:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Pošle friend request
 */
export async function sendFriendRequest(receiverId: string, message?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const senderId = session.user.id;

    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Zkontrolujeme, zda příjemce existuje
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      throw new Error('User not found');
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
      throw new Error('Already friends');
    }

    // Zkontrolujeme pending request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'PENDING' },
          { senderId: receiverId, receiverId: senderId, status: 'PENDING' }
        ]
      }
    });

    if (existingRequest) {
      // Pokud má příjemce již poslaný request, automaticky přijmeme
      if (existingRequest.senderId === receiverId && existingRequest.receiverId === senderId) {
        await prisma.$transaction([
          prisma.friendRequest.update({
            where: { id: existingRequest.id },
            data: {
              status: 'ACCEPTED',
              respondedAt: new Date()
            }
          }),
          prisma.friendship.create({
            data: {
              userId1: senderId < receiverId ? senderId : receiverId,
              userId2: senderId < receiverId ? receiverId : senderId
            }
          }),
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

        revalidatePath('/dashboard/friends');
        return { success: true, autoAccepted: true };
      }

      throw new Error('Friend request already exists');
    }

    // Vytvoříme nový friend request
    const friendRequest = await prisma.$transaction([
      prisma.friendRequest.create({
        data: {
          senderId,
          receiverId,
          message,
          status: 'PENDING'
        }
      }),
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

    revalidatePath('/dashboard/friends');
    return { success: true, request: friendRequest[0] };
  } catch (error: any) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Přijme friend request
 */
export async function acceptFriendRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    if (friendRequest.receiverId !== userId) {
      throw new Error('You can only respond to requests sent to you');
    }

    if (friendRequest.status !== 'PENDING') {
      throw new Error('This request has already been responded to');
    }

    await prisma.$transaction([
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

    revalidatePath('/dashboard/friends');
    return { success: true };
  } catch (error: any) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Odmítne friend request
 */
export async function declineFriendRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    if (friendRequest.receiverId !== userId) {
      throw new Error('You can only respond to requests sent to you');
    }

    if (friendRequest.status !== 'PENDING') {
      throw new Error('This request has already been responded to');
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date()
      }
    });

    revalidatePath('/dashboard/friends');
    return { success: true };
  } catch (error: any) {
    console.error('Error declining friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Zruší odeslaný friend request
 */
export async function cancelFriendRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    if (friendRequest.senderId !== userId) {
      throw new Error('You can only cancel requests you sent');
    }

    if (friendRequest.status !== 'PENDING') {
      throw new Error('This request has already been responded to');
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        respondedAt: new Date()
      }
    });

    revalidatePath('/dashboard/friends');
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Odstraní přátelství
 */
export async function removeFriend(friendshipId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      throw new Error('Friendship not found');
    }

    if (friendship.userId1 !== userId && friendship.userId2 !== userId) {
      throw new Error('You are not part of this friendship');
    }

    await prisma.friendship.delete({
      where: { id: friendshipId }
    });

    revalidatePath('/dashboard/friends');
    return { success: true };
  } catch (error: any) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Vyhledá uživatele
 */
export async function searchUsers(query: string, limit: number = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;

    if (query.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
          { id: { not: userId } }
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

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
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

        return {
          ...user,
          totalXP: user.xpAudits.reduce((sum, audit) => sum + audit.amount, 0),
          relationshipStatus: 'NONE' as const
        };
      })
    );

    const cleanedUsers = usersWithStatus.map(({ xpAudits, ...user }) => user);

    return { success: true, users: cleanedUsers };
  } catch (error: any) {
    console.error('Error searching users:', error);
    return { success: false, error: error.message };
  }
}
