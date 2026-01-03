/**
 * Real-Life Rewards Service
 * Manages physical rewards that students can claim for in-game currency
 */

import { prisma } from "@/app/lib/db"
import { RewardCategory, ClaimStatus, UserRole } from "@/app/lib/generated"
import { generateRequestId, sanitizeForLog } from "@/app/lib/utils"

export class RealRewardsService {
  /**
   * Create a new real-life reward
   * Only teachers and operators can create rewards
   */
  static async createReward(data: {
    name: string
    description: string
    category: RewardCategory
    imageUrl?: string
    goldPrice?: number
    gemsPrice?: number
    levelRequired?: number
    totalStock: number
    isLimited?: boolean
    availableFrom?: Date
    availableTo?: Date
    isFeatured?: boolean
    priority?: number
    createdBy: string
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const reward = await tx.realLifeReward.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          imageUrl: data.imageUrl,
          goldPrice: data.goldPrice || 0,
          gemsPrice: data.gemsPrice || 0,
          levelRequired: data.levelRequired || 0,
          totalStock: data.totalStock,
          availableStock: data.totalStock,
          isLimited: data.isLimited ?? true,
          availableFrom: data.availableFrom,
          availableTo: data.availableTo,
          isFeatured: data.isFeatured || false,
          priority: data.priority || 0,
          createdBy: data.createdBy,
          isActive: true
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Real reward created: ${data.name}`),
          userId: data.createdBy,
          requestId: reqId,
          metadata: {
            rewardId: reward.id,
            category: data.category,
            goldPrice: data.goldPrice,
            totalStock: data.totalStock
          }
        }
      })

      return reward
    })
  }

  /**
   * Get all available rewards for students
   * Filters by availability, stock, and student level
   */
  static async getAvailableRewards(studentId?: string) {
    const now = new Date()
    
    const where: any = {
      isActive: true,
      availableStock: { gt: 0 },
      OR: [
        { availableFrom: null },
        { availableFrom: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { availableTo: null },
            { availableTo: { gte: now } }
          ]
        }
      ]
    }

    // If student ID provided, filter by their level
    if (studentId) {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          xpAudits: {
            select: { amount: true }
          }
        }
      })

      if (student) {
        const totalXP = student.xpAudits.reduce((sum, audit) => sum + audit.amount, 0)
        const level = this.calculateLevel(totalXP)
        
        where.levelRequired = { lte: level }
      }
    }

    return await prisma.realLifeReward.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { priority: "desc" },
        { createdAt: "desc" }
      ]
    })
  }

  /**
   * Get all rewards (for admin/teacher management)
   */
  static async getAllRewards(filters?: {
    category?: RewardCategory
    isActive?: boolean
    isFeatured?: boolean
  }) {
    return await prisma.realLifeReward.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured })
      },
      include: {
        claims: {
          include: {
            reward: true
          }
        }
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ]
    })
  }

  /**
   * Claim a reward - student requests to receive a real-life reward
   */
  static async claimReward(data: {
    userId: string
    rewardId: string
    studentNote?: string
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      // Get reward and check availability
      const reward = await tx.realLifeReward.findUnique({
        where: { id: data.rewardId }
      })

      if (!reward) {
        throw new Error("Reward not found")
      }

      if (!reward.isActive) {
        throw new Error("Reward is not active")
      }

      if (reward.availableStock <= 0) {
        throw new Error("Reward is out of stock")
      }

      // Check time availability
      const now = new Date()
      if (reward.availableFrom && reward.availableFrom > now) {
        throw new Error("Reward is not yet available")
      }
      if (reward.availableTo && reward.availableTo < now) {
        throw new Error("Reward has expired")
      }

      // Get student and check level requirement
      const student = await tx.user.findUnique({
        where: { id: data.userId },
        include: {
          xpAudits: {
            select: { amount: true }
          }
        }
      })

      if (!student) {
        throw new Error("Student not found")
      }

      const totalXP = student.xpAudits.reduce((sum, audit) => sum + audit.amount, 0)
      const level = this.calculateLevel(totalXP)

      if (level < reward.levelRequired) {
        throw new Error(`Level ${reward.levelRequired} required`)
      }

      // Check if student has enough currency
      if (reward.goldPrice > 0 && student.gold < reward.goldPrice) {
        throw new Error("Insufficient gold")
      }
      if (reward.gemsPrice > 0 && student.gems < reward.gemsPrice) {
        throw new Error("Insufficient gems")
      }

      // Deduct currency from student
      if (reward.goldPrice > 0) {
        await tx.user.update({
          where: { id: data.userId },
          data: { gold: { decrement: reward.goldPrice } }
        })

        await tx.moneyTx.create({
          data: {
            userId: data.userId,
            amount: -reward.goldPrice,
            type: "SPENT",
            reason: `Claimed real reward: ${reward.name}`,
            requestId: reqId
          }
        })
      }

      if (reward.gemsPrice > 0) {
        await tx.user.update({
          where: { id: data.userId },
          data: { gems: { decrement: reward.gemsPrice } }
        })

        await tx.moneyTx.create({
          data: {
            userId: data.userId,
            amount: -reward.gemsPrice,
            type: "SPENT",
            reason: `Claimed real reward (gems): ${reward.name}`,
            requestId: reqId
          }
        })
      }

      // Decrease available stock
      await tx.realLifeReward.update({
        where: { id: data.rewardId },
        data: { availableStock: { decrement: 1 } }
      })

      // Create claim
      const claim = await tx.rewardClaim.create({
        data: {
          userId: data.userId,
          rewardId: data.rewardId,
          status: ClaimStatus.PENDING,
          goldPaid: reward.goldPrice,
          gemsPaid: reward.gemsPrice,
          studentNote: data.studentNote
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Reward claimed: ${reward.name} by student ${student.name}`),
          userId: data.userId,
          requestId: reqId,
          metadata: {
            claimId: claim.id,
            rewardId: reward.id,
            goldPaid: reward.goldPrice,
            gemsPaid: reward.gemsPrice
          }
        }
      })

      return claim
    })
  }

  /**
   * Approve a reward claim (teacher/admin)
   */
  static async approveClaim(data: {
    claimId: string
    approvedBy: string
    adminNote?: string
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const claim = await tx.rewardClaim.findUnique({
        where: { id: data.claimId },
        include: { reward: true }
      })

      if (!claim) {
        throw new Error("Claim not found")
      }

      if (claim.status !== ClaimStatus.PENDING) {
        throw new Error("Claim is not pending")
      }

      const updatedClaim = await tx.rewardClaim.update({
        where: { id: data.claimId },
        data: {
          status: ClaimStatus.APPROVED,
          approvedBy: data.approvedBy,
          approvedAt: new Date(),
          adminNote: data.adminNote
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Reward claim approved: ${claim.reward.name}`),
          userId: data.approvedBy,
          requestId: reqId,
          metadata: {
            claimId: claim.id,
            studentId: claim.userId
          }
        }
      })

      return updatedClaim
    })
  }

  /**
   * Reject a reward claim
   */
  static async rejectClaim(data: {
    claimId: string
    approvedBy: string
    rejectedReason: string
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const claim = await tx.rewardClaim.findUnique({
        where: { id: data.claimId },
        include: { reward: true }
      })

      if (!claim) {
        throw new Error("Claim not found")
      }

      if (claim.status !== ClaimStatus.PENDING) {
        throw new Error("Claim is not pending")
      }

      // Refund the currency to student
      if (claim.goldPaid > 0) {
        await tx.user.update({
          where: { id: claim.userId },
          data: { gold: { increment: claim.goldPaid } }
        })

        await tx.moneyTx.create({
          data: {
            userId: claim.userId,
            amount: claim.goldPaid,
            type: "REFUND",
            reason: `Reward claim rejected: ${claim.reward.name}`,
            requestId: reqId
          }
        })
      }

      if (claim.gemsPaid > 0) {
        await tx.user.update({
          where: { id: claim.userId },
          data: { gems: { increment: claim.gemsPaid } }
        })

        await tx.moneyTx.create({
          data: {
            userId: claim.userId,
            amount: claim.gemsPaid,
            type: "REFUND",
            reason: `Reward claim rejected (gems): ${claim.reward.name}`,
            requestId: reqId
          }
        })
      }

      // Return stock
      await tx.realLifeReward.update({
        where: { id: claim.rewardId },
        data: { availableStock: { increment: 1 } }
      })

      const updatedClaim = await tx.rewardClaim.update({
        where: { id: data.claimId },
        data: {
          status: ClaimStatus.REJECTED,
          approvedBy: data.approvedBy,
          rejectedReason: data.rejectedReason,
          approvedAt: new Date()
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Reward claim rejected: ${claim.reward.name}`),
          userId: data.approvedBy,
          requestId: reqId,
          metadata: {
            claimId: claim.id,
            reason: data.rejectedReason
          }
        }
      })

      return updatedClaim
    })
  }

  /**
   * Complete a reward claim (mark as delivered)
   */
  static async completeClaim(data: {
    claimId: string
    completedBy: string
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    const claim = await prisma.rewardClaim.update({
      where: { id: data.claimId },
      data: {
        status: ClaimStatus.COMPLETED,
        completedBy: data.completedBy,
        completedAt: new Date()
      },
      include: { reward: true }
    })

    await prisma.systemLog.create({
      data: {
        level: "INFO",
        message: sanitizeForLog(`Reward delivered: ${claim.reward.name}`),
        userId: data.completedBy,
        requestId: reqId,
        metadata: {
          claimId: claim.id,
          studentId: claim.userId
        }
      }
    })

    return claim
  }

  /**
   * Get student's claim history
   */
  static async getStudentClaims(userId: string) {
    return await prisma.rewardClaim.findMany({
      where: { userId },
      include: {
        reward: true
      },
      orderBy: { createdAt: "desc" }
    })
  }

  /**
   * Get all pending claims (for teachers/admins)
   */
  static async getPendingClaims() {
    return await prisma.rewardClaim.findMany({
      where: { status: ClaimStatus.PENDING },
      include: {
        reward: true
      },
      orderBy: { createdAt: "asc" }
    })
  }

  /**
   * Get all claims with filters
   */
  static async getAllClaims(filters?: {
    status?: ClaimStatus
    userId?: string
    rewardId?: string
  }) {
    return await prisma.rewardClaim.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.rewardId && { rewardId: filters.rewardId })
      },
      include: {
        reward: true
      },
      orderBy: { createdAt: "desc" }
    })
  }

  /**
   * Update reward details
   */
  static async updateReward(rewardId: string, data: {
    name?: string
    description?: string
    goldPrice?: number
    gemsPrice?: number
    totalStock?: number
    availableStock?: number
    isActive?: boolean
    isFeatured?: boolean
    priority?: number
    availableFrom?: Date | null
    availableTo?: Date | null
  }) {
    return await prisma.realLifeReward.update({
      where: { id: rewardId },
      data
    })
  }

  /**
   * Delete reward (soft delete - mark as inactive)
   */
  static async deleteReward(rewardId: string) {
    return await prisma.realLifeReward.update({
      where: { id: rewardId },
      data: { isActive: false }
    })
  }

  /**
   * Calculate player level from total XP
   */
  private static calculateLevel(totalXP: number): number {
    // Using same formula as leveling system
    // Level = floor(sqrt(XP / 100))
    return Math.floor(Math.sqrt(totalXP / 100))
  }
}
