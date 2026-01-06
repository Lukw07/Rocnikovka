/**
 * Rozšířená služba pro achievementy a streaky
 * Podporuje hidden, temporary, progressive achievementy a integraci s odměnami
 */

import { prisma } from "@/app/lib/prisma"
import { AchievementType, AchievementCategory, ItemRarity, NotificationType } from "@/app/lib/generated/client"

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CreateAchievementData {
  name: string
  description: string
  type?: AchievementType
  category?: AchievementCategory
  badgeUrl?: string
  icon?: string
  color?: string
  criteria?: string
  target?: number
  rarity?: ItemRarity
  
  // Rewards
  xpReward?: number
  skillpointsReward?: number
  reputationReward?: number
  moneyReward?: number
  
  // Temporal
  availableFrom?: Date
  availableTo?: Date
  
  sortOrder?: number
}

export interface AchievementWithProgress {
  id: string
  name: string
  description: string
  type: AchievementType
  category: AchievementCategory
  badgeUrl?: string
  icon?: string
  color?: string
  rarity: ItemRarity
  target?: number
  
  // Rewards
  xpReward: number
  skillpointsReward: number
  reputationReward: number
  moneyReward: number
  
  // Status
  isUnlocked: boolean
  progress?: {
    current: number
    target: number
    percentage: number
  }
  unlockedAt?: Date
  
  // Visibility (pro HIDDEN achievementy)
  isVisible: boolean
}

export interface StreakInfo {
  currentStreak: number
  maxStreak: number
  lastActivityDate?: Date
  currentMultiplier: number
  totalParticipation: number
  nextMilestone?: number
  milestonesReached: number[]
}

export interface StreakMilestone {
  days: number
  xpReward: number
  moneyReward: number
  achievementId?: string
}

// ============================================================================
// Achievement Service
// ============================================================================

export class AchievementsEnhancedService {
  
  // Definice streak milníků
  static readonly STREAK_MILESTONES: StreakMilestone[] = [
    { days: 3, xpReward: 50, moneyReward: 10 },
    { days: 7, xpReward: 150, moneyReward: 30 },
    { days: 14, xpReward: 300, moneyReward: 75 },
    { days: 30, xpReward: 750, moneyReward: 200 },
    { days: 60, xpReward: 1500, moneyReward: 500 },
    { days: 100, xpReward: 3000, moneyReward: 1000 },
    { days: 365, xpReward: 10000, moneyReward: 5000 },
  ]

