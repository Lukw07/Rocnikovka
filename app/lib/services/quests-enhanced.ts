import { prisma } from "../prisma"
import { QuestDifficulty, QuestStatus, QuestType } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"

/**
 * Service for managing quests with mini games, guild integration, and reputation
 */
export class QuestServiceEnhanced {
  /**
   * Create a new quest with extended features
   */
  static async createQuest(data: {
    title: string
    description: string
    category: string
    difficulty: QuestDifficulty
    questType?: QuestType
    requiredLevel: number
    xpReward: number
    moneyReward: number
    skillpointsReward?: number
    reputationReward?: number
    isRepeatable?: boolean
    expiresAt?: Date
    guildId?: string
    miniGameType?: string
    miniGameData?: any
    globalTarget?: number
    globalUnit?: string
    createdBy: string
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      // Verify creator permissions
      const creator = await tx.user.findUnique({
        where: { id: data.createdBy }
      })

      if (!creator || !["TEACHER", "OPERATOR"].includes(creator.role)) {
        throw new Error("Only teachers/admins can create quests")
      }

      const quest = await tx.quest.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          questType: data.questType || QuestType.STANDARD,
          requiredLevel: data.requiredLevel,
          xpReward: data.xpReward,
          moneyReward: data.moneyReward || 0,
          skillpointsReward: data.skillpointsReward || 0,
          reputationReward: data.reputationReward || 0,
          status: QuestStatus.ACTIVE,
          isRepeatable: data.isRepeatable || false,
          expiresAt: data.expiresAt,
          guildId: data.guildId,
          miniGameType: data.miniGameType,
          miniGameData: data.miniGameData,
          globalTarget: data.globalTarget,
          globalUnit: data.globalUnit,
          createdBy: data.createdBy
        }
      })

      // Log creation
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Quest created: ${data.title}`),
          userId: data.createdBy,
          requestId: reqId,
          metadata: {
            questId: quest.id,
            questType: quest.questType,
            difficulty: data.difficulty,
            xpReward: data.xpReward,
            guildId: data.guildId
          }
        }
      })

      return quest
    })
  }

  /**
   * Get available quests with filters
   */
  static async getAvailableQuests(studentId: string, filters?: {
    category?: string
    difficulty?: QuestDifficulty
    questType?: QuestType
    guildId?: string
  }) {
    const whereClause: any = {
      status: QuestStatus.ACTIVE
    }

    if (filters?.category) whereClause.category = filters.category
    if (filters?.difficulty) whereClause.difficulty = filters.difficulty
    if (filters?.questType) whereClause.questType = filters.questType
    if (filters?.guildId) whereClause.guildId = filters.guildId

    // Check for expired quests
    whereClause.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ]

    const quests = await prisma.quest.findMany({
      where: whereClause,
      include: {
        questProgresses: {
          where: { userId: studentId }
        },
        guild: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      },
      orderBy: [
        { difficulty: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return quests.map(quest => ({
      ...quest,
      userProgress: quest.questProgresses[0] || null
    }))
  }

  /**
   * Accept a quest
   */
  static async acceptQuest(questId: string, studentId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const quest = await tx.quest.findUnique({
        where: { id: questId }
      })

      if (!quest) {
        throw new Error("Quest not found")
      }

      if (quest.status !== QuestStatus.ACTIVE) {
        throw new Error("Quest is not active")
      }

      // Check expiration
      if (quest.expiresAt && quest.expiresAt < new Date()) {
        throw new Error("Quest has expired")
      }

      // Check if already accepted (unless repeatable)
      const existing = await tx.questProgress.findUnique({
        where: {
          userId_questId: { userId: studentId, questId }
        }
      })

      if (existing) {
        const now = new Date()

        // Daily / Weekly repeat logic
        const isDaily = quest.questType === QuestType.DAILY
        const isWeekly = quest.questType === QuestType.WEEKLY

        if (!quest.isRepeatable && !isDaily && !isWeekly) {
          if (existing.status === "COMPLETED") {
            throw new Error("Quest already completed")
          }
          if (["ACCEPTED", "IN_PROGRESS"].includes(existing.status)) {
            throw new Error("Quest already in progress")
          }
        }

        if (isDaily && existing.completedAt) {
          const diffHours = (now.getTime() - existing.completedAt.getTime()) / (1000 * 60 * 60)
          if (diffHours < 24) {
            throw new Error("Daily quest can be accepted again in 24h")
          }
        }

        if (isWeekly && existing.completedAt) {
          const diffHours = (now.getTime() - existing.completedAt.getTime()) / (1000 * 60 * 60)
          if (diffHours < 24 * 7) {
            throw new Error("Weekly quest can be accepted again in 7 days")
          }
        }
      }

      // Create/update progress
      const progress = await tx.questProgress.upsert({
        where: {
          userId_questId: { userId: studentId, questId }
        },
        update: {
          status: "ACCEPTED",
          progress: 0,
          startedAt: new Date(),
          abandonedAt: null
        },
        create: {
          userId: studentId,
          questId,
          status: "ACCEPTED",
          progress: 0
        }
      })

      // Log acceptance
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Quest accepted: ${quest.title}`),
          userId: studentId,
          requestId: reqId,
          metadata: {
            questId,
            progressId: progress.id
          }
        }
      })

      return progress
    })
  }

  /**
   * Update quest progress (for mini games)
   */
  static async updateProgress(
    questId: string,
    studentId: string,
    progressPercent: number,
    miniGameScore?: number,
    miniGameData?: any,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const progress = await tx.questProgress.findUnique({
        where: {
          userId_questId: { userId: studentId, questId }
        }
      })

      if (!progress) {
        throw new Error("Quest not accepted")
      }

      const updated = await tx.questProgress.update({
        where: { id: progress.id },
        data: {
          progress: Math.min(100, Math.max(0, progressPercent)),
          status: progressPercent >= 100 ? "COMPLETED" : "IN_PROGRESS",
          miniGameScore,
          miniGameData,
          completedAt: progressPercent >= 100 ? new Date() : undefined
        }
      })

      // If completed, award rewards
      if (progressPercent >= 100) {
        await this.awardQuestRewards(questId, studentId, reqId, tx)
      }

      return updated
    })
  }

  /**
   * Complete a quest
   */
  static async completeQuest(questId: string, studentId: string, requestId?: string) {
    return await this.updateProgress(questId, studentId, 100, undefined, undefined, requestId)
  }

  /**
   * Award quest rewards (XP, money, skillpoints, reputation)
   */
  private static async awardQuestRewards(
    questId: string,
    studentId: string,
    requestId: string,
    tx: any
  ) {
    const quest = await tx.quest.findUnique({
      where: { id: questId },
      include: { guild: true }
    })

    if (!quest) {
      throw new Error("Quest not found")
    }

    // Award XP
    await tx.xPAudit.create({
      data: {
        userId: studentId,
        amount: quest.xpReward,
        reason: `Quest completed: ${quest.title}`,
        requestId
      }
    })

    // Award Money
    if (quest.moneyReward > 0) {
      await tx.moneyTx.create({
        data: {
          userId: studentId,
          amount: quest.moneyReward,
          type: "EARNED",
          reason: `Quest completed: ${quest.title}`,
          requestId
        }
      })
    }

    // Award Skillpoints
    if (quest.skillpointsReward > 0) {
      await tx.skillPoint.upsert({
        where: { userId: studentId },
        update: {
          available: { increment: quest.skillpointsReward },
          total: { increment: quest.skillpointsReward }
        },
        create: {
          userId: studentId,
          available: quest.skillpointsReward,
          total: quest.skillpointsReward,
          spent: 0
        }
      })
    }

    // Award Reputation
    if (quest.reputationReward !== 0) {
      await tx.reputation.upsert({
        where: { userId: studentId },
        update: {
          points: { increment: quest.reputationReward }
        },
        create: {
          userId: studentId,
          points: quest.reputationReward,
          tier: 0
        }
      })

      // Update tier based on points
      const reputation = await tx.reputation.findUnique({
        where: { userId: studentId }
      })

      if (reputation) {
        const newTier = Math.floor(Math.abs(reputation.points) / 100)
        await tx.reputation.update({
          where: { userId: studentId },
          data: { tier: newTier }
        })
      }

      // Log reputation change
      await tx.reputationLog.create({
        data: {
          userId: studentId,
          change: quest.reputationReward,
          reason: `Quest completed: ${quest.title}`,
          sourceId: questId,
          sourceType: "quest"
        }
      })
    }

    // If guild quest, award to guild treasury
    if (quest.guildId) {
      await tx.guild.update({
        where: { id: quest.guildId },
        data: {
          treasury: { increment: Math.floor(quest.moneyReward * 0.1) } // 10% goes to guild
        }
      })
    }

    // Log rewards
    await tx.systemLog.create({
      data: {
        level: "INFO",
        message: sanitizeForLog(`Quest rewards awarded for: ${quest.title}`),
        userId: studentId,
        requestId,
        metadata: {
          questId,
          xp: quest.xpReward,
          money: quest.moneyReward,
          skillpoints: quest.skillpointsReward,
          reputation: quest.reputationReward
        }
      }
    })
  }

  /**
   * Abandon a quest
   */
  static async abandonQuest(questId: string, studentId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const progress = await tx.questProgress.findUnique({
        where: {
          userId_questId: { userId: studentId, questId }
        }
      })

      if (!progress) {
        throw new Error("Quest not accepted")
      }

      if (progress.status === "COMPLETED") {
        throw new Error("Cannot abandon completed quest")
      }

      const updated = await tx.questProgress.update({
        where: { id: progress.id },
        data: {
          status: "ABANDONED",
          abandonedAt: new Date()
        }
      })

      // Log abandonment
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Quest abandoned`),
          userId: studentId,
          requestId: reqId,
          metadata: { questId }
        }
      })

      return updated
    })
  }

  /**
   * Contribute to a global quest
   */
  static async contributeToGlobalQuest(
    questId: string,
    userId: string,
    amount: number,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const quest = await tx.quest.findUnique({
        where: { id: questId }
      })

      if (!quest) throw new Error("Quest not found")
      if (quest.questType !== QuestType.GLOBAL) throw new Error("Not a global quest")

      const updated = await tx.quest.update({
        where: { id: questId },
        data: {
          globalProgress: { increment: amount }
        }
      })

      // Log contribution
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Global quest contribution: ${amount}`),
          userId,
          requestId: reqId,
          metadata: { questId, amount }
        }
      })

      return updated
    })
  }
}

