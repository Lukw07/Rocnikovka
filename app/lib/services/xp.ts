import { prisma } from "../prisma"
import { UserRole, XPSourceType } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"
import { LevelingSystem } from "../leveling"
import { ProgressionService } from "./progression"
import { applyTimeManagementBonus, applyConsistencyBonus } from "../attribute-effects"

export class XPService {
  /**
   * Grant XP with streak bonus tracking
   */
  static async grantXPWithBonus(data: {
    studentId: string
    teacherId: string
    subjectId: string
    amount: number
    reason: string
    sourceType: XPSourceType
    sourceId?: string // ID of related entity (job, quest, etc.)
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      // Verify teacher exists and has TEACHER role
      const teacher = await tx.user.findFirst({
        where: {
          id: data.teacherId,
          role: { in: [UserRole.TEACHER, UserRole.OPERATOR] }
        }
      })
      
      if (!teacher) {
        throw new Error("Teacher not found or insufficient permissions")
      }
      
      // Check daily budget (skip for operators)
      if (teacher.role === UserRole.TEACHER) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        let dailyBudget = await tx.teacherDailyBudget.findUnique({
          where: {
            teacherId_subjectId_date: {
              teacherId: data.teacherId,
              subjectId: data.subjectId,
              date: today
            }
          }
        })
        
        if (!dailyBudget) {
          dailyBudget = await tx.teacherDailyBudget.create({
            data: {
              teacherId: data.teacherId,
              subjectId: data.subjectId,
              date: today,
              budget: 1000,
              used: 0
            }
          })
        }
        
        if (dailyBudget.used + data.amount > dailyBudget.budget) {
          throw new Error(`Daily XP budget exceeded. Available: ${dailyBudget.budget - dailyBudget.used}, Requested: ${data.amount}`)
        }
        
        await tx.teacherDailyBudget.update({
          where: { id: dailyBudget.id },
          data: { used: dailyBudget.used + data.amount }
        })
      }
      
      // Get or create streak
      let streak = await tx.streak.findUnique({
        where: { userId: data.studentId }
      })
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Check if already granted today to avoid double-counting
      const dailyActivity = await tx.dailyActivity.findUnique({
        where: {
          userId_date: {
            userId: data.studentId,
            date: today
          }
        }
      })
      
      // Calculate streak bonus
      let bonusXP = 0
      let totalXP = data.amount
      let multiplier = 1.0
      
      if (streak && !dailyActivity) {
        // First activity of the day - update streak
        const lastActivity = streak.lastActivityDate
        const daysSinceLastActivity = lastActivity 
          ? Math.floor((today.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 1
        
        let newStreak = streak.currentStreak
        
        if (daysSinceLastActivity === 1) {
          // Consecutive day - extend streak
          newStreak = streak.currentStreak + 1
        } else if (daysSinceLastActivity > 1) {
          // Streak broken - reset
          newStreak = 1
          await tx.streak.update({
            where: { userId: data.studentId },
            data: { streakBrokenAt: new Date() }
          })
        }
        
        // Calculate multiplier based on streak
        const baseStreakMultiplier = LevelingSystem.getStreakMultiplier(newStreak)
        
        // Get player's Time Management level for XP bonus
        const playerTimeManagement = await tx.playerSkill.findUnique({
          where: {
            userId_skillId: {
              userId: data.studentId,
              skillId: "" // Will be filled by skill lookup
            }
          }
        })
        
        // Apply Time Management bonus to base XP
        let baseWithAttributeBonus = data.amount
        try {
          // Try to get Time Management skill ID
          const timeManagementSkill = await tx.skill.findFirst({
            where: { name: "Time Management" }
          })
          
          if (timeManagementSkill) {
            const tmLevel = await tx.playerSkill.findUnique({
              where: {
                userId_skillId: {
                  userId: data.studentId,
                  skillId: timeManagementSkill.id
                }
              }
            })
            
            if (tmLevel && tmLevel.level > 0) {
              // Apply Time Management bonus: +2% per level
              baseWithAttributeBonus = Math.floor(
                data.amount * (1 + (tmLevel.level * 0.02))
              )
            }
          }
        } catch (err) {
          // Silently fail - Time Management bonus is optional
          baseWithAttributeBonus = data.amount
        }
        
        const bonusCalc = LevelingSystem.applyStreakBonus(baseWithAttributeBonus, newStreak)
        bonusXP = bonusCalc.bonusXP
        totalXP = bonusCalc.totalXP
        multiplier = bonusCalc.multiplier
        
        // Update streak
        await tx.streak.update({
          where: { userId: data.studentId },
          data: {
            currentStreak: newStreak,
            maxStreak: Math.max(streak.maxStreak, newStreak),
            lastActivityDate: today,
            currentMultiplier: multiplier,
            totalParticipation: streak.totalParticipation + 1
          }
        })
      } else if (!streak) {
        // Create initial streak
        streak = await tx.streak.create({
          data: {
            userId: data.studentId,
            currentStreak: 1,
            lastActivityDate: today,
            currentMultiplier: 1.0,
            totalParticipation: 1
          }
        })
      }
      
      // Record XP source
      const xpSource = await tx.xPSource.create({
        data: {
          userId: data.studentId,
          type: data.sourceType,
          amount: data.amount,
          bonusAmount: bonusXP,
          totalAmount: totalXP,
          multiplier,
          reason: data.reason,
          sourceId: data.sourceId,
          sourceType: data.sourceType
        }
      })
      
      // Update or create daily activity
      if (dailyActivity) {
        await tx.dailyActivity.update({
          where: {
            userId_date: {
              userId: data.studentId,
              date: today
            }
          },
          data: {
            xpEarned: { increment: totalXP },
            activityCount: { increment: 1 },
            sources: {
              push: data.sourceType
            }
          }
        })
      } else {
        await tx.dailyActivity.create({
          data: {
            userId: data.studentId,
            date: today,
            xpEarned: totalXP,
            activityCount: 1,
            sources: [data.sourceType]
          }
        })
      }
      
      // Keep backward compatibility: also log to XPAudit
      const xpAudit = await tx.xPAudit.create({
        data: {
          userId: data.studentId,
          amount: totalXP,
          reason: data.reason,
          requestId: reqId
        }
      })
      
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`XP granted: ${totalXP} XP (${data.amount} base + ${bonusXP} bonus, ${multiplier.toFixed(2)}x multiplier)`),
          userId: data.teacherId,
          requestId: reqId,
          metadata: {
            studentId: data.studentId,
            subjectId: data.subjectId,
            baseAmount: data.amount,
            bonusAmount: bonusXP,
            totalAmount: totalXP,
            multiplier,
            sourceType: data.sourceType,
            xpSourceId: xpSource.id
          }
        }
      })
      
      // Call achievement integration hook
      try {
        const { AchievementIntegrationService } = await import("./achievement-integration")
        await AchievementIntegrationService.onXPGained(data.studentId, totalXP, data.sourceType)
      } catch (error) {
        console.error("Error calling achievement integration hook:", error)
        // Don't fail the XP grant if integration fails
      }
      
      return {
        xpAudit,
        xpSource,
        bonusXP,
        totalXP,
        multiplier,
        streak: streak ? {
          currentStreak: streak.currentStreak,
          maxStreak: streak.maxStreak,
          totalParticipation: streak.totalParticipation
        } : null
      }
    })
  }

  /**
   * Get total XP for a student and check for level ups
   */
  static async getStudentTotalXP(studentId: string): Promise<number> {
    const xpAudits = await prisma.xPAudit.findMany({
      where: { userId: studentId }
    })
    return xpAudits.reduce((sum, audit) => sum + audit.amount, 0)
  }

  /**
   * Check and process level ups
   * Awards skillpoints when leveling up
   * Can be called after XP grants
   */
  static async processLevelUp(studentId: string) {
    try {
      const totalXP = await this.getStudentTotalXP(studentId)
      const levelInfo = LevelingSystem.getLevelInfo(totalXP)
      
      // Check if we need to award skillpoints
      const skillPoints = await prisma.skillPoint.findUnique({
        where: { userId: studentId }
      })
      
      let leveledUp = false
      let oldLevel = skillPoints?.total || 0
      
      // If skill points don't exist, initialize them for current level
      if (!skillPoints) {
        await ProgressionService.awardSkillpointsForLevel(studentId, levelInfo.level)
        leveledUp = true
      } else if (skillPoints.total < levelInfo.level) {
        // Award skillpoints for all levels we've reached but haven't awarded for
        const missingLevels = levelInfo.level - skillPoints.total
        for (let i = 0; i < missingLevels; i++) {
          await ProgressionService.awardSkillpointsForLevel(
            studentId,
            skillPoints.total + i + 1
          )
        }
        leveledUp = true
      }
      
      // Call integration hook if leveled up
      if (leveledUp) {
        try {
          const { GamificationIntegrationService } = await import("./gamification-integration")
          await GamificationIntegrationService.onLevelUp(studentId, levelInfo.level)
        } catch (error) {
          console.error("Error calling onLevelUp integration hook:", error)
        }
      }
    } catch (error) {
      console.error("Error processing level up:", error)
    }
  }

  static async grantXP(data: {
    studentId: string
    teacherId: string
    subjectId: string
    amount: number
    reason: string
  }, requestId?: string) {
    // Legacy method - delegate to new system with ACTIVITY source type
    return this.grantXPWithBonus({
      ...data,
      sourceType: XPSourceType.ACTIVITY
    }, requestId)
  }
  
  static async getStudentXP(studentId: string) {
    try {
      const xpAudits = await prisma.xPAudit.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: "desc" }
      })
      
      const totalXP = xpAudits.reduce((sum, audit) => sum + audit.amount, 0)
      const levelInfo = LevelingSystem.getLevelInfo(totalXP)
      const streak = await prisma.streak.findUnique({
        where: { userId: studentId }
      })
      
      return {
        totalXP,
        level: levelInfo.level,
        progressToNextLevel: LevelingSystem.getProgressToNextLevel(totalXP),
        xpForNextLevel: levelInfo.xpForNextLevel,
        xpNeededForNextLevel: levelInfo.xpRequired,
        audits: xpAudits,
        recentGrants: xpAudits.slice(0, 10),
        streak: streak ? {
          currentStreak: streak.currentStreak,
          maxStreak: streak.maxStreak,
          multiplier: streak.currentMultiplier,
          totalParticipation: streak.totalParticipation
        } : {
          currentStreak: 0,
          maxStreak: 0,
          multiplier: 1.0,
          totalParticipation: 0
        }
      }
    } catch (error) {
      console.error("Error in getStudentXP:", error)
      return {
        totalXP: 0,
        level: 1,
        progressToNextLevel: 0,
        xpForNextLevel: 0,
        xpNeededForNextLevel: 100,
        audits: [],
        recentGrants: [],
        streak: {
          currentStreak: 0,
          maxStreak: 0,
          multiplier: 1.0,
          totalParticipation: 0
        }
      }
    }
  }

  /**
   * Get XP breakdown by source type
   */
  static async getXPBreakdown(studentId: string, daysBack: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    
    const sources = await prisma.xPSource.groupBy({
      by: ['type'],
      where: {
        userId: studentId,
        createdAt: { gte: startDate }
      },
      _sum: {
        totalAmount: true,
        bonusAmount: true
      },
      _count: true
    })
    
    return sources.map(s => ({
      type: s.type,
      count: s._count,
      totalXP: s._sum.totalAmount || 0,
      bonusXP: s._sum.bonusAmount || 0
    }))
  }

  /**
   * Get daily activity for last N days
   */
  static async getDailyActivityHistory(studentId: string, daysBack: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    startDate.setHours(0, 0, 0, 0)
    
    return await prisma.dailyActivity.findMany({
      where: {
        userId: studentId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    })
  }
  
  static async getTeacherDailyBudget(teacherId: string, subjectId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const dailyBudget = await prisma.teacherDailyBudget.findUnique({
      where: {
        teacherId_subjectId_date: {
          teacherId,
          subjectId,
          date: startOfDay
        }
      }
    })
    
    if (!dailyBudget) {
      return {
        budget: 1000,
        used: 0,
        remaining: 1000
      }
    }
    
    return {
      budget: dailyBudget.budget,
      used: dailyBudget.used,
      remaining: dailyBudget.budget - dailyBudget.used
    }
  }
  
  static async getTeacherDailyBudgets(teacherId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const budgets = await prisma.teacherDailyBudget.findMany({
      where: {
        teacherId,
        date: startOfDay
      },
      include: {
        subject: {
          select: { name: true, code: true }
        }
      }
    })
    
    return budgets.map(budget => ({
      subject: budget.subject,
      budget: budget.budget,
      used: budget.used,
      remaining: budget.budget - budget.used
    }))
  }
  
  static async setDailyBudget(teacherId: string, subjectId: string, budget: number, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    return await prisma.teacherDailyBudget.upsert({
      where: {
        teacherId_subjectId_date: {
          teacherId,
          subjectId,
          date: startOfDay
        }
      },
      update: {
        budget
      },
      create: {
        teacherId,
        subjectId,
        date: startOfDay,
        budget,
        used: 0
      }
    })
  }
}