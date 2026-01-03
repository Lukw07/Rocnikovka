/**
 * Teacher Statistics & Motivation Service
 * Tracks teacher performance and awards badges/achievements
 */

import { prisma } from "@/app/lib/db"
import { TeacherBadgeType, BadgeRarity } from "@/app/lib/generated"
import { generateRequestId, sanitizeForLog } from "@/app/lib/utils"

export class TeacherStatsService {
  /**
   * Initialize statistics for a teacher
   */
  static async initializeStats(teacherId: string) {
    const existing = await prisma.teacherStatistics.findUnique({
      where: { teacherId },
      include: {
        badges: {
          orderBy: { earnedAt: "desc" }
        },
        achievements: {
          orderBy: { updatedAt: "desc" }
        }
      }
    })

    if (existing) return existing

    return await prisma.teacherStatistics.create({
      data: { teacherId },
      include: {
        badges: {
          orderBy: { earnedAt: "desc" }
        },
        achievements: {
          orderBy: { updatedAt: "desc" }
        }
      }
    })
  }

  /**
   * Get teacher statistics
   */
  static async getStats(teacherId: string) {
    let stats = await prisma.teacherStatistics.findUnique({
      where: { teacherId },
      include: {
        badges: {
          orderBy: { earnedAt: "desc" }
        },
        achievements: {
          orderBy: { updatedAt: "desc" }
        }
      }
    })

    if (!stats) {
      stats = await this.initializeStats(teacherId)
    }

    return stats
  }

