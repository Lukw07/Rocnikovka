import { prisma } from "../prisma"
import { GuildMemberRole, GuildJoinRequestStatus } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"
import { validateGuildName, validateGuildDescription, validateGuildMotto } from "../utils/moderation"

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
    const CREATION_COST = 100 // gold fee to found a guild

    return await prisma.$transaction(async (tx) => {
      // Check guild name doesn't exist
      const existing = await tx.guild.findUnique({
        where: { name: data.name }
      })

      if (existing) {
        throw new Error("Guild name already exists")
      }

      // Validate guild name, description, motto against profanity
      const nameVal = validateGuildName(data.name)
      if (!nameVal.valid) {
        throw new Error(nameVal.error || "Invalid guild name")
      }

      const descVal = validateGuildDescription(data.description)
      if (!descVal.valid) {
        throw new Error(descVal.error || "Invalid guild description")
      }

      const mottoVal = validateGuildMotto(data.motto)
      if (!mottoVal.valid) {
        throw new Error(mottoVal.error || "Invalid guild motto")
      }

      // Check leader has enough gold
      const leader = await tx.user.findUnique({
        where: { id: data.leaderId },
        select: { gold: true }
      })

      if (!leader) {
        throw new Error("Leader not found")
      }

      if (leader.gold < CREATION_COST) {
        throw new Error(`Potřebuješ ${CREATION_COST} gold pro založení guildy`)
      }

      // Deduct gold + log transaction
      await tx.user.update({
        where: { id: data.leaderId },
        data: { gold: { decrement: CREATION_COST } }
      })

      await tx.moneyTx.create({
        data: {
          userId: data.leaderId,
          amount: -CREATION_COST,
          type: "SPENT",
          reason: "Guild creation fee",
          requestId: reqId
        }
      })

      // Create guild
      const guild = await tx.guild.create({
        data: {
          name: data.name,
          description: data.description,
          motto: data.motto,
          logoUrl: data.logoUrl,
          isPublic: data.isPublic ?? true,
          maxMembers: Math.min(data.maxMembers ?? 10, 10), // Cap at 10 members
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
          metadata: { guildId: guild.id, goldCost: CREATION_COST }
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
   * Get user's guild
   */
  static async getUserGuild(userId: string) {
    const member = await prisma.guildMember.findFirst({
      where: { userId },
      include: {
        guild: {
          include: {
            members: {
              where: {
                user: {
                  isNot: null
                }
              },
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
        }
      }
    })
    return member?.guild || null
  }

  /**
   * Get guild details
   */
  static async getGuildDetails(guildId: string) {
    return await prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        members: {
          where: {
            user: {
              isNot: null
            }
          },
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

      // Block joining private guilds unless a dedicated invite/approval flow exists
      if (!guild.isPublic) {
        throw new Error("Guild is private")
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
   * Request to join a guild (used for private guilds)
   */
  static async requestJoin(guildId: string, userId: string, message?: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      // Validate user exists
      const user = await tx.user.findUnique({ where: { id: userId } })
      if (!user) {
        throw new Error("User not found")
      }

      const guild = await tx.guild.findUnique({ where: { id: guildId } })

      if (!guild) {
        throw new Error("Guild not found")
      }

      if (guild.memberCount >= guild.maxMembers) {
        throw new Error("Guild is full")
      }

      const existingMember = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId, guildId }
        }
      })

      if (existingMember) {
        throw new Error("Already a guild member")
      }

      const pending = await tx.guildJoinRequest.findFirst({
        where: { guildId, userId, status: GuildJoinRequestStatus.PENDING }
      })

      if (pending) {
        return pending
      }

      const request = await tx.guildJoinRequest.create({
        data: {
          guildId,
          userId,
          message,
          status: GuildJoinRequestStatus.PENDING
        }
      })

      await tx.guildActivity.create({
        data: {
          guildId,
          userId,
          action: "join_request",
          details: message
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Guild join request created: guild=${guildId} user=${userId}`),
          userId,
          requestId: reqId,
          metadata: { guildId }
        }
      })

      return request
    })
  }

  /**
   * Approve a join request (leader/officer)
   */
  static async approveJoinRequest(guildId: string, requestId: string, approverId: string, requestIdOverride?: string) {
    const reqId = requestIdOverride || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const approver = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId: approverId, guildId }
        }
      })

      if (!approver || (approver.role !== GuildMemberRole.LEADER && approver.role !== GuildMemberRole.OFFICER)) {
        throw new Error("Insufficient permissions")
      }

      const joinRequest = await tx.guildJoinRequest.findUnique({
        where: { id: requestId }
      })

      if (!joinRequest || joinRequest.guildId !== guildId) {
        throw new Error("Join request not found")
      }

      if (joinRequest.status !== GuildJoinRequestStatus.PENDING) {
        throw new Error("Join request already processed")
      }

      const guild = await tx.guild.findUnique({ where: { id: guildId } })

      if (!guild) {
        throw new Error("Guild not found")
      }

      if (guild.memberCount >= guild.maxMembers) {
        throw new Error("Guild is full")
      }

      const existingMember = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId: joinRequest.userId, guildId }
        }
      })

      if (existingMember) {
        throw new Error("Already a guild member")
      }

      await tx.guildMember.create({
        data: {
          userId: joinRequest.userId,
          guildId,
          role: GuildMemberRole.MEMBER
        }
      })

      await tx.guild.update({
        where: { id: guildId },
        data: { memberCount: { increment: 1 } }
      })

      const updatedRequest = await tx.guildJoinRequest.update({
        where: { id: requestId },
        data: {
          status: GuildJoinRequestStatus.APPROVED,
          decidedAt: new Date(),
          decidedBy: approverId
        }
      })

      await tx.guildActivity.create({
        data: {
          guildId,
          userId: joinRequest.userId,
          action: "member_joined",
          details: "Approved join request"
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Join request approved: ${requestId}`),
          userId: approverId,
          requestId: reqId,
          metadata: { guildId, joinRequestId: requestId }
        }
      })

      return updatedRequest
    })
  }

  /**
   * Reject a join request (leader/officer)
   */
  static async rejectJoinRequest(guildId: string, requestId: string, approverId: string, reason?: string, requestIdOverride?: string) {
    const reqId = requestIdOverride || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const approver = await tx.guildMember.findUnique({
        where: {
          userId_guildId: { userId: approverId, guildId }
        }
      })

      if (!approver || (approver.role !== GuildMemberRole.LEADER && approver.role !== GuildMemberRole.OFFICER)) {
        throw new Error("Insufficient permissions")
      }

      const joinRequest = await tx.guildJoinRequest.findUnique({
        where: { id: requestId }
      })

      if (!joinRequest || joinRequest.guildId !== guildId) {
        throw new Error("Join request not found")
      }

      if (joinRequest.status !== GuildJoinRequestStatus.PENDING) {
        throw new Error("Join request already processed")
      }

      const updatedRequest = await tx.guildJoinRequest.update({
        where: { id: requestId },
        data: {
          status: GuildJoinRequestStatus.REJECTED,
          decidedAt: new Date(),
          decidedBy: approverId,
          message: reason ?? joinRequest.message
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Join request rejected: ${requestId}`),
          userId: approverId,
          requestId: reqId,
          metadata: { guildId, joinRequestId: requestId }
        }
      })

      return updatedRequest
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

      // Check if guild leader
      if (member.role === GuildMemberRole.LEADER) {
        // Count how many leaders exist
        const leaderCount = await tx.guildMember.count({
          where: {
            guildId,
            role: GuildMemberRole.LEADER
          }
        })

        // If this is the only leader, they cannot leave
        if (leaderCount === 1) {
          throw new Error("Jako poslední vůdce nemůžeš opustit guildu. Nejdřív přenes vedení na někoho jiného.")
        }
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
      where: { 
        guildId,
        user: {
          isNot: null
        }
      },
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