/**
 * Služba pro správu streaks (po sobě jdoucích dní s aktivitou)
 * Integrace s achievementy a reward systémem
 */

import { prisma } from "@/app/lib/prisma"
import { NotificationType } from "@/app/lib/generated"

export interface StreakInfo {
  currentStreak: number
  maxStreak: number
  lastActivityDate?: Date
  currentMultiplier: number
  totalParticipation: number
  nextMilestone?: number
  milestonesReached: number[]
  daysUntilBreak: number
}

export interface StreakMilestone {
  days: number
  xpReward: number
  moneyReward: number
  multiplierBonus?: number
}

export class StreakService {
  
  // Definice milníků
  static readonly MILESTONES: StreakMilestone[] = [
    { days: 3, xpReward: 50, moneyReward: 10, multiplierBonus: 0.05 },
    { days: 7, xpReward: 150, moneyReward: 30, multiplierBonus: 0.1 },
    { days: 14, xpReward: 300, moneyReward: 75, multiplierBonus: 0.15 },
    { days: 30, xpReward: 750, moneyReward: 200, multiplierBonus: 0.25 },
    { days: 60, xpReward: 1500, moneyReward: 500, multiplierBonus: 0.35 },
    { days: 100, xpReward: 3000, moneyReward: 1000, multiplierBonus: 0.5 },
    { days: 365, xpReward: 10000, moneyReward: 5000, multiplierBonus: 1.0 }
  ]

  /**
   * Získá aktuální streak info pro uživatele
   */
  static async getStreakInfo(userId: string): Promise<StreakInfo> {
    const streak = await prisma.streak.findUnique({
      where: { userId },
      include: {
        rewards: {
          orderBy: { milestone: 'desc' },
          take: 10
        }
      }
    })

    if (!streak) {
      // Vytvořit nový streak záznam
      const newStreak = await prisma.streak.create({
        data: {
          userId,
          currentStreak: 0,
          maxStreak: 0,
          currentMultiplier: 1.0,
          totalParticipation: 0,
          milestonesReached: []
        }
      })

      return {
        currentStreak: 0,
        maxStreak: 0,
        currentMultiplier: 1.0,
        totalParticipation: 0,
        milestonesReached: [],
        daysUntilBreak: 1
      }
    }

    // Najít další milník
    const nextMilestone = this.MILESTONES.find(m => m.days > streak.currentStreak)

    // Vypočítat dny do prolomení streaku
    let daysUntilBreak = 1
    if (streak.lastActivityDate) {
      const now = new Date()
      const lastActivity = new Date(streak.lastActivityDate)
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      
      // Máme 24h na další aktivitu
      daysUntilBreak = hoursSinceActivity < 24 ? 1 : 0
    }

    return {
      currentStreak: streak.currentStreak,
      maxStreak: streak.maxStreak,
      lastActivityDate: streak.lastActivityDate || undefined,
      currentMultiplier: streak.currentMultiplier,
      totalParticipation: streak.totalParticipation,
      nextMilestone: nextMilestone?.days,
      milestonesReached: streak.milestonesReached,
      daysUntilBreak
    }
  }

