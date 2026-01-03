import { prisma } from "../prisma"
import { DungeonStatus, NotificationType } from "../generated"
import { generateRequestId, logEvent } from "../utils"

/**
 * BossService - Integrace boss mechanik s event systémem
 * 
 * Kompatibilita:
 * - Propojuje existující Boss/DungeonRun systém s eventy
 * - Podporuje multiplayer boss battles
 * - Integruje se s XP a reward systémem
 */
export class BossService {
  
  /**
   * Vytvoří boss pro event
   */
  static async createBossForEvent(eventId: string, bossData: {
    name: string
    description?: string
    hp: number
    level: number
    xpReward: number
    moneyReward: number
  }) {
    const requestId = generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      // Verify event exists
      const event = await tx.event.findUnique({
        where: { id: eventId }
      })
      
      if (!event) {
        throw new Error("Event not found")
      }
      
      // Create boss
      const boss = await tx.boss.create({
        data: {
          name: bossData.name,
          description: bossData.description || null,
          hp: bossData.hp,
          maxHp: bossData.hp,
          level: bossData.level,
          xpReward: bossData.xpReward,
          moneyReward: bossData.moneyReward,
          isActive: true
        }
      })
      
      // Link boss to event
      await tx.event.update({
        where: { id: eventId },
        data: { dungeonBossId: boss.id }
      })
      
      await logEvent("INFO", "boss_created_for_event", {
        userId: "system",
        requestId,
        metadata: { eventId, bossId: boss.id, bossName: boss.name }
      })
      
      return boss
    })
  }
  
  /**
   * Zahájí boss fight pro uživatele
   */
  static async startBossFight(eventId: string, userId: string) {
    const requestId = generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      // Get event with boss
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { 
          participations: { where: { userId } }
        }
      })
      
      if (!event || !event.dungeonBossId) {
        throw new Error("Event not found or has no boss")
      }
      
      // Check participation
      if (!event.participations.length) {
        throw new Error("User must participate in event first")
      }
      
      // Get boss
      const boss = await tx.boss.findUnique({
        where: { id: event.dungeonBossId }
      })
      
      if (!boss || !boss.isActive) {
        throw new Error("Boss not found or inactive")
      }
      
      // Check if user already has active dungeon run for this boss
      const existingRun = await tx.dungeonRun.findFirst({
        where: {
          bossId: boss.id,
          leaderId: userId,
          status: { in: [DungeonStatus.AVAILABLE, DungeonStatus.IN_COMBAT] }
        }
      })
      
      if (existingRun) {
        return existingRun // Return existing run
      }
      
      // Create new dungeon run
      const dungeonRun = await tx.dungeonRun.create({
        data: {
          bossId: boss.id,
          leaderId: userId,
          status: DungeonStatus.IN_COMBAT,
          currentHp: boss.hp,
          totalDamage: 0,
          participantIds: [userId]
        }
      })
      
      // Notify user
      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.BOSS_SPAWNED,
          title: `Boss Fight: ${boss.name}`,
          message: `Level ${boss.level} - HP: ${boss.hp}`,
          data: { eventId, bossId: boss.id, dungeonRunId: dungeonRun.id }
        }
      })
      
      await logEvent("INFO", "boss_fight_started", {
        userId,
        requestId,
        metadata: { eventId, bossId: boss.id, dungeonRunId: dungeonRun.id }
      })
      
      return dungeonRun
    })
  }
  
  /**
   * Útok na bosse
   */
  static async attackBoss(dungeonRunId: string, userId: string, damage: number) {
    const requestId = generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      // Get dungeon run
      const dungeonRun = await tx.dungeonRun.findUnique({
        where: { id: dungeonRunId },
        include: { boss: true }
      })
      
      if (!dungeonRun) {
        throw new Error("Dungeon run not found")
      }
      
      if (dungeonRun.status !== DungeonStatus.IN_COMBAT) {
        throw new Error("This boss fight is not active")
      }
      
      // Add user to participants if not already there
      let participantIds = dungeonRun.participantIds
      if (!participantIds.includes(userId)) {
        participantIds = [...participantIds, userId]
      }
      
      // Calculate new HP
      const newHp = Math.max(0, dungeonRun.currentHp - damage)
      const isDefeated = newHp === 0
      
      // Update dungeon run
      const updated = await tx.dungeonRun.update({
        where: { id: dungeonRunId },
        data: {
          currentHp: newHp,
          totalDamage: dungeonRun.totalDamage + damage,
          participantIds,
          status: isDefeated ? DungeonStatus.COMPLETED : DungeonStatus.IN_COMBAT,
          completedAt: isDefeated ? new Date() : null
        }
      })
      
      // Log damage
      await tx.damageLog.create({
        data: {
          dungeonRunId,
          userId,
          damage
        }
      })
      
      // If boss defeated, award rewards
      if (isDefeated) {
        await this.awardBossRewards(dungeonRun.boss, participantIds, tx)
        
        // Notify all participants
        for (const participantId of participantIds) {
          await tx.notification.create({
            data: {
              userId: participantId,
              type: NotificationType.BOSS_DEFEATED,
              title: `Boss Defeated!`,
              message: `${dungeonRun.boss.name} has been defeated!`,
              data: {
                bossId: dungeonRun.bossId,
                dungeonRunId,
                xpReward: dungeonRun.boss.xpReward,
                moneyReward: dungeonRun.boss.moneyReward
              }
            }
          })
        }
      }
      
      await logEvent("INFO", "boss_attacked", {
        userId,
        requestId,
        metadata: {
          dungeonRunId,
          bossId: dungeonRun.bossId,
          damage,
          remainingHp: newHp,
          isDefeated
        }
      })
      
      return { dungeonRun: updated, isDefeated, remainingHp: newHp }
    })
  }
  
  /**
   * Udělí odměny za poražení bosse
   */
  private static async awardBossRewards(boss: any, participantIds: string[], tx: any) {
    // Award XP and money to all participants
    for (const participantId of participantIds) {
      // Log rewards (MoneyService integration needed for actual money transfer)
      await logEvent("INFO", "boss_rewards_awarded", {
        userId: participantId,
        metadata: {
          bossId: boss.id,
          xpReward: boss.xpReward,
          moneyReward: boss.moneyReward
        }
      })
    }
  }
  
  /**
   * Získá aktivní boss fights pro uživatele
   */
  static async getActiveBossFights(userId: string) {
    return await prisma.dungeonRun.findMany({
      where: {
        OR: [
          { leaderId: userId },
          { participantIds: { has: userId } }
        ],
        status: { in: [DungeonStatus.IN_COMBAT, DungeonStatus.AVAILABLE] }
      },
      include: {
        boss: true,
        damageLog: {
          where: { userId },
          orderBy: { timestamp: "desc" }
        }
      },
      orderBy: { startedAt: "desc" }
    })
  }
  
  /**
   * Získá statistiky boss fightu
   */
  static async getBossFightStats(dungeonRunId: string) {
    const dungeonRun = await prisma.dungeonRun.findUnique({
      where: { id: dungeonRunId },
      include: {
        boss: true,
        damageLog: {
          include: {
            dungeonRun: {
              select: {
                participantIds: true
              }
            }
          }
        }
      }
    })
    
    if (!dungeonRun) return null
    
    // Calculate damage per user
    const damageByUser = dungeonRun.damageLog.reduce((acc, log) => {
      acc[log.userId] = (acc[log.userId] || 0) + log.damage
      return acc
    }, {} as Record<string, number>)
    
    return {
      dungeonRun,
      totalDamage: dungeonRun.totalDamage,
      remainingHp: dungeonRun.currentHp,
      progress: Math.round((dungeonRun.totalDamage / dungeonRun.boss.maxHp) * 100),
      participantCount: dungeonRun.participantIds.length,
      damageByUser,
      topDamageDealer: Object.entries(damageByUser).sort(([, a], [, b]) => b - a)[0]
    }
  }
  
  /**
   * Získá leaderboard pro konkrétního bosse
   */
  static async getBossLeaderboard(bossId: string, limit: number = 10) {
    const damageLogs = await prisma.damageLog.findMany({
      where: {
        dungeonRun: { bossId }
      },
      include: {
        dungeonRun: {
          select: {
            status: true,
            boss: { select: { name: true } }
          }
        }
      }
    })
    
    // Aggregate damage by user
    const userDamage = damageLogs.reduce((acc, log) => {
      const existing = acc[log.userId]
      if (existing) {
        existing.totalDamage += log.damage
        existing.attacks += 1
      } else {
        acc[log.userId] = { userId: log.userId, totalDamage: log.damage, attacks: 1 }
      }
      return acc
    }, {} as Record<string, { userId: string; totalDamage: number; attacks: number }>)
    
    // Sort and get users
    const sortedUsers = Object.values(userDamage)
      .sort((a, b) => b.totalDamage - a.totalDamage)
      .slice(0, limit)
    
    // Get user details
    const usersWithDetails = await Promise.all(
      sortedUsers.map(async (u) => {
        const user = await prisma.user.findUnique({
          where: { id: u.userId },
          select: { id: true, name: true, avatarUrl: true }
        })
        return { ...u, user }
      })
    )
    
    return usersWithDetails
  }
}
