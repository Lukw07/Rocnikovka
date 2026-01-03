import { prisma } from "../prisma"
import { GuildMemberRole } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"

/**
 * Service for managing guilds and guild membership
 */
export class GuildService {
  /**
   * Create a new guild
   */
  static async createGuild(data: {
    name: string
    description?: string
    motto?: string
    logoUrl?: string
    isPublic?: boolean
    maxMembers?: number
    leaderId: string
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      // Check guild name doesn't exist
      const existing = await tx.guild.findUnique({
        where: { name: data.name }
      })

      if (existing) {
        throw new Error("Guild name already exists")
      }

      // Create guild
      const guild = await tx.guild.create({
        data: {
          name: data.name,
          description: data.description,
          motto: data.motto,
          logoUrl: data.logoUrl,
          isPublic: data.isPublic ?? true,
          maxMembers: data.maxMembers ?? 10,
          leaderId: data.leaderId,
          treasury: 0,
          xp: 0,
          memberCount: 1
        }
      })

      // Add leader as member
      await tx.guildMember.create({
        data: {
          userId: data.leaderId,
          guildId: guild.id,
          role: GuildMemberRole.LEADER
        }
      })

      // Create default benefits
      await this.createDefaultBenefits(guild.id, tx)

      // Log
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Guild created: ${data.name}`),
          userId: data.leaderId,
          requestId: reqId,
          metadata: { guildId: guild.id }
        }
      })

      return guild
    })
  }

  /**
   * Get all guilds
   */
  static async getAllGuilds() {
    return await prisma.guild.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  }

  /**
   * Get guild details
   */
  static async getGuildDetails(guildId: string) {
    return await prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        activities: {
          take: 50,
          orderBy: { createdAt: "desc" }
        }
      }
    })
  }

  /**
   * Join a guild
   */
  static async joinGuild(guildId: string, userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      // Check guild exists
      const guild = await tx.guild.findUnique({
        where: { id: guildId }
      })

      if (!guild) {
        throw new Error("Guild not found")
      }

      // Check not already member
      const existing = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (existing) {
        throw new Error("Already a guild member")
      }

      // Add member
      const member = await tx.guildMember.create({
        data: {
          userId,
          guildId,
          role: GuildMemberRole.MEMBER
        }
      })

      // Update member count
      await tx.guild.update({
        where: { id: guildId },
        data: { memberCount: { increment: 1 } }
      })

      // Log activity
      await tx.guildActivity.create({
        data: {
          guildId,
          userId,
          action: "member_joined"
        }
      })

      return member
    })
  }

  /**
   * Leave a guild
   */
  static async leaveGuild(guildId: string, userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const member = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (!member) {
        throw new Error("Not a guild member")
      }

      // Check if guild leader - can't leave if leader
      if (member.role === GuildMemberRole.LEADER) {
        throw new Error("Guild leader cannot leave")
      }

      // Remove member
      await tx.guildMember.delete({
        where: { id: member.id }
      })

      // Update member count
      await tx.guild.update({
        where: { id: guildId },
        data: { memberCount: { decrement: 1 } }
      })

      return member
    })
  }

  /**
   * Add XP to guild treasury (from member activities)
   */
  static async addToTreasury(guildId: string, amount: number, source: string) {
    return await prisma.guild.update({
      where: { id: guildId },
      data: { treasury: { increment: amount } }
    })
  }

  /**
   * Get guild members
   */
  static async getGuildMembers(guildId: string) {
    return await prisma.guildMember.findMany({
      where: { guildId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            reputation: true
          }
        }
      },
      orderBy: { role: "asc" }
    })
  }

  /**
   * Change member role (officers/leader only)
   */
  static async changeMemberRole(
    guildId: string,
    targetUserId: string,
    newRole: GuildMemberRole,
    actorId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Verify actor is officer or leader
      const actor = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId: actorId, guildId }
        }
      })

      if (!actor || (actor.role !== GuildMemberRole.LEADER && actor.role !== GuildMemberRole.OFFICER)) {
        throw new Error("Insufficient permissions")
      }

      // Update target member
      return await tx.guildMember.update({
        where: {
          userId_guildId: { userId: targetUserId, guildId }
        },
        data: { role: newRole }
      })
    })
  }

  /**
   * Update guild (leader/officer only)
   */
  static async updateGuild(
    guildId: string,
    data: {
      description?: string
      motto?: string
      logoUrl?: string
      isPublic?: boolean
      maxMembers?: number
    },
    userId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Check permissions
      const member = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (!member || (member.role !== GuildMemberRole.LEADER && member.role !== GuildMemberRole.OFFICER)) {
        throw new Error("Insufficient permissions")
      }

      return await tx.guild.update({
        where: { id: guildId },
        data
      })
    })
  }

  /**
   * Delete guild (leader only)
   */
  static async deleteGuild(guildId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const member = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (!member || member.role !== GuildMemberRole.LEADER) {
        throw new Error("Only guild leader can delete guild")
      }

      await tx.guild.delete({
        where: { id: guildId }
      })
    })
  }

  /**
   * Get chat messages
   */
  static async getChatMessages(guildId: string, limit: number = 50) {
    return await prisma.guildChatMessage.findMany({
      where: { guildId },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })
  }

  /**
   * Send chat message
   */
  static async sendChatMessage(
    guildId: string,
    userId: string,
    content: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Check member exists
      const member = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (!member) {
        throw new Error("Not a guild member")
      }

      return await tx.guildChatMessage.create({
        data: {
          guildId,
          memberId: member.id,
          content
        },
        include: {
          member: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      })
    })
  }

  /**
   * Get guild benefits
   */
  static async getGuildBenefits(guildId: string) {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { level: true }
    })

    if (!guild) {
      throw new Error("Guild not found")
    }

    return await prisma.guildBenefit.findMany({
      where: {
        guildId,
        requiredLevel: { lte: guild.level },
        isActive: true
      },
      orderBy: { requiredLevel: "asc" }
    })
  }

  /**
   * Contribute money to guild treasury
   */
  static async contributeMoney(
    guildId: string,
    userId: string,
    amount: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // Check member exists
      const member = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (!member) {
        throw new Error("Not a guild member")
      }

      // Check user has enough money
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true }
      })

      if (!user) {
        throw new Error("User not found")
      }

      // Deduct from user (via MoneyTx)
      await tx.moneyTx.create({
        data: {
          userId,
          amount: -amount,
          type: "SPENT",
          reason: "Guild treasury contribution"
        }
      })

      // Add to guild treasury
      await tx.guild.update({
        where: { id: guildId },
        data: { treasury: { increment: amount } }
      })

      // Update member contribution
      await tx.guildMember.update({
        where: { id: member.id },
        data: { contributedMoney: { increment: amount } }
      })

      // Log activity
      await tx.guildActivity.create({
        data: {
          guildId,
          userId,
          action: "treasure_contribution",
          details: `Contributed ${amount} coins`
        }
      })

      return {
        success: true,
        amount,
        newTreasury: (await tx.guild.findUnique({
          where: { id: guildId },
          select: { treasury: true }
        }))?.treasury || 0
      }
    })
  }

  /**
   * Add XP to guild (from member activities)
   */
  static async addGuildXP(
    guildId: string,
    userId: string,
    xpAmount: number,
    source: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const member = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (!member) return

      // Update member contribution
      await tx.guildMember.update({
        where: { id: member.id },
        data: { contributedXP: { increment: xpAmount } }
      })

      // Add XP to guild
      const guild = await tx.guild.update({
        where: { id: guildId },
        data: { xp: { increment: xpAmount } }
      })

      // Check for level up (every 1000 XP = 1 level)
      const newLevel = Math.floor(guild.xp / 1000) + 1
      if (newLevel > guild.level) {
        await tx.guild.update({
          where: { id: guildId },
          data: { level: newLevel }
        })

        await tx.guildActivity.create({
          data: {
            guildId,
            userId,
            action: "level_up",
            details: `Guild reached level ${newLevel}!`
          }
        })
      }
    })
  }

  /**
   * Create default benefits for new guild
   */
  private static async createDefaultBenefits(guildId: string, tx: any) {
    const benefits = [
      {
        name: "XP Boost I",
        description: "+5% XP from all sources",
        benefitType: "XP_BOOST",
        value: 5,
        requiredLevel: 1
      },
      {
        name: "Shop Discount I",
        description: "5% discount in shop",
        benefitType: "SHOP_DISCOUNT",
        value: 5,
        requiredLevel: 2
      },
      {
        name: "Quest Bonus I",
        description: "+10% quest rewards",
        benefitType: "QUEST_BONUS",
        value: 10,
        requiredLevel: 3
      },
      {
        name: "XP Boost II",
        description: "+10% XP from all sources",
        benefitType: "XP_BOOST",
        value: 10,
        requiredLevel: 5
      },
      {
        name: "Money Boost",
        description: "+15% money from all sources",
        benefitType: "MONEY_BOOST",
        value: 15,
        requiredLevel: 7
      },
      {
        name: "Shop Discount II",
        description: "10% discount in shop",
        benefitType: "SHOP_DISCOUNT",
        value: 10,
        requiredLevel: 10
      }
    ]

    for (const benefit of benefits) {
      await tx.guildBenefit.create({
        data: {
          ...benefit,
          guildId
        }
      })
    }
  }

  /**
   * Calculate total bonus for a user from their guild benefits
   */
  static async calculateGuildBonus(
    userId: string,
    bonusType: "XP_BOOST" | "MONEY_BOOST" | "QUEST_BONUS" | "SHOP_DISCOUNT"
  ): Promise<number> {
    try {
      // Find user's guild
      const guildMember = await prisma.guildMember.findFirst({
        where: { userId },
        include: {
          guild: {
            include: {
              benefits: {
                where: {
                  benefitType: bonusType,
                  isActive: true
                }
              }
            }
          }
        }
      })

      if (!guildMember) return 0

      // Sum all active benefits of this type that the guild has unlocked
      const totalBonus = guildMember.guild.benefits
        .filter(b => b.requiredLevel <= guildMember.guild.level)
        .reduce((sum, benefit) => sum + benefit.value, 0)

      return totalBonus
    } catch (error) {
      console.error("Error calculating guild bonus:", error)
      return 0
    }
  }

  /**
   * Apply guild bonus to an amount
   */
  static async applyGuildBonus(
    userId: string,
    baseAmount: number,
    bonusType: "XP_BOOST" | "MONEY_BOOST" | "QUEST_BONUS" | "SHOP_DISCOUNT"
  ): Promise<number> {
    const bonusPercent = await this.calculateGuildBonus(userId, bonusType)
    if (bonusPercent === 0) return baseAmount

    const bonusAmount = Math.floor(baseAmount * (bonusPercent / 100))
    return baseAmount + bonusAmount
  }}