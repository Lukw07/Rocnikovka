import { prisma } from "../prisma"
import { GoalStatus } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"
import { XPService } from "./xp"
import { NotificationService } from "./notification"

/**
 * Service pro správu osobních cílů
 * Podporuje vytváření, tracking a completion s textovým sebehodnocením
 */
export class PersonalGoalService {
  /**
   * Získá všechny cíle uživatele podle statusu
   */
  static async getUserGoals(
    userId: string,
    status: GoalStatus = GoalStatus.ACTIVE,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      const goals = await prisma.personalGoal.findMany({
        where: {
          userId,
          status,
        },
        orderBy: [
          { deadline: "asc" },
          { createdAt: "desc" },
        ],
      })

      // Zkontrolovat vypršelé cíle
      const now = new Date()
      for (const goal of goals) {
        if (
          goal.deadline &&
          goal.deadline < now &&
          goal.status === GoalStatus.ACTIVE
        ) {
          await this.expireGoal(goal.id, reqId)
        }
      }

      console.log(
        `[${reqId}] Retrieved ${goals.length} ${status} goals for user ${sanitizeForLog(userId)}`
      )

      return goals
    } catch (error) {
      console.error(`[${reqId}] Error getting user goals:`, error)
      throw error
    }
  }

  /**
   * Vytvoří nový osobní cíl
   */
  static async createGoal(
    userId: string,
    data: {
      title: string
      description?: string
      targetValue: number
      reward: number
      deadline?: Date | null
    },
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Zkontrolovat, že deadline není v minulosti
      if (data.deadline && data.deadline < new Date()) {
        throw new Error("Deadline cannot be in the past")
      }

      const goal = await prisma.personalGoal.create({
        data: {
          userId,
          title: data.title,
          description: data.description || null,
          targetValue: data.targetValue,
          currentValue: 0,
          reward: data.reward,
          deadline: data.deadline || null,
          status: GoalStatus.ACTIVE,
        },
      })

      console.log(
        `[${reqId}] Created personal goal ${goal.id} for user ${sanitizeForLog(userId)}`
      )

      // Notifikace
      await NotificationService.createNotification(
        userId,
        "SYSTEM" as any,
        "🎯 Nový osobní cíl!",
        `Vytvořil jsi si cíl: ${goal.title}`,
        { link: `/dashboard/goals/${goal.id}` }
      )

      return goal
    } catch (error) {
      console.error(`[${reqId}] Error creating goal:`, error)
      throw error
    }
  }

  /**
   * Aktualizuje progres cíle s možností přidat textové sebehodnocení
   */
  static async updateProgress(
    userId: string,
    goalId: string,
    increment: number,
    reflection?: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Najít cíl a zkontrolovat vlastnictví
      const goal = await prisma.personalGoal.findFirst({
        where: {
          id: goalId,
          userId,
          status: GoalStatus.ACTIVE,
        },
      })

      if (!goal) {
        throw new Error("Goal not found or not active")
      }

      // Zkontrolovat deadline
      if (goal.deadline && goal.deadline < new Date()) {
        await this.expireGoal(goalId, reqId)
        throw new Error("Goal has expired")
      }

      const newValue = Math.min(goal.currentValue + increment, goal.targetValue)
      const isCompleted = newValue >= goal.targetValue

      // Update s reflexí
      const updated = await prisma.personalGoal.update({
        where: { id: goalId },
        data: {
          currentValue: newValue,
          reflection: reflection || goal.reflection,
          ...(isCompleted && {
            status: GoalStatus.COMPLETED,
            completedAt: new Date(),
          }),
        },
      })

      console.log(
        `[${reqId}] Updated goal ${goalId} progress: ${newValue}/${goal.targetValue}`
      )

      // Pokud je dokončen, udělit odměny
      if (isCompleted) {
        await this.completeGoal(userId, goalId, reqId)
      }

      return updated
    } catch (error) {
      console.error(`[${reqId}] Error updating goal progress:`, error)
      throw error
    }
  }

  /**
   * Dokončí cíl a udělí odměny
   */
  private static async completeGoal(
    userId: string,
    goalId: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      const goal = await prisma.personalGoal.findUnique({
        where: { id: goalId },
      })

      if (!goal) return

      // Udělit XP odměnu (using XP audit system directly)
      await prisma.xPAudit.create({
        data: {
          userId,
          amount: goal.reward,
          reason: `Dokončení osobního cíle: ${goal.title}`
        }
      })

      // Notifikace o dokončení
      await NotificationService.createNotification(
        userId,
        "SUCCESS" as any,
        "🎉 Cíl dokončen!",
        `Dokončil jsi cíl "${goal.title}" a získal ${goal.reward} XP!`,
        { link: `/dashboard/goals` }
      )

      console.log(
        `[${reqId}] Completed goal ${goalId} - Rewarded ${goal.reward} XP`
      )
    } catch (error) {
      console.error(`[${reqId}] Error completing goal:`, error)
      throw error
    }
  }

  /**
   * Opustí/smaže aktivní cíl
   */
  static async abandonGoal(
    userId: string,
    goalId: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      const goal = await prisma.personalGoal.findFirst({
        where: {
          id: goalId,
          userId,
          status: GoalStatus.ACTIVE,
        },
      })

      if (!goal) {
        throw new Error("Goal not found or not active")
      }

      await prisma.personalGoal.update({
        where: { id: goalId },
        data: { status: GoalStatus.ABANDONED },
      })

      console.log(`[${reqId}] Abandoned goal ${goalId}`)

      return true
    } catch (error) {
      console.error(`[${reqId}] Error abandoning goal:`, error)
      throw error
    }
  }

  /**
   * Označí cíl jako vypršený
   */
  private static async expireGoal(goalId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      await prisma.personalGoal.update({
        where: { id: goalId },
        data: { status: GoalStatus.EXPIRED },
      })

      console.log(`[${reqId}] Expired goal ${goalId}`)
    } catch (error) {
      console.error(`[${reqId}] Error expiring goal:`, error)
    }
  }

  /**
   * Získá detail konkrétního cíle
   */
  static async getGoalById(
    userId: string,
    goalId: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      const goal = await prisma.personalGoal.findFirst({
        where: {
          id: goalId,
          userId,
        },
      })

      if (!goal) {
        throw new Error("Goal not found")
      }

      return goal
    } catch (error) {
      console.error(`[${reqId}] Error getting goal:`, error)
      throw error
    }
  }

  /**
   * Získá statistiky osobních cílů uživatele
   */
  static async getUserGoalStats(userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      const [total, completed, active, abandoned, expired] = await Promise.all([
        prisma.personalGoal.count({ where: { userId } }),
        prisma.personalGoal.count({
          where: { userId, status: GoalStatus.COMPLETED },
        }),
        prisma.personalGoal.count({
          where: { userId, status: GoalStatus.ACTIVE },
        }),
        prisma.personalGoal.count({
          where: { userId, status: GoalStatus.ABANDONED },
        }),
        prisma.personalGoal.count({
          where: { userId, status: GoalStatus.EXPIRED },
        }),
      ])

      const completionRate = total > 0 ? (completed / total) * 100 : 0

      return {
        total,
        completed,
        active,
        abandoned,
        expired,
        completionRate: Math.round(completionRate * 10) / 10,
      }
    } catch (error) {
      console.error(`[${reqId}] Error getting goal stats:`, error)
      throw error
    }
  }
}
