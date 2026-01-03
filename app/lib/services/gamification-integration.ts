import { PersonalGoalService } from "./personal-goals"
import { VirtualAwardService } from "./virtual-awards"
import { NotificationService } from "./notification"
import { ItemRarity } from "../generated"
import { generateRequestId } from "../utils"

/**
 * Service pro integraci všech gamifikačních mechanik
 * Propojuje Personal Goals, Virtual Awards, Achievements, XP a další systémy
 */
export class GamificationIntegrationService {
  /**
   * Hook po udělení XP - kontroluje milníky a uděluje trofeje
   */
  static async onXPGranted(
    userId: string,
    xpAmount: number,
    reason: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Zkontrolovat a udělit trofeje za milníky
      await VirtualAwardService.checkAndAwardMilestones(userId, reqId)

      console.log(
        `[${reqId}] Integration hook: onXPGranted for user ${userId} (+${xpAmount} XP)`
      )
    } catch (error) {
      console.error(`[${reqId}] Error in onXPGranted hook:`, error)
      // Nepřerušovat hlavní flow pokud se nepodaří kontrola milníků
    }
  }

  /**
   * Hook po levelupu - udělí speciální trofeje a notifikace
   */
  static async onLevelUp(userId: string, newLevel: number, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      // Udělit trofeje za level milníky
      if (newLevel === 10) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: "První Dekáda",
            icon: "🎓",
            rarity: ItemRarity.COMMON,
          },
          reqId
        )
      }

      if (newLevel === 25) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: "Čtvrt Cesty",
            icon: "⚔️",
            rarity: ItemRarity.UNCOMMON,
          },
          reqId
        )
      }

      if (newLevel === 50) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: "Půlcestný Mistr",
            icon: "👑",
            rarity: ItemRarity.RARE,
          },
          reqId
        )
      }

      if (newLevel === 100) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: "Maximální Level!",
            icon: "⚡",
            rarity: ItemRarity.LEGENDARY,
          },
          reqId
        )

        // Speciální notifikace
        await NotificationService.createNotification(
          userId,
          "SUCCESS" as any,
          "🎉 LEGENDÁRNÍ ACHIEVEMENT!",
          "Dosáhl jsi maximálního levelu 100! Jsi absolutní legenda!",
          { link: "/dashboard/profile" }
        )
      }

      console.log(`[${reqId}] Integration hook: onLevelUp for user ${userId} (level ${newLevel})`)
    } catch (error) {
      console.error(`[${reqId}] Error in onLevelUp hook:`, error)
    }
  }

  /**
   * Hook po dokončení questu - kontroluje osobní cíle
   */
  static async onQuestCompleted(
    userId: string,
    questId: string,
    difficulty: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Zkontrolovat, zda má uživatel osobní cíl na dokončení questů
      const goals = await PersonalGoalService.getUserGoals(userId, "ACTIVE", reqId)

      for (const goal of goals) {
        // Pokud cíl souvisí s questy, aktualizovat progres
        if (
          goal.title.toLowerCase().includes("quest") ||
          goal.description?.toLowerCase().includes("quest")
        ) {
          await PersonalGoalService.updateProgress(userId, goal.id, 1, undefined, reqId)
        }
      }

      // Udělit trofeje za quest milníky
      await VirtualAwardService.checkAndAwardMilestones(userId, reqId)

      console.log(
        `[${reqId}] Integration hook: onQuestCompleted for user ${userId} (quest ${questId})`
      )
    } catch (error) {
      console.error(`[${reqId}] Error in onQuestCompleted hook:`, error)
    }
  }

  /**
   * Hook po dokončení jobu - aktualizuje relevantní osobní cíle
   */
  static async onJobCompleted(
    userId: string,
    jobId: string,
    jobTitle: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      const goals = await PersonalGoalService.getUserGoals(userId, "ACTIVE", reqId)

      for (const goal of goals) {
        if (
          goal.title.toLowerCase().includes("job") ||
          goal.title.toLowerCase().includes("úkol") ||
          goal.description?.toLowerCase().includes("job")
        ) {
          await PersonalGoalService.updateProgress(userId, goal.id, 1, undefined, reqId)
        }
      }

      console.log(
        `[${reqId}] Integration hook: onJobCompleted for user ${userId} (job ${jobId})`
      )
    } catch (error) {
      console.error(`[${reqId}] Error in onJobCompleted hook:`, error)
    }
  }

  /**
   * Hook po získání achievementu - udělit trofej
   */
  static async onAchievementEarned(
    userId: string,
    achievementName: string,
    rarity: ItemRarity,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Pokud je achievement vzácný, udělit i trofej
      if (rarity === ItemRarity.EPIC || rarity === ItemRarity.LEGENDARY) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: `Achievement: ${achievementName}`,
            icon: "🏅",
            rarity,
          },
          reqId
        )
      }

      // Zkontrolovat milníky
      await VirtualAwardService.checkAndAwardMilestones(userId, reqId)

      console.log(
        `[${reqId}] Integration hook: onAchievementEarned for user ${userId}`
      )
    } catch (error) {
      console.error(`[${reqId}] Error in onAchievementEarned hook:`, error)
    }
  }

  /**
   * Hook po dosažení streak milníku
   */
  static async onStreakMilestone(
    userId: string,
    streakDays: number,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      if (streakDays === 7) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: "Týdenní Streak",
            icon: "🔥",
            rarity: ItemRarity.COMMON,
          },
          reqId
        )
      }

      if (streakDays === 30) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: "Měsíční Streak",
            icon: "🔥🔥",
            rarity: ItemRarity.RARE,
          },
          reqId
        )
      }

      if (streakDays === 100) {
        await VirtualAwardService.awardTrophy(
          userId,
          {
            name: "Století Konzistence",
            icon: "🔥🔥🔥",
            rarity: ItemRarity.LEGENDARY,
          },
          reqId
        )
      }

      console.log(
        `[${reqId}] Integration hook: onStreakMilestone for user ${userId} (${streakDays} days)`
      )
    } catch (error) {
      console.error(`[${reqId}] Error in onStreakMilestone hook:`, error)
    }
  }

  /**
   * Hook po dosažení reputace milníku
   */
  static async onReputationMilestone(
    userId: string,
    reputation: number,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      await VirtualAwardService.checkAndAwardMilestones(userId, reqId)

      console.log(
        `[${reqId}] Integration hook: onReputationMilestone for user ${userId} (rep: ${reputation})`
      )
    } catch (error) {
      console.error(`[${reqId}] Error in onReputationMilestone hook:`, error)
    }
  }

  /**
   * Denní kontrola - zkontroluje vypršené cíle a udělí denní trofeje
   */
  static async dailyCheck(userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      // Zkontrolovat všechny aktivní cíle na expiraci
      const activeGoals = await PersonalGoalService.getUserGoals(userId, "ACTIVE", reqId)

      const now = new Date()
      for (const goal of activeGoals) {
        if (goal.deadline && goal.deadline < now) {
          // Cíl vypršel, service ho automaticky označí
          await PersonalGoalService.getUserGoals(userId, "ACTIVE", reqId)
        }
      }

      // Zkontrolovat milníky
      await VirtualAwardService.checkAndAwardMilestones(userId, reqId)

      console.log(`[${reqId}] Integration: dailyCheck completed for user ${userId}`)
    } catch (error) {
      console.error(`[${reqId}] Error in dailyCheck:`, error)
    }
  }
}
