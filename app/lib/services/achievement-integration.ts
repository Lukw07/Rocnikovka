/**
 * Integration hooks pro automatické trackování achievementů
 * Volají se po získání XP, dokončení questů, jobů atd.
 */

import { AchievementsEnhancedService } from "./achievements-enhanced"
import { StreakService } from "./streak"
import { NotificationService } from "./notification"
import { prisma } from "@/app/lib/prisma"

export class AchievementIntegrationService {
  
  /**
   * Hook: Po přidání XP uživateli
   * Automaticky zkontroluje a odemkne XP-based achievementy
   */
  static async onXPGained(userId: string, xpAmount: number, source: string) {
    try {
      // 1. Zaznamenat aktivitu pro streak
      await StreakService.recordActivity(userId, xpAmount, source)

      // 2. Získat celkové XP uživatele
      const totalXP = await prisma.xPSource.aggregate({
        where: { userId },
        _sum: { amount: true }
      })

      const xp = totalXP._sum.amount || 0
      const level = Math.floor(xp / 100)

      // 3. Zkontrolovat XP-based progressive achievementy
      const xpAchievements = await prisma.achievement.findMany({
        where: {
          category: 'XP',
          type: 'PROGRESSIVE',
          isActive: true
        }
      })

      for (const achievement of xpAchievements) {
        if (achievement.target) {
          await AchievementsEnhancedService.updateAchievementProgress(
            userId,
            achievement.id,
            xpAmount
          )
        }
      }

      // 4. Zkontrolovat level-based achievementy
      const levelAchievements = await prisma.achievement.findMany({
        where: {
          category: 'LEVEL',
          type: 'NORMAL',
          isActive: true,
          target: { lte: level }
        }
      })

      for (const achievement of levelAchievements) {
        try {
          await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
        } catch (error) {
          // Achievement už může být odemčený
        }
      }

      // 5. Zkontrolovat další achievementy
      await AchievementsEnhancedService.checkAndUnlockAchievements(userId)

    } catch (error) {
      console.error("Achievement integration error (XP):", error)
    }
  }

  /**
   * Hook: Po dokončení questu
   */
  static async onQuestCompleted(userId: string, questId: string) {
    try {
      // Inkrementovat progress pro quest achievementy
      const questAchievements = await prisma.achievement.findMany({
        where: {
          category: 'QUEST',
          type: 'PROGRESSIVE',
          isActive: true
        }
      })

      for (const achievement of questAchievements) {
        await AchievementsEnhancedService.updateAchievementProgress(
          userId,
          achievement.id,
          1
        )
      }

      // Zkontrolovat speciální quest achievementy
      const questCount = await prisma.questProgress.count({
        where: {
          userId,
          status: 'COMPLETED'
        }
      })

      // Achievement za X dokončených questů
      const milestones = [1, 5, 10, 25, 50, 100]
      for (const milestone of milestones) {
        if (questCount === milestone) {
          const achievement = await prisma.achievement.findFirst({
            where: {
              category: 'QUEST',
              target: milestone,
              isActive: true
            }
          })

          if (achievement) {
            try {
              await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            } catch (error) {
              // Already unlocked
            }
          }
        }
      }
    } catch (error) {
      console.error("Achievement integration error (Quest):", error)
    }
  }

  /**
   * Hook: Po dokončení jobu
   */
  static async onJobCompleted(userId: string, jobId: string) {
    try {
      const jobAchievements = await prisma.achievement.findMany({
        where: {
          category: 'JOB',
          type: 'PROGRESSIVE',
          isActive: true
        }
      })

      for (const achievement of jobAchievements) {
        await AchievementsEnhancedService.updateAchievementProgress(
          userId,
          achievement.id,
          1
        )
      }

      // Zkontrolovat milníky jobů
      const jobCount = await prisma.jobAssignment.count({
        where: {
          studentId: userId,
          status: 'COMPLETED'
        }
      })

      const milestones = [1, 5, 10, 25, 50, 100]
      for (const milestone of milestones) {
        if (jobCount === milestone) {
          const achievement = await prisma.achievement.findFirst({
            where: {
              category: 'JOB',
              target: milestone,
              isActive: true
            }
          })

          if (achievement) {
            try {
              await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            } catch (error) {
              // Already unlocked
            }
          }
        }
      }
    } catch (error) {
      console.error("Achievement integration error (Job):", error)
    }
  }

  /**
   * Hook: Po upgrade skillu
   */
  static async onSkillUpgraded(userId: string, skillId: string, newLevel: number) {
    try {
      // Progressive achievement za skill points
      const skillAchievements = await prisma.achievement.findMany({
        where: {
          category: 'SKILL',
          type: 'PROGRESSIVE',
          isActive: true
        }
      })

      for (const achievement of skillAchievements) {
        await AchievementsEnhancedService.updateAchievementProgress(
          userId,
          achievement.id,
          1
        )
      }

      // Achievement za dosažení max levelu nějakého skillu
      if (newLevel >= 10) {
        const achievement = await prisma.achievement.findFirst({
          where: {
            category: 'SKILL',
            name: { contains: 'Master' },
            isActive: true
          }
        })

        if (achievement) {
          try {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
          } catch (error) {
            // Already unlocked
          }
        }
      }
    } catch (error) {
      console.error("Achievement integration error (Skill):", error)
    }
  }