  /**
   * Aktualizuje streak po aktivitě uživatele
   */
  static async recordActivity(userId: string, xpEarned: number = 0, source: string = 'GENERAL') {
    const today = this.getCzechDate()
    
    return await prisma.$transaction(async (tx) => {
      // Upsert daily activity
      const dailyActivity = await tx.dailyActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        create: {
          userId,
          date: today,
          xpEarned,
          activityCount: 1,
          sources: [source]
        },
        update: {
          xpEarned: { increment: xpEarned },
          activityCount: { increment: 1 },
          sources: { push: source }
        }
      })

      // Získat nebo vytvořit streak
      let streak = await tx.streak.findUnique({
        where: { userId }
      })

      if (!streak) {
        streak = await tx.streak.create({
          data: {
            userId,
            currentStreak: 1,
            maxStreak: 1,
            lastActivityDate: today,
            currentMultiplier: 1.0,
            totalParticipation: 1,
            milestonesReached: []
          }
        })

        return { streak, dailyActivity, newStreak: true }
      }

      // Zkontrolovat, zda je to nový den
      const lastActivityDate = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null
      
      if (!lastActivityDate) {
        // První aktivita
        streak = await tx.streak.update({
          where: { userId },
          data: {
            currentStreak: 1,
            maxStreak: 1,
            lastActivityDate: today,
            totalParticipation: { increment: 1 }
          }
        })

        return { streak, dailyActivity, continued: false }
      }

      const lastDate = this.getCzechDate(lastActivityDate)
      const daysDiff = this.getDaysDifference(lastDate, today)

      if (daysDiff === 0) {
        // Stejný den - jen increment total participation
        streak = await tx.streak.update({
          where: { userId },
          data: {
            totalParticipation: { increment: 1 }
          }
        })

        return { streak, dailyActivity, sameDay: true }
      }

      if (daysDiff === 1) {
        // Pokračující streak
        const newStreakCount = streak.currentStreak + 1
        const newMaxStreak = Math.max(newStreakCount, streak.maxStreak)

        // Zkontrolovat milníky
        const reachedMilestones = [...streak.milestonesReached]
        const newMilestones = this.MILESTONES.filter(
          m => m.days === newStreakCount && !reachedMilestones.includes(m.days)
        )

        // Vypočítat nový multiplier
        const currentMilestone = [...this.MILESTONES]
          .reverse()
          .find(m => m.days <= newStreakCount)
        const newMultiplier = 1.0 + (currentMilestone?.multiplierBonus || 0)

        // Update streak
        streak = await tx.streak.update({
          where: { userId },
          data: {
            currentStreak: newStreakCount,
            maxStreak: newMaxStreak,
            lastActivityDate: today,
            totalParticipation: { increment: 1 },
            currentMultiplier: newMultiplier,
            milestonesReached: {
              push: newMilestones.map(m => m.days)
            }
          }
        })

        // Udělit odměny za nové milníky
        for (const milestone of newMilestones) {
          await this.awardMilestoneReward(tx, userId, streak.id, milestone)
        }

        // Notifikace
        if (newMilestones.length > 0) {
          await tx.notification.create({
            data: {
              userId,
              type: 'STREAK_MILESTONE',
              title: `🔥 ${newStreakCount} Day Streak!`,
              message: `You've reached a ${newStreakCount}-day streak milestone! Keep it up!`,
              data: {
                streakCount: newStreakCount,
                rewards: newMilestones.map(m => ({
                  xp: m.xpReward,
                  money: m.moneyReward
                }))
              }
            }
          })
        }

        return { 
          streak, 
          dailyActivity, 
          continued: true, 
          newMilestones: newMilestones.map(m => m.days) 
        }
      }

      // Streak byl prolomen
      const previousStreak = streak.currentStreak
      
      streak = await tx.streak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastActivityDate: today,
          streakBrokenAt: new Date(),
          totalParticipation: { increment: 1 },
          currentMultiplier: 1.0
        }
      })

      // Notifikace o prolomení streaku
      if (previousStreak >= 3) {
        await tx.notification.create({
          data: {
            userId,
            type: 'SYSTEM',
            title: '💔 Streak Broken',
            message: `Your ${previousStreak}-day streak was broken. Start fresh today!`,
            data: {
              previousStreak,
              maxStreak: streak.maxStreak
            }
          }
        })
      }

      return { 
        streak, 
        dailyActivity, 
        broken: true, 
        previousStreak 
      }
    })
  }

  /**
   * Udělí odměnu za dosažený milník
   */
  private static async awardMilestoneReward(
    tx: any,
    userId: string,
    streakId: string,
    milestone: StreakMilestone
  ) {
    // Vytvořit reward záznam
    await tx.streakReward.create({
      data: {
        streakId,
        milestone: milestone.days,
        xpReward: milestone.xpReward,
        moneyReward: milestone.moneyReward
      }
    })

    // Udělit XP
    if (milestone.xpReward > 0) {
      await tx.xPAudit.create({
        data: {
          userId,
          amount: milestone.xpReward,
          reason: `${milestone.days}-day streak milestone`,
          requestId: `streak_${streakId}_${milestone.days}`
        }
      })
    }

    // Udělit peníze
    if (milestone.moneyReward > 0) {
      await tx.moneyTx.create({
        data: {
          userId,
          amount: milestone.moneyReward,
          type: 'EARNED',
          reason: `${milestone.days}-day streak milestone`,
          requestId: `streak_${streakId}_${milestone.days}`
        }
      })
    }

    // Log
    await tx.systemLog.create({
      data: {
        level: 'INFO',
        message: 'streak_milestone_reached',
        userId,
        metadata: {
          milestone: milestone.days,
          rewards: {
            xp: milestone.xpReward,
            money: milestone.moneyReward,
            multiplier: milestone.multiplierBonus
          }
        }
      }
    })
  }

  /**
   * Získá top uživatele podle streaku
   */
  static async getTopStreaks(limit: number = 10) {
    const topStreaks = await prisma.streak.findMany({
      take: limit,
      orderBy: [
        { currentStreak: 'desc' },
        { maxStreak: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    })

    return topStreaks.map(streak => ({
      userId: streak.userId,
      userName: streak.user.name,
      avatarUrl: streak.user.avatarUrl,
      currentStreak: streak.currentStreak,
      maxStreak: streak.maxStreak,
      currentMultiplier: streak.currentMultiplier
    }))
  }

  /**
   * Resetuje všechny prolomeé streaky (Cron job - denní)
   */
  static async resetBrokenStreaks() {
    const yesterday = this.getCzechDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
    
    const streaksToReset = await prisma.streak.findMany({
      where: {
        lastActivityDate: {
          lt: yesterday
        },
        currentStreak: {
          gt: 0
        }
      }
    })

    for (const streak of streaksToReset) {
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 0,
          streakBrokenAt: new Date(),
          currentMultiplier: 1.0
        }
      })

      // Notifikace o prolomení
      if (streak.currentStreak >= 3) {
        await prisma.notification.create({
          data: {
            userId: streak.userId,
            type: 'SYSTEM',
            title: '💔 Streak Reset',
            message: `Your ${streak.currentStreak}-day streak has been reset due to inactivity.`,
            data: {
              previousStreak: streak.currentStreak,
              resetDate: new Date()
            }
          }
        })
      }
    }

    return {
      resetCount: streaksToReset.length,
      streaks: streaksToReset.map(s => ({
        userId: s.userId,
        previousStreak: s.currentStreak
      }))
    }
  }

  /**
   * Pomocné funkce pro práci s českým časem
   */
  private static getCzechDate(date: Date = new Date()): Date {
    // Convert to Czech timezone (UTC+1/+2)
    const czechDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Prague' }))
    czechDate.setHours(0, 0, 0, 0)
    return czechDate
  }

  private static getDaysDifference(date1: Date, date2: Date): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    d1.setHours(0, 0, 0, 0)
    d2.setHours(0, 0, 0, 0)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }
}
