import { prisma } from "@/app/lib/prisma"
import { ItemType } from "@/app/lib/generated"

export class UserProfileService {
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        badges: {
          where: { isPinned: true },
          include: {
            badge: true
          },
          take: 3
        },
        // Add other stats if needed (level, rank, etc.)
      }
    })

    if (!user) return null

    // Calculate level/rank if not stored directly (assuming leveling.ts logic)
    // For now, just return what we have
    return user
  }

  static async equipAvatar(userId: string, itemId: string) {
    // Verify ownership
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId,
        itemId,
        item: {
          type: ItemType.COSMETIC
        }
      },
      include: { item: true }
    })

    if (!purchase) {
      throw new Error("User does not own this avatar")
    }

    if (!purchase.item.imageUrl) {
      throw new Error("Item has no image URL")
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: purchase.item.imageUrl
      }
    })
  }
}
