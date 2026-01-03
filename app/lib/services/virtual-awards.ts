import { prisma } from "../prisma"
import { ItemRarity } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"

/**
 * Service pro správu virtuálních ocenění a trofejí
 * Automaticky uděluje trofeje za významné milníky
 */
export class VirtualAwardService {
  /**
   * Udělí virtuální trofej uživateli
   */
  static async awardTrophy(
    userId: string,
    data: {
      name: string
      icon: string
      rarity: ItemRarity
    },
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Zkontrolovat, zda uživatel trofej již nemá
      const existing = await prisma.virtualAward.findFirst({
        where: {
          userId,
          name: data.name,
        },
      })

      if (existing) {
        console.log(
          `[${reqId}] User ${sanitizeForLog(userId)} already has award: ${data.name}`
        )
        return existing
      }

      const award = await prisma.virtualAward.create({
        data: {
          userId,
          name: data.name,
          icon: data.icon,
          rarity: data.rarity,
        },
      })

      console.log(
        `[${reqId}] Awarded trophy "${data.name}" to user ${sanitizeForLog(userId)}`
      )

      return award
    } catch (error) {
      console.error(`[${reqId}] Error awarding trophy:`, error)
      throw error
    }
  }

  /**
   * Získá všechny trofeje uživatele
   */
  static async getUserAwards(userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      const awards = await prisma.virtualAward.findMany({
        where: { userId },
        orderBy: [
          { earnedAt: "desc" },
        ],
      })

      // Seskupit podle rarity
      const grouped = {
        LEGENDARY: awards.filter((a) => a.rarity === ItemRarity.LEGENDARY),
        EPIC: awards.filter((a) => a.rarity === ItemRarity.EPIC),
        RARE: awards.filter((a) => a.rarity === ItemRarity.RARE),
        UNCOMMON: awards.filter((a) => a.rarity === ItemRarity.UNCOMMON),
        COMMON: awards.filter((a) => a.rarity === ItemRarity.COMMON),
      }

      console.log(
        `[${reqId}] Retrieved ${awards.length} awards for user ${sanitizeForLog(userId)}`
      )

      return {
        all: awards,
        grouped,
        total: awards.length,
      }
    } catch (error) {
      console.error(`[${reqId}] Error getting user awards:`, error)
      throw error
    }
  }

  /**
   * Získá showcase - top trofeje pro zobrazení
   */
  static async getShowcase(userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      // Rarita priority: LEGENDARY > EPIC > RARE > UNCOMMON > COMMON
      const rarityPriority: Record<ItemRarity, number> = {
        LEGENDARY: 5,
        EPIC: 4,
        RARE: 3,
        UNCOMMON: 2,
        COMMON: 1,
      }

      const awards = await prisma.virtualAward.findMany({
        where: { userId },
        orderBy: { earnedAt: "desc" },
      })

      // Seřadit podle rarity a vzít top 6
      const sorted = awards.sort((a, b) => {
        const priorityDiff = rarityPriority[b.rarity] - rarityPriority[a.rarity]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
      })

      const showcase = sorted.slice(0, 6)

      console.log(
        `[${reqId}] Retrieved showcase with ${showcase.length} awards for user ${sanitizeForLog(
          userId
        )}`
      )

      return showcase
    } catch (error) {
      console.error(`[${reqId}] Error getting showcase:`, error)
      throw error
    }
  }

  /**
   * Automaticky kontroluje a uděluje trofeje za milníky
   */
  static async checkAndAwardMilestones(userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          skillPoints: true,
          reputation: true,
          questProgresses: {
            where: { status: "COMPLETED" },
          },
          personalGoals: {
            where: { status: "COMPLETED" },
          },
          achievementAwards: true,
          guildMembers: true,
          xpAudits: {
            select: { amount: true },
            orderBy: { createdAt: "desc" },
            take: 1000,
          },
        },
      })

      if (!user) return

      const milestones = []

      // Level milestones - calculate from total XP
      const totalXP = user.xpAudits?.reduce((sum, audit) => sum + audit.amount, 0) || 0
      const level = Math.floor(Math.sqrt(totalXP / 100)) || 1
      if (level >= 10) {
        milestones.push({
          name: "Začátečník X",
          icon: "🎓",
          rarity: ItemRarity.COMMON,
        })
      }
      if (level >= 25) {
        milestones.push({
          name: "Pokročilý Adept",
          icon: "⚔️",
          rarity: ItemRarity.UNCOMMON,
        })
      }
      if (level >= 50) {
        milestones.push({
          name: "Mistr RPG",
          icon: "👑",
          rarity: ItemRarity.RARE,
        })
      }
      if (level >= 75) {
        milestones.push({
          name: "Legendární Hrdina",
          icon: "🏆",
          rarity: ItemRarity.EPIC,
        })
      }
      if (level >= 100) {
        milestones.push({
          name: "EduRPG Bůh",
          icon: "⚡",
          rarity: ItemRarity.LEGENDARY,
        })
      }

      // Quest milestones
      const completedQuests = user.questProgresses.length
      if (completedQuests >= 5) {
        milestones.push({
          name: "Questový Začátečník",
          icon: "📜",
          rarity: ItemRarity.COMMON,
        })
      }
      if (completedQuests >= 25) {
        milestones.push({
          name: "Questový Veterán",
          icon: "🗡️",
          rarity: ItemRarity.RARE,
        })
      }
      if (completedQuests >= 50) {
        milestones.push({
          name: "Questový Mistr",
          icon: "🎖️",
          rarity: ItemRarity.EPIC,
        })
      }

      // Personal Goals milestones
      const completedGoals = user.personalGoals.length
      if (completedGoals >= 10) {
        milestones.push({
          name: "Cílový Střelec",
          icon: "🎯",
          rarity: ItemRarity.UNCOMMON,
        })
      }
      if (completedGoals >= 50) {
        milestones.push({
          name: "Cílový Sniper",
          icon: "🏹",
          rarity: ItemRarity.EPIC,
        })
      }

      // Reputation milestones
      const rep = user.reputation?.points || 0
      if (rep >= 1000) {
        milestones.push({
          name: "Respektovaný Student",
          icon: "🌟",
          rarity: ItemRarity.RARE,
        })
      }
      if (rep >= 5000) {
        milestones.push({
          name: "Školní Legenda",
          icon: "💫",
          rarity: ItemRarity.LEGENDARY,
        })
      }

      // Achievement milestones
      const achievements = user.achievementAwards.length
      if (achievements >= 10) {
        milestones.push({
          name: "Achievementový Lovec",
          icon: "🏅",
          rarity: ItemRarity.UNCOMMON,
        })
      }
      if (achievements >= 50) {
        milestones.push({
          name: "Achievementový Král",
          icon: "👑",
          rarity: ItemRarity.LEGENDARY,
        })
      }

      // Udělit nové trofeje
      for (const milestone of milestones) {
        await this.awardTrophy(userId, milestone, reqId)
      }

      console.log(
        `[${reqId}] Checked milestones for user ${sanitizeForLog(
          userId
        )} - ${milestones.length} potential awards`
      )

      return milestones
    } catch (error) {
      console.error(`[${reqId}] Error checking milestones:`, error)
      throw error
    }
  }
}
