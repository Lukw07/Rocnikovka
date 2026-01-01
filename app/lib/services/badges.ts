import { prisma } from "@/app/lib/prisma"
import { Badge, ItemRarity, Prisma } from "@/app/lib/generated"

export class BadgesService {
  static async getAllBadges() {
    return prisma.badge.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getBadgeById(id: string) {
    return prisma.badge.findUnique({
      where: { id }
    })
  }

  static async createBadge(data: Prisma.BadgeCreateInput) {
    return prisma.badge.create({
      data
    })
  }

  static async updateBadge(id: string, data: Prisma.BadgeUpdateInput) {
    return prisma.badge.update({
      where: { id },
      data
    })
  }

  static async deleteBadge(id: string) {
    return prisma.badge.delete({
      where: { id }
    })
  }

  static async awardBadgeToUser(userId: string, badgeId: string) {
    return prisma.userBadge.create({
      data: {
        userId,
        badgeId
      }
    })
  }

  static async removeBadgeFromUser(userId: string, badgeId: string) {
    return prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    })
  }

  static async awardBadgeToClass(classId: string, badgeId: string) {
    const students = await prisma.user.findMany({
      where: { classId }
    })

    const operations = students.map(student => 
      prisma.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId: student.id,
            badgeId
          }
        },
        create: {
          userId: student.id,
          badgeId
        },
        update: {}
      })
    )

    return prisma.$transaction(operations)
  }

  static async getUserBadges(userId: string) {
    return prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      }
    })
  }

  static async togglePinBadge(userId: string, badgeId: string) {
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    })

    if (!userBadge) {
      throw new Error("User does not own this badge")
    }

    // If we are trying to pin the badge (currently unpinned)
    if (!userBadge.isPinned) {
      const pinnedCount = await prisma.userBadge.count({
        where: {
          userId,
          isPinned: true
        }
      })

      if (pinnedCount >= 3) {
        throw new Error("You can only pin up to 3 badges")
      }
    }

    return prisma.userBadge.update({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      },
      data: {
        isPinned: !userBadge.isPinned
      }
    })
  }

  static async getBadgeStats(badgeId: string) {
    const totalUsers = await prisma.user.count({
        where: { role: 'STUDENT' } // Assuming we only care about students stats
    })
    const badgeCount = await prisma.userBadge.count({
      where: { badgeId }
    })

    return {
      totalUsers,
      badgeCount,
      percentage: totalUsers > 0 ? (badgeCount / totalUsers) * 100 : 0
    }
  }
}