  /**
   * Hook: Po změně reputace
   */
  static async onReputationChanged(userId: string, amount: number, newTotal: number) {
    try {
      const repAchievements = await prisma.achievement.findMany({
        where: {
          category: 'REPUTATION',
          type: 'PROGRESSIVE',
          isActive: true
        }
      })

      for (const achievement of repAchievements) {
        if (achievement.target && newTotal >= achievement.target) {
          try {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
          } catch (error) {
            // Already unlocked
          }
        }
      }
    } catch (error) {
      console.error("Achievement integration error (Reputation):", error)
    }
  }

  /**
   * Hook: Po dosažení streak milníku
   */
  static async onStreakMilestone(userId: string, streakDays: number) {
    try {
      // Najít streak achievement pro tento milník
      const achievement = await prisma.achievement.findFirst({
        where: {
          category: 'ACTIVITY',
          type: 'STREAK',
          target: streakDays,
          isActive: true
        }
      })

      if (achievement) {
        try {
          await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
        } catch (error) {
          // Already unlocked
        }
      }
    } catch (error) {
      console.error("Achievement integration error (Streak):", error)
    }
  }

  /**
   * Hook: Po připojení k guildě
   */
  static async onGuildJoined(userId: string, guildId: string) {
    try {
      const guildAchievement = await prisma.achievement.findFirst({
        where: {
          category: 'SOCIAL',
          name: { contains: 'Guild' },
          isActive: true
        }
      })

      if (guildAchievement) {
        try {
          await AchievementsEnhancedService.unlockAchievement(userId, guildAchievement.id)
        } catch (error) {
          // Already unlocked
        }
      }
    } catch (error) {
      console.error("Achievement integration error (Guild):", error)
    }
  }

  /**
   * Utility: Bulk check všech achievementů pro uživatele
   * Volá se např. při prvním přihlášení nebo po migraci
   */
  static async bulkCheckAchievements(userId: string) {
    try {
      console.log(`Running bulk achievement check for user ${userId}`)

      // Získat všechny statistiky
      const [xpTotal, questsCompleted, jobsCompleted, skillPointsTotal, reputation, streak] = 
        await Promise.all([
          prisma.xPSource.aggregate({
            where: { userId },
            _sum: { amount: true }
          }),
          prisma.questProgress.count({
            where: { userId, status: 'COMPLETED' }
          }),
          prisma.jobAssignment.count({
            where: { studentId: userId, status: 'COMPLETED' }
          }),
          prisma.skillPoint.findUnique({
            where: { userId }
          }),
          prisma.reputation.findUnique({
            where: { userId }
          }),
          prisma.streak.findUnique({
            where: { userId }
          })
        ])

      const stats = {
        xp: xpTotal._sum.amount || 0,
        level: Math.floor((xpTotal._sum.amount || 0) / 100),
        quests: questsCompleted,
        jobs: jobsCompleted,
        skillPointsSpent: skillPointsTotal?.spent || 0,
        reputation: reputation?.points || 0,
        streak: streak?.currentStreak || 0
      }

      console.log(`User stats:`, stats)

      // Zkontrolovat všechny achievementy
      const allAchievements = await prisma.achievement.findMany({
        where: { isActive: true }
      })

      let unlockedCount = 0

      for (const achievement of allAchievements) {
        try {
          // Level achievements
          if (achievement.category === 'LEVEL' && achievement.target && stats.level >= achievement.target) {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            unlockedCount++
          }

          // XP achievements
          if (achievement.category === 'XP' && achievement.target && stats.xp >= achievement.target) {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            unlockedCount++
          }

          // Quest achievements
          if (achievement.category === 'QUEST' && achievement.target && stats.quests >= achievement.target) {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            unlockedCount++
          }

          // Job achievements
          if (achievement.category === 'JOB' && achievement.target && stats.jobs >= achievement.target) {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            unlockedCount++
          }

          // Reputation achievements
          if (achievement.category === 'REPUTATION' && achievement.target && stats.reputation >= achievement.target) {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            unlockedCount++
          }

          // Streak achievements
          if (achievement.category === 'ACTIVITY' && achievement.type === 'STREAK' && achievement.target && stats.streak >= achievement.target) {
            await AchievementsEnhancedService.unlockAchievement(userId, achievement.id)
            unlockedCount++
          }
        } catch (error) {
          // Achievement může být již odemčený
        }
      }

      console.log(`Bulk check completed: ${unlockedCount} new achievements unlocked`)

      return {
        stats,
        unlockedCount
      }
    } catch (error) {
      console.error("Bulk achievement check error:", error)
      throw error
    }
  }
}