  /**
   * Vytvoří nový achievement s rozšířenými vlastnostmi
   */
  static async createAchievement(data: CreateAchievementData) {
    const achievement = await prisma.achievement.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type || 'NORMAL',
        category: data.category || 'OTHER',
        badgeUrl: data.badgeUrl,
        icon: data.icon,
        color: data.color,
        criteria: data.criteria,
        target: data.target,
        rarity: data.rarity || 'COMMON',
        
        xpReward: data.xpReward || 0,
        skillpointsReward: data.skillpointsReward || 0,
        reputationReward: data.reputationReward || 0,
        moneyReward: data.moneyReward || 0,
        
        availableFrom: data.availableFrom,
        availableTo: data.availableTo,
        sortOrder: data.sortOrder || 0,
        
        isActive: true
      }
    })

    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'achievement_created_enhanced',
        metadata: {
          achievementId: achievement.id,
          type: achievement.type,
          category: achievement.category,
          rewards: {
            xp: achievement.xpReward,
            skillpoints: achievement.skillpointsReward,
            reputation: achievement.reputationReward,
            money: achievement.moneyReward
          }
        }
      }
    })

    return achievement
  }

  /**
   * Získá achievementy pro uživatele s progress trackinigem
   * Hidden achievementy jsou zobrazeny pouze pokud jsou odemčené
   */
  static async getUserAchievementsWithProgress(userId: string): Promise<AchievementWithProgress[]> {
    const now = new Date()
    
    // Získat všechny aktivní achievementy
    const achievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
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
      },
      include: {
        awards: {
          where: { userId },
          take: 1
        },
        progresses: {
          where: { userId },
          take: 1
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return achievements
      .map(achievement => {
        const isUnlocked = achievement.awards.length > 0
        const progress = achievement.progresses[0]
        
        // Hidden achievementy nejsou viditelné dokud nejsou odemčené
        const isVisible = achievement.type !== 'HIDDEN' || isUnlocked

        return {
          id: achievement.id,
          name: isVisible ? achievement.name : '???',
          description: isVisible ? achievement.description : 'Skrytý úspěch',
          type: achievement.type,
          category: achievement.category,
          badgeUrl: isVisible ? achievement.badgeUrl || undefined : undefined,
          icon: isVisible ? achievement.icon || undefined : '🔒',
          color: isVisible ? achievement.color || undefined : '#666',
          rarity: achievement.rarity,
          target: achievement.target || undefined,
          
          xpReward: achievement.xpReward,
          skillpointsReward: achievement.skillpointsReward,
          reputationReward: achievement.reputationReward,
          moneyReward: achievement.moneyReward,
          
          isUnlocked,
          progress: progress ? {
            current: progress.currentValue,
            target: progress.targetValue,
            percentage: Math.min(100, Math.round((progress.currentValue / progress.targetValue) * 100))
          } : undefined,
          unlockedAt: achievement.awards[0]?.createdAt,
          
          isVisible
        }
      })
      .filter(a => a.isVisible) // Filtrovat hidden achievementy
  }

  /**
   * Odemkne achievement a udělí odměny
   */
  static async unlockAchievement(userId: string, achievementId: string, awardedBy?: string) {
    return await prisma.$transaction(async (tx) => {
      // Získat achievement
      const achievement = await tx.achievement.findUnique({
        where: { id: achievementId, isActive: true }
      })

      if (!achievement) {
        throw new Error('Achievement not found or not active')
      }

      // Zkontrolovat, zda již není odemčený
      const existing = await tx.achievementAward.findUnique({
        where: {
          userId_achievementId: { userId, achievementId }
        }
      })

      if (existing) {
        return { alreadyUnlocked: true }
      }

      // Odemknout achievement
      const award = await tx.achievementAward.create({
        data: {
          userId,
          achievementId,
          awardedBy
        }
      })

      // Udělit odměny
      const rewards = {
        xp: achievement.xpReward,
        skillpoints: achievement.skillpointsReward,
        reputation: achievement.reputationReward,
        money: achievement.moneyReward
      }

      // XP odměna
      if (rewards.xp > 0) {
        await tx.xPAudit.create({
          data: {
            userId,
            amount: rewards.xp,
            reason: `Achievement unlocked: ${achievement.name}`,
            requestId: `achievement_${achievementId}`
          }
        })
      }

      // Skillpoints odměna
      if (rewards.skillpoints > 0) {
        await tx.skillPoint.upsert({
          where: { userId },
          create: {
            userId,
            available: rewards.skillpoints,
            spent: 0
          },
          update: {
            available: { increment: rewards.skillpoints }
          }
        })
      }

      // Reputace odměna
      if (rewards.reputation > 0) {
        const currentRep = await tx.reputation.findUnique({
          where: { userId }
        })

        const newPoints = (currentRep?.points || 0) + rewards.reputation
        const newTier = Math.floor(newPoints / 100) // Každých 100 bodů = 1 tier

        await tx.reputation.upsert({
          where: { userId },
          create: {
            userId,
            points: rewards.reputation,
            tier: newTier
          },
          update: {
            points: newPoints,
            tier: newTier
          }
        })

        await tx.reputationLog.create({
          data: {
            userId,
            change: rewards.reputation,
            reason: `Achievement: ${achievement.name}`,
            sourceId: achievementId,
            sourceType: 'ACHIEVEMENT'
          }
        })
      }

      // Peníze odměna
      if (rewards.money > 0) {
        await tx.moneyTx.create({
          data: {
            userId,
            amount: rewards.money,
            type: 'EARNED',
            reason: `Achievement: ${achievement.name}`,
            requestId: `achievement_${achievementId}`
          }
        })
      }

      // Vytvořit notifikaci
      await tx.notification.create({
        data: {
          userId,
          type: 'ACHIEVEMENT_UNLOCKED',
          title: '🏆 Achievement Unlocked!',
          message: `You've unlocked: ${achievement.name}`,
          data: {
            achievementId,
            rewards
          }
        }
      })

      // Log
      await tx.systemLog.create({
        data: {
          level: 'INFO',
          message: 'achievement_unlocked',
          userId,
          metadata: {
            achievementId,
            achievementName: achievement.name,
            rewards
          }
        }
      })

      return { 
        award, 
        achievement,
        rewards,
        alreadyUnlocked: false 
      }
    })
  }

  /**
   * Aktualizuje progress pro progressive achievement
   */
  static async updateAchievementProgress(
    userId: string, 
    achievementId: string, 
    incrementBy: number = 1
  ) {
    return await prisma.$transaction(async (tx) => {
      const achievement = await tx.achievement.findUnique({
        where: { id: achievementId, isActive: true, type: 'PROGRESSIVE' }
      })

      if (!achievement || !achievement.target) {
        return null
      }

      // Zkontrolovat, zda již není odemčený
      const existingAward = await tx.achievementAward.findUnique({
        where: {
          userId_achievementId: { userId, achievementId }
        }
      })

      if (existingAward) {
        return { completed: true }
      }

      // Upsert progress
      const progress = await tx.achievementProgress.upsert({
        where: {
          userId_achievementId: { userId, achievementId }
        },
        create: {
          userId,
          achievementId,
          currentValue: incrementBy,
          targetValue: achievement.target
        },
        update: {
          currentValue: { increment: incrementBy }
        }
      })

      // Zkontrolovat, zda je splněno
      if (progress.currentValue >= progress.targetValue) {
        // Automaticky odemknout
        const result = await this.unlockAchievement(userId, achievementId)
        
        return {
          progress,
          completed: true,
          unlocked: result
        }
      }

      // Notifikace o progressu (každých 25%)
      const percentage = (progress.currentValue / progress.targetValue) * 100
      const milestones = [25, 50, 75]
      const reachedMilestone = milestones.find(m => 
        percentage >= m && (percentage - (incrementBy / progress.targetValue * 100)) < m
      )

      if (reachedMilestone) {
        await tx.notification.create({
          data: {
            userId,
            type: 'ACHIEVEMENT_PROGRESS',
            title: '📊 Achievement Progress',
            message: `${reachedMilestone}% complete: ${achievement.name}`,
            data: {
              achievementId,
              progress: {
                current: progress.currentValue,
                target: progress.targetValue,
                percentage: Math.round(percentage)
              }
            }
          }
        })
      }

      return {
        progress,
        completed: false
      }
    })
  }

  /**
   * Automatická kontrola a odemykání achievementů na základě kritérií
   */
  static async checkAndUnlockAchievements(userId: string) {
    // Získat statistiky uživatele
    const [user, xpTotal, questsCompleted, jobsCompleted, skillPointsTotal] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          xpSources: true,
          reputation: true,
          skillPoints: true,
          streak: true
        }
      }),
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
      })
    ])

    if (!user) return []

    const stats = {
      level: Math.floor((xpTotal._sum.amount || 0) / 100),
      totalXP: xpTotal._sum.amount || 0,
      questsCompleted,
      jobsCompleted,
      reputation: user.reputation?.points || 0,
      currentStreak: user.streak?.currentStreak || 0,
      maxStreak: user.streak?.maxStreak || 0,
      skillPointsSpent: skillPointsTotal?.spent || 0
    }

    // Achievements based on level
    const levelAchievements = [
      { level: 5, achievementName: 'Beginner Scholar' },
      { level: 10, achievementName: 'Intermediate Student' },
      { level: 25, achievementName: 'Advanced Learner' },
      { level: 50, achievementName: 'Master of Knowledge' },
      { level: 100, achievementName: 'Legendary Scholar' }
    ]

    const unlockedAchievements = []

    // Check level achievements (toto je příklad - v praxi by se achievementy identifikovaly podle ID)
    for (const la of levelAchievements) {
      if (stats.level >= la.level) {
        const achievement = await prisma.achievement.findFirst({
          where: {
            name: la.achievementName,
            category: 'LEVEL',
            isActive: true
          }
        })

        if (achievement) {
          try {
            const result = await this.unlockAchievement(userId, achievement.id)
            if (!result.alreadyUnlocked) {
              unlockedAchievements.push(achievement)
            }
          } catch (error) {
            // Achievement již odemčený
          }
        }
      }
    }

    return unlockedAchievements
  }
}
