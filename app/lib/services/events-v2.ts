import { prisma } from "../prisma"
import { EventType, EventCategory, EventRewardType, NotificationType } from "../generated"
import { generateRequestId, logEvent } from "../utils"
import { XPService } from "./xp"

/**
 * EventsServiceV2 - Rozšíření event systému o story-driven eventy, boss mechaniky a fáze
 * 
 * Kompatibilita:
 * - Navazuje na existující EventsService
 * - Integruje se s XP systémem
 * - Podporuje notifikace
 * - Propojuje se s existujícím Boss/DungeonRun systémem
 */
export class EventsServiceV2 {
  
  /**
   * Vytvoří pokročilý event (story, boss battle, seasonal)
   */
  static async createAdvancedEvent(data: {
    title: string
    description?: string | null
    type: EventType
    category: EventCategory
    startsAt: Date
    endsAt?: Date | null
    xpBonus?: number
    coinReward?: number
    rarityReward?: string | null
    storyContent?: string | null
    unlockCondition?: any
    itemRewards?: any
    dungeonBossId?: string | null
  }, createdBy: string) {
    const requestId = generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      // Verify OPERATOR role
      const creator = await tx.user.findFirst({
        where: { id: createdBy, role: "OPERATOR" }
      })
      
      if (!creator) {
        throw new Error("Only operators can create advanced events")
      }
      
      // Create event with advanced features
      const event = await tx.event.create({
        data: {
          title: data.title,
          description: data.description || null,
          type: data.type,
          category: data.category,
          startsAt: data.startsAt,
          endsAt: data.endsAt || null,
          xpBonus: data.xpBonus || 0,
          coinReward: data.coinReward || 0,
          rarityReward: data.rarityReward as any,
          storyContent: data.storyContent || null,
          unlockCondition: data.unlockCondition || null,
          itemRewards: data.itemRewards || null,
          dungeonBossId: data.dungeonBossId || null
        }
      })
      
      // Log event creation
      await logEvent("INFO", "advanced_event_created", {
        userId: createdBy,
        requestId,
        metadata: {
          eventId: event.id,
          title: event.title,
          type: data.type,
          category: data.category
        }
      })
      
      return event
    })
  }
  
  /**
   * Přidá fáze pro story-driven event
   */
  static async addEventPhases(eventId: string, phases: Array<{
    phaseNumber: number
    title: string
    description?: string | null
    storyContent?: string | null
    unlockCondition?: any
    xpReward?: number
    coinReward?: number
  }>, createdBy: string) {
    const requestId = generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      // Verify event exists and is story type
      const event = await tx.event.findUnique({
        where: { id: eventId }
      })
      
      if (!event) {
        throw new Error("Event not found")
      }
      
      if (event.type !== "STORY") {
        throw new Error("Phases can only be added to story events")
      }
      
      // Create all phases
      const createdPhases = await Promise.all(
        phases.map(phase => 
          tx.eventPhase.create({
            data: {
              eventId,
              phaseNumber: phase.phaseNumber,
              title: phase.title,
              description: phase.description || null,
              storyContent: phase.storyContent || null,
              unlockCondition: phase.unlockCondition || null,
              xpReward: phase.xpReward || 0,
              coinReward: phase.coinReward || 0
            }
          })
        )
      )
      
      await logEvent("INFO", "event_phases_created", {
        userId: createdBy,
        requestId,
        metadata: {
          eventId,
          phaseCount: createdPhases.length
        }
      })
      
      return createdPhases
    })
  }
  
  /**
   * Účast na pokročilém eventu s kontrolou unlock podmínek
   */
  static async participateAdvanced(eventId: string, userId: string) {
    const requestId = generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      const event = await tx.event.findFirst({
        where: { id: eventId, isActive: true },
        include: { phases: true }
      })
      
      if (!event) {
        throw new Error("Event not found or inactive")
      }
      
      // Check time window
      const now = new Date()
      if (now < event.startsAt || (event.endsAt && now > event.endsAt)) {
        throw new Error("Event is not currently active")
      }
      
      // Check unlock conditions
      if (event.unlockCondition) {
        const meetsCondition = await this.checkUnlockCondition(
          userId, 
          event.unlockCondition as any, 
          tx
        )
        
        if (!meetsCondition) {
          throw new Error("You don't meet the unlock conditions for this event")
        }
      }
      
      // Check for existing participation
      const existing = await tx.eventParticipation.findUnique({
        where: { eventId_userId: { eventId, userId } }
      })
      
      if (existing) {
        return existing
      }
      
      // Create participation
      const participation = await tx.eventParticipation.create({
        data: {
          eventId,
          userId,
          requestId,
          progress: 0,
          currentPhaseId: event.phases[0]?.id || null
        }
      })
      
      // Send notification
      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.EVENT_STARTED,
          title: `Event Started: ${event.title}`,
          message: event.description || "A new event has begun!",
          data: { eventId }
        }
      })
      
      await logEvent("INFO", "advanced_event_participation", {
        userId,
        requestId,
        metadata: { eventId, eventType: event.type }
      })
      
      return participation
    })
  }
  
  /**
   * Aktualizuje progress uživatele v eventu
   */
  static async updateProgress(eventId: string, userId: string, progressDelta: number) {
    return await prisma.$transaction(async (tx) => {
      const participation = await tx.eventParticipation.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: { event: true }
      })
      
      if (!participation) {
        throw new Error("User is not participating in this event")
      }
      
      const newProgress = Math.min(100, participation.progress + progressDelta)
      const isCompleted = newProgress >= 100
      
      const updated = await tx.eventParticipation.update({
        where: { id: participation.id },
        data: {
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })
      
      // Award completion rewards
      if (isCompleted && !participation.isCompleted) {
        await this.awardEventRewards(eventId, userId, tx)
      }
      
      return updated
    })
  }
  
  /**
   * Odemkne další fázi story eventu
   */
  static async unlockNextPhase(eventId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const participation = await tx.eventParticipation.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: {
          event: { include: { phases: { orderBy: { phaseNumber: "asc" } } } },
          currentPhase: true
        }
      })
      
      if (!participation || !participation.event.phases.length) {
        throw new Error("Invalid participation or no phases available")
      }
      
      const currentPhaseIndex = participation.event.phases.findIndex(
        p => p.id === participation.currentPhaseId
      )
      
      if (currentPhaseIndex === -1 || currentPhaseIndex >= participation.event.phases.length - 1) {
        throw new Error("No next phase available")
      }
      
      const nextPhase = participation.event.phases[currentPhaseIndex + 1]
      if (!nextPhase) {
        throw new Error("No next phase available")
      }
      
      // Check unlock condition for next phase
      if (nextPhase.unlockCondition) {
        const meetsCondition = await this.checkUnlockCondition(
          userId,
          nextPhase.unlockCondition as any,
          tx
        )
        
        if (!meetsCondition) {
          throw new Error("You don't meet the unlock conditions for the next phase")
        }
      }
      
      // Update participation to next phase
      const updated = await tx.eventParticipation.update({
        where: { id: participation.id },
        data: { currentPhaseId: nextPhase.id }
      })
      
      // Award phase rewards
      if (nextPhase.xpReward > 0) {
        await XPService.grantXP({
          studentId: userId,
          teacherId: "system",
          subjectId: "system",
          amount: nextPhase.xpReward,
          reason: `Phase ${nextPhase.phaseNumber} completed: ${nextPhase.title}`
        })
      }
      
      // Send notification
      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.EVENT_PHASE_UNLOCKED,
          title: `New Phase Unlocked!`,
          message: `Phase ${nextPhase.phaseNumber}: ${nextPhase.title}`,
          data: { eventId, phaseId: nextPhase.id }
        }
      })
      
      return { participation: updated, phase: nextPhase }
    })
  }
  
  /**
   * Kontroluje, zda uživatel splňuje unlock podmínky
   */
  private static async checkUnlockCondition(
    userId: string,
    condition: any,
    tx: any
  ): Promise<boolean> {
    if (!condition) return true
    
    // Check level requirement
    if (condition.minLevel) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { grade: true }
      })
      if (!user || (user.grade || 0) < condition.minLevel) {
        return false
      }
    }
    
    // Check quest completion
    if (condition.requiredQuestId) {
      const questProgress = await tx.questProgress.findFirst({
        where: {
          userId,
          questId: condition.requiredQuestId,
          status: "COMPLETED"
        }
      })
      if (!questProgress) return false
    }
    
    // Check achievement
    if (condition.requiredAchievementId) {
      const achievement = await tx.achievementAward.findFirst({
        where: {
          userId,
          achievementId: condition.requiredAchievementId
        }
      })
      if (!achievement) return false
    }
    
    return true
  }
  
  /**
   * Udělí odměny za dokončení eventu
   */
  private static async awardEventRewards(eventId: string, userId: string, tx: any) {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { rewards: true }
    })
    
    if (!event) return
    
    // Award XP
    if (event.xpBonus > 0) {
      await XPService.grantXP({
        studentId: userId,
        teacherId: "system",
        subjectId: "system",
        amount: event.xpBonus,
        reason: `Event completed: ${event.title}`
      })
    }
    
    // Award coins (would need MoneyService integration)
    if (event.coinReward > 0) {
      await logEvent("INFO", "event_coin_reward", {
        userId,
        metadata: { eventId, coinReward: event.coinReward }
      })
    }
    
    // Send completion notification
    await tx.notification.create({
      data: {
        userId,
        type: NotificationType.REWARD_RECEIVED,
        title: `Event Completed!`,
        message: `You've completed ${event.title} and earned rewards!`,
        data: {
          eventId,
          xpReward: event.xpBonus,
          coinReward: event.coinReward
        }
      }
    })
  }
  
  /**
   * Získá aktivní eventy podle typu
   */
  static async getActiveEventsByType(type?: EventType) {
    const now = new Date()
    
    return await prisma.event.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [
          { endsAt: null },
          { endsAt: { gte: now } }
        ],
        ...(type && { type })
      },
      include: {
        phases: { orderBy: { phaseNumber: "asc" } },
        rewards: true,
        _count: { select: { participations: true } }
      },
      orderBy: { startsAt: "desc" }
    })
  }
  
  /**
   * Získá detaily eventu s progress uživatele
   */
  static async getEventWithProgress(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        phases: { orderBy: { phaseNumber: "asc" } },
        rewards: true,
        participations: {
          where: { userId },
          include: { currentPhase: true }
        }
      }
    })
    
    if (!event) return null
    
    const userParticipation = event.participations[0] || null
    
    return {
      ...event,
      userParticipation,
      isParticipating: !!userParticipation,
      userProgress: userParticipation?.progress || 0,
      currentPhase: userParticipation?.currentPhase || event.phases[0] || null
    }
  }
}
