import { prisma } from "../prisma"
import { QuestDifficulty, QuestStatus } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"
import { ProgressionService } from "./progression"
import { XPService } from "./xp"

/**
 * Service for managing quests
 * Handles quest creation, tracking progress, and completion
 */
export class QuestService {
  /**
   * Create a new quest
   */
  static async createQuest(data: {
    title: string
    description: string
    category: string
    difficulty: QuestDifficulty
    requiredLevel: number
    xpReward: number
    moneyReward: number
    createdBy: string // Teacher/Admin ID
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      // Verify creator is teacher/admin
      const creator = await prisma.user.findUnique({
        where: { id: data.createdBy }
      })

      if (!creator || !["TEACHER", "OPERATOR"].includes(creator.role)) {
        throw new Error("Only teachers/admins can create quests")
      }

      const quest = await prisma.quest.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          requiredLevel: data.requiredLevel,
          xpReward: data.xpReward,
          moneyReward: data.moneyReward,
          status: QuestStatus.ACTIVE,
          createdBy: data.createdBy
        }
      })

      // Log creation
      await prisma.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Quest created: ${data.title}`),
          userId: data.createdBy,
          requestId: reqId,
          metadata: {
            questId: quest.id,
            difficulty: data.difficulty,
            xpReward: data.xpReward
          }
        }
      })

      return quest
    } catch (error) {
      throw new Error(`Failed to create quest: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get all available quests for a student
   */
  static async getAvailableQuests(studentId: string) {
    try {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true }
      })

      if (!student) {
        throw new Error("Student not found")
      }

      // Get student's current level from XPAudit or similar
      // For now, we'll assume level can be calculated from XP
      // This will be enhanced with proper leveling system integration

      const quests = await prisma.quest.findMany({
        where: {
          status: QuestStatus.ACTIVE
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          requiredLevel: true,
          xpReward: true,
          moneyReward: true,
          createdAt: true,
          questProgresses: {
            where: { userId: studentId },
            select: {
              status: true,
              progress: true,
              completedAt: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })

      return quests.map(quest => ({
        ...quest,
        userProgress: quest.questProgresses[0] || null,
        questProgresses: undefined
      }))
    } catch (error) {
      throw new Error(`Failed to fetch quests: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Accept a quest
   */
  static async acceptQuest(questId: string, studentId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      try {
        // Check quest exists
        const quest = await tx.quest.findUnique({
          where: { id: questId }
        })

        if (!quest) {
          throw new Error("Quest not found")
        }

        if (quest.status !== QuestStatus.ACTIVE) {
          throw new Error("Quest is not active")
        }

        // Check if already accepted/completed
        const existing = await tx.questProgress.findUnique({
          where: {
            userId_questId: { userId: studentId, questId }
          }
        })

        if (existing && existing.status !== "ABANDONED") {
          throw new Error("Quest already accepted or completed")
        }

        // Create or update progress
        const progress = await tx.questProgress.upsert({
          where: {
            userId_questId: { userId: studentId, questId }
          },
          update: {
            status: "ACCEPTED",
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

        // Log
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
      } catch (error) {
        throw new Error(`Failed to accept quest: ${error instanceof Error ? error.message : String(error)}`)
      }
    })
  }

  /**
   * Complete a quest and grant rewards
   */
  static async completeQuest(questId: string, studentId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      try {
        // Find progress
        const progress = await tx.questProgress.findUnique({
          where: {
            userId_questId: { userId: studentId, questId }
          }
        })

        if (!progress) {
          throw new Error("Quest progress not found")
        }

        if (progress.status === "COMPLETED") {
          throw new Error("Quest already completed")
        }

        // Get quest details
        const quest = await tx.quest.findUnique({
          where: { id: questId }
        })

        if (!quest) {
          throw new Error("Quest not found")
        }

        // Update progress
        const updatedProgress = await tx.questProgress.update({
          where: { id: progress.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            progress: 100
          }
        })

        // Grant XP and Money
        // Using XPService if available - integrate with existing system
        const xpGranted = quest.xpReward

        // Add XP source entry
        await tx.xPSource.create({
          data: {
            type: "QUEST" as any,
            userId: studentId,
            amount: xpGranted,
            totalAmount: xpGranted,
            multiplier: 1.0,
            reason: `Quest completed: ${quest.title}`,
            sourceId: questId,
            sourceType: "quest"
          }
        })

        // Grant money
        if (quest.moneyReward > 0) {
          await tx.moneyTx.create({
            data: {
              userId: studentId,
              amount: quest.moneyReward,
              type: "EARNED",
              reason: `Quest reward: ${quest.title}`,
              requestId: reqId
            }
          })
        }

        // Grant skillpoint for quest completion (similar to jobs)
        await tx.skillPoint.upsert({
          where: { userId: studentId },
          update: {
            available: { increment: 1 },
            total: { increment: 1 }
          },
          create: {
            userId: studentId,
            available: 1,
            total: 1,
            spent: 0
          }
        })

        // Guild integration - if it's a guild quest
        if (quest.guildId) {
          // Find member's guild
          const guildMember = await tx.guildMember.findFirst({
            where: {
              userId: studentId,
              guildId: quest.guildId
            }
          })

          if (guildMember) {
            // Add 10% of rewards to guild treasury
            const treasuryContribution = Math.floor(quest.moneyReward * 0.1)
            if (treasuryContribution > 0) {
              await tx.guild.update({
                where: { id: quest.guildId },
                data: { treasury: { increment: treasuryContribution } }
              })
            }

            // Add XP to guild
            const guildXP = Math.floor(quest.xpReward * 0.5) // 50% of quest XP goes to guild
            await tx.guild.update({
              where: { id: quest.guildId },
              data: { xp: { increment: guildXP } }
            })

            // Update member contribution
            await tx.guildMember.update({
              where: { id: guildMember.id },
              data: {
                contributedXP: { increment: guildXP },
                contributedMoney: { increment: treasuryContribution }
              }
            })

            // Check for guild level up
            const guild = await tx.guild.findUnique({
              where: { id: quest.guildId }
            })

            if (guild) {
              const newLevel = Math.floor(guild.xp / 1000) + 1
              if (newLevel > guild.level) {
                await tx.guild.update({
                  where: { id: quest.guildId },
                  data: { level: newLevel }
                })

                await tx.guildActivity.create({
                  data: {
                    guildId: quest.guildId,
                    userId: studentId,
                    action: "level_up",
                    details: `Guild reached level ${newLevel}!`
                  }
                })
              }
            }

            // Log guild activity
            await tx.guildActivity.create({
              data: {
                guildId: quest.guildId,
                userId: studentId,
                action: "quest_completed",
                details: `Completed guild quest: ${quest.title}`
              }
            })
          }
        }

        // Log
        await tx.systemLog.create({
          data: {
            level: "INFO",
            message: sanitizeForLog(`Quest completed: ${quest.title}`),
            userId: studentId,
            requestId: reqId,
            metadata: {
              questId,
              xpReward: xpGranted,
              moneyReward: quest.moneyReward,
              skillpointGrant: 1,
              guildQuest: !!quest.guildId
            }
          }
        })

        // Call integration hook (after transaction to avoid nested transactions)
        setImmediate(async () => {
          try {
            const { GamificationIntegrationService } = await import("./gamification-integration")
            await GamificationIntegrationService.onQuestCompleted(
              studentId,
              questId,
              quest.difficulty,
              reqId
            )
          } catch (error) {
            console.error("Error calling onQuestCompleted integration hook:", error)
          }
        })

        return updatedProgress
      } catch (error) {
        throw new Error(`Failed to complete quest: ${error instanceof Error ? error.message : String(error)}`)
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
        throw new Error("Quest progress not found")
      }

      const updated = await tx.questProgress.update({
        where: { id: progress.id },
        data: {
          status: "ABANDONED",
          abandonedAt: new Date()
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: "Quest abandoned",
          userId: studentId,
          requestId: reqId
        }
      })

      return updated
    })
  }

  /**
   * Get quest progress for student
   */
  static async getQuestProgress(studentId: string) {
    try {
      const progresses = await prisma.questProgress.findMany({
        where: { userId: studentId },
        include: {
          quest: {
            select: {
              title: true,
              description: true,
              category: true,
              difficulty: true,
              xpReward: true,
              moneyReward: true
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      })

      return progresses
    } catch (error) {
      throw new Error(`Failed to fetch quest progress: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get quest statistics
   */
  static async getQuestStats(studentId: string) {
    try {
      const stats = await prisma.questProgress.groupBy({
        by: ["status"],
        where: { userId: studentId },
        _count: true
      })

      const completed = await prisma.questProgress.findMany({
        where: { userId: studentId, status: "COMPLETED" },
        select: { quest: { select: { xpReward: true, moneyReward: true } } }
      })

      const totalXP = completed.reduce((sum, p) => sum + p.quest.xpReward, 0)
      const totalMoney = completed.reduce((sum, p) => sum + p.quest.moneyReward, 0)

      return {
        stats,
        totalXP,
        totalMoney,
        completedCount: completed.length
      }
    } catch (error) {
      throw new Error(`Failed to fetch quest stats: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