  /**
   * Update job-related statistics
   */
  static async trackJobCreated(teacherId: string, jobData: {
    xpReward: number
    moneyReward: number
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const stats = await tx.teacherStatistics.upsert({
        where: { teacherId },
        create: {
          teacherId,
          totalJobsCreated: 1,
          monthlyJobsCreated: 1,
          weeklyJobsCreated: 1,
          lastActivityAt: new Date()
        },
        update: {
          totalJobsCreated: { increment: 1 },
          monthlyJobsCreated: { increment: 1 },
          weeklyJobsCreated: { increment: 1 },
          motivationPoints: { increment: 10 }, // 10 points per job created
          lastActivityAt: new Date()
        }
      })

      // Check for job-related achievements
      await this.checkJobAchievements(teacherId, stats.totalJobsCreated, tx)

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Teacher stats updated: job created`),
          userId: teacherId,
          requestId: reqId,
          metadata: {
            totalJobsCreated: stats.totalJobsCreated
          }
        }
      })

      return stats
    })
  }

  /**
   * Track job completion
   */
  static async trackJobCompleted(teacherId: string, jobData: {
    xpAwarded: number
    moneyAwarded: number
    studentsCount: number
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const stats = await tx.teacherStatistics.upsert({
        where: { teacherId },
        create: {
          teacherId,
          totalJobsCompleted: 1,
          totalXPAwarded: jobData.xpAwarded,
          totalMoneyAwarded: jobData.moneyAwarded,
          totalStudentsHelped: jobData.studentsCount,
          motivationPoints: 25, // 25 points for completed job
          lastActivityAt: new Date()
        },
        update: {
          totalJobsCompleted: { increment: 1 },
          totalXPAwarded: { increment: jobData.xpAwarded },
          totalMoneyAwarded: { increment: jobData.moneyAwarded },
          totalStudentsHelped: { increment: jobData.studentsCount },
          motivationPoints: { increment: 25 },
          lastActivityAt: new Date()
        }
      })

      // Check for completion milestones
      await this.checkCompletionAchievements(teacherId, stats.totalJobsCompleted, tx)

      return stats
    })
  }

  /**
   * Track quest creation
   */
  static async trackQuestCreated(teacherId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.teacherStatistics.upsert({
      where: { teacherId },
      create: {
        teacherId,
        totalQuestsCreated: 1,
        motivationPoints: 15,
        lastActivityAt: new Date()
      },
      update: {
        totalQuestsCreated: { increment: 1 },
        motivationPoints: { increment: 15 },
        lastActivityAt: new Date()
      }
    })
  }

  /**
   * Track quest completion
   */
  static async trackQuestCompleted(teacherId: string, requestId?: string) {
    return await prisma.$transaction(async (tx) => {
      const stats = await tx.teacherStatistics.upsert({
        where: { teacherId },
        create: {
          teacherId,
          totalQuestsCompleted: 1,
          motivationPoints: 20,
          lastActivityAt: new Date()
        },
        update: {
          totalQuestsCompleted: { increment: 1 },
          motivationPoints: { increment: 20 },
          lastActivityAt: new Date()
        }
      })

      // Update completion rate
      if (stats.totalQuestsCreated > 0) {
        const completionRate = (stats.totalQuestsCompleted / stats.totalQuestsCreated) * 100
        await tx.teacherStatistics.update({
          where: { teacherId },
          data: { questCompletionRate: completionRate }
        })
      }

      return stats
    })
  }

  /**
   * Track event creation
   */
  static async trackEventCreated(teacherId: string, requestId?: string) {
    return await prisma.teacherStatistics.upsert({
      where: { teacherId },
      create: {
        teacherId,
        totalEventsCreated: 1,
        motivationPoints: 30, // Events are worth more
        lastActivityAt: new Date()
      },
      update: {
        totalEventsCreated: { increment: 1 },
        motivationPoints: { increment: 30 },
        lastActivityAt: new Date()
      }
    })
  }

  /**
   * Track event participation
   */
  static async trackEventParticipation(teacherId: string, participantCount: number, requestId?: string) {
    return await prisma.teacherStatistics.upsert({
      where: { teacherId },
      create: {
        teacherId,
        totalEventParticipants: participantCount,
        motivationPoints: participantCount * 5, // 5 points per participant
        lastActivityAt: new Date()
      },
      update: {
        totalEventParticipants: { increment: participantCount },
        motivationPoints: { increment: participantCount * 5 },
        lastActivityAt: new Date()
      }
    })
  }

  /**
   * Award badge to teacher
   */
  static async awardBadge(data: {
    teacherId: string
    badgeType: TeacherBadgeType
    title: string
    description: string
    icon: string
    rarity: BadgeRarity
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      // Check if badge already awarded
      const existing = await tx.teacherBadge.findFirst({
        where: {
          teacherId: data.teacherId,
          badgeType: data.badgeType
        }
      })

      if (existing) {
        return existing
      }

      const badge = await tx.teacherBadge.create({
        data: {
          teacherId: data.teacherId,
          badgeType: data.badgeType,
          title: data.title,
          description: data.description,
          icon: data.icon,
          rarity: data.rarity
        }
      })

      // Update stats
      await tx.teacherStatistics.update({
        where: { teacherId: data.teacherId },
        data: {
          totalBadgesEarned: { increment: 1 },
          motivationPoints: { increment: this.getBadgePoints(data.rarity) }
        }
      })

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Badge awarded: ${data.title}`),
          userId: data.teacherId,
          requestId: reqId,
          metadata: {
            badgeType: data.badgeType,
            rarity: data.rarity
          }
        }
      })

      return badge
    })
  }

  /**
   * Get teacher leaderboard
   */
  static async getLeaderboard(options?: {
    limit?: number
    metric?: "motivationPoints" | "totalJobsCreated" | "totalXPAwarded"
    period?: "all" | "monthly" | "weekly"
  }) {
    const limit = options?.limit || 10
    const metric = options?.metric || "motivationPoints"
    const period = options?.period || "all"

    let orderBy: any = { [metric]: "desc" }

    if (period === "monthly") {
      orderBy = { monthlyJobsCreated: "desc" }
    } else if (period === "weekly") {
      orderBy = { weeklyJobsCreated: "desc" }
    }

    return await prisma.teacherStatistics.findMany({
      take: limit,
      orderBy,
      include: {
        badges: {
          orderBy: { earnedAt: "desc" }
        }
      }
    })
  }

  /**
   * Get teacher rank
   */
  static async getTeacherRank(teacherId: string) {
    const allTeachers = await prisma.teacherStatistics.findMany({
      orderBy: { motivationPoints: "desc" },
      select: { teacherId: true }
    })

    const rank = allTeachers.findIndex(t => t.teacherId === teacherId) + 1
    return {
      rank,
      total: allTeachers.length,
      percentile: rank > 0 ? ((allTeachers.length - rank) / allTeachers.length) * 100 : 0
    }
  }

  /**
   * Reset monthly/weekly statistics
   */
  static async resetPeriodicStats(period: "monthly" | "weekly") {
    if (period === "monthly") {
      return await prisma.teacherStatistics.updateMany({
        data: {
          monthlyJobsCreated: 0,
          monthlyXPAwarded: 0
        }
      })
    } else {
      return await prisma.teacherStatistics.updateMany({
        data: {
          weeklyJobsCreated: 0
        }
      })
    }
  }

  /**
   * Check and award job-related achievements
   */
  private static async checkJobAchievements(teacherId: string, totalJobs: number, tx: any) {
    const milestones = [
      { count: 1, key: "FIRST_JOB", name: "První krok", points: 50 },
      { count: 10, key: "10_JOBS", name: "Začátečník", points: 100 },
      { count: 50, key: "50_JOBS", name: "Průkopník", points: 250 },
      { count: 100, key: "100_JOBS", name: "Job Master", points: 500 },
      { count: 250, key: "250_JOBS", name: "Legendární tvůrce", points: 1000 }
    ]

    for (const milestone of milestones) {
      if (totalJobs >= milestone.count) {
        const existing = await tx.teacherAchievement.findUnique({
          where: {
            teacherId_achievementKey: {
              teacherId,
              achievementKey: milestone.key
            }
          }
        })

        if (!existing) {
          await tx.teacherAchievement.create({
            data: {
              teacherId,
              achievementKey: milestone.key,
              name: milestone.name,
              description: `Vytvořil ${milestone.count} jobů`,
              progress: milestone.count,
              maxProgress: milestone.count,
              isCompleted: true,
              completedAt: new Date(),
              rewardPoints: milestone.points
            }
          })

          await tx.teacherStatistics.update({
            where: { teacherId },
            data: {
              motivationPoints: { increment: milestone.points },
              totalAwardsReceived: { increment: 1 }
            }
          })

          // Award badge for 100 jobs
          if (milestone.count === 100) {
            await this.awardBadge({
              teacherId,
              badgeType: TeacherBadgeType.JOB_MASTER,
              title: "Job Master",
              description: "Vytvořil 100+ jobů",
              icon: "🏆",
              rarity: BadgeRarity.EPIC
            })
          }
        }
      }
    }
  }

  /**
   * Check completion-related achievements
   */
  private static async checkCompletionAchievements(teacherId: string, totalCompleted: number, tx: any) {
    const milestones = [
      { count: 10, key: "10_COMPLETED", name: "První úspěchy", points: 100 },
      { count: 50, key: "50_COMPLETED", name: "Zkušený mentor", points: 300 },
      { count: 100, key: "100_COMPLETED", name: "Mistr dokončení", points: 600 }
    ]

    for (const milestone of milestones) {
      if (totalCompleted >= milestone.count) {
        const existing = await tx.teacherAchievement.findUnique({
          where: {
            teacherId_achievementKey: {
              teacherId,
              achievementKey: milestone.key
            }
          }
        })

        if (!existing) {
          await tx.teacherAchievement.create({
            data: {
              teacherId,
              achievementKey: milestone.key,
              name: milestone.name,
              description: `Dokončil ${milestone.count} jobů`,
              progress: milestone.count,
              maxProgress: milestone.count,
              isCompleted: true,
              completedAt: new Date(),
              rewardPoints: milestone.points
            }
          })

          await tx.teacherStatistics.update({
            where: { teacherId },
            data: {
              motivationPoints: { increment: milestone.points }
            }
          })
        }
      }
    }
  }

  /**
   * Get badge points by rarity
   */
  private static getBadgePoints(rarity: BadgeRarity): number {
    const points = {
      COMMON: 50,
      UNCOMMON: 100,
      RARE: 250,
      EPIC: 500,
      LEGENDARY: 1000
    }
    return points[rarity] || 50
  }

  /**
   * Get comprehensive teacher dashboard data
   */
  static async getTeacherDashboard(teacherId: string) {
    const stats = await this.getStats(teacherId)
    const rank = await this.getTeacherRank(teacherId)
    const leaderboard = await this.getLeaderboard({ limit: 5 })

    return {
      stats,
      rank,
      topTeachers: leaderboard
    }
  }
}
