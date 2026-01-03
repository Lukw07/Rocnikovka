import { prisma } from "../prisma"
import { LevelingSystem } from "../leveling"

/**
 * Service for managing player progression
 * Handles leveling, skillpoint distribution, and reputation
 * Integrates with XP system
 */
export class ProgressionService {
  /**
   * Award skillpoints when player levels up
   * Each level grants 1-5 skillpoints depending on level brackets
   */
  static async awardSkillpointsForLevel(userId: string, newLevel: number) {
    // Determine skillpoint rewards by level bracket
    let skillpointsToAward = 1
    
    if (newLevel <= 10) skillpointsToAward = 1
    else if (newLevel <= 25) skillpointsToAward = 1
    else if (newLevel <= 50) skillpointsToAward = 2
    else if (newLevel <= 75) skillpointsToAward = 2
    else if (newLevel <= 90) skillpointsToAward = 3
    else skillpointsToAward = 5
    
    return await prisma.skillPoint.upsert({
      where: { userId },
      update: {
        available: { increment: skillpointsToAward },
        total: { increment: skillpointsToAward }
      },
      create: {
        userId,
        available: skillpointsToAward,
        total: skillpointsToAward,
        spent: 0
      }
    })
  }
  
  /**
   * Spend skillpoint on a skill
   * Updates player skill level and spends the skillpoint
   */
  static async spendSkillpoint(
    userId: string,
    skillId: string,
    pointsToSpend: number = 1
  ) {
    return await prisma.$transaction(async (tx) => {
      // Check available skillpoints
      const skillPoints = await tx.skillPoint.findUnique({
        where: { userId }
      })
      
      if (!skillPoints || skillPoints.available < pointsToSpend) {
        throw new Error("Not enough skillpoints available")
      }
      
      // Check skill exists
      const skill = await tx.skill.findUnique({
        where: { id: skillId }
      })
      
      if (!skill) {
        throw new Error("Skill not found")
      }
      
      // Get or create player skill
      let playerSkill = await tx.playerSkill.findUnique({
        where: {
          userId_skillId: { userId, skillId }
        }
      })
      
      if (!playerSkill) {
        playerSkill = await tx.playerSkill.create({
          data: {
            userId,
            skillId,
            level: 0,
            points: 0
          }
        })
      }
      
      // Check if can level up
      if (playerSkill.level >= skill.maxLevel) {
        throw new Error(`Skill already at max level ${skill.maxLevel}`)
      }
      
      // Update skill
      const updatedSkill = await tx.playerSkill.update({
        where: { id: playerSkill.id },
        data: {
          level: playerSkill.level + 1,
          points: playerSkill.points + pointsToSpend,
          lastLeveledAt: new Date()
        }
      })
      
      // Update skillpoints
      await tx.skillPoint.update({
        where: { userId },
        data: {
          available: skillPoints.available - pointsToSpend,
          spent: skillPoints.spent + pointsToSpend
        }
      })
      
      return updatedSkill
    })
  }
  
  /**
   * Get player's progression stats
   */
  static async getProgressionStats(userId: string) {
    const [xpAudits, skillPoints, playerSkills, reputation] = await Promise.all([
      prisma.xPAudit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      }),
      prisma.skillPoint.findUnique({
        where: { userId }
      }),
      prisma.playerSkill.findMany({
        where: { userId },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
              maxLevel: true
            }
          }
        },
        orderBy: { level: "desc" }
      }),
      prisma.reputation.findUnique({
        where: { userId }
      })
    ])
    
    const totalXP = xpAudits.reduce((sum, audit) => sum + audit.amount, 0)
    const levelInfo = LevelingSystem.getLevelInfo(totalXP)
    
    // Calculate skill statistics
    const totalSkillLevels = playerSkills.reduce((sum, s) => sum + s.level, 0)
    const specializedSkill = playerSkills.length > 0 ? playerSkills[0] : null
    const skillsByCategory: Record<string, number> = {}
    
    playerSkills.forEach(ps => {
      if (ps.skill) {
        const category = ps.skill.category
        skillsByCategory[category] = (skillsByCategory[category] || 0) + ps.level
      }
    })
    
    return {
      level: levelInfo.level,
      totalXP,
      xpToNextLevel: levelInfo.xpRequired,
      xpProgress: LevelingSystem.getProgressToNextLevel(totalXP),
      skillPoints: {
        available: skillPoints?.available || 0,
        spent: skillPoints?.spent || 0,
        total: skillPoints?.total || 0
      },
      skills: {
        count: playerSkills.length,
        totalLevels: totalSkillLevels,
        averageLevel: playerSkills.length > 0 ? (totalSkillLevels / playerSkills.length).toFixed(1) : 0,
        specialized: specializedSkill ? {
          name: specializedSkill.skill?.name,
          level: specializedSkill.level,
          maxLevel: specializedSkill.skill?.maxLevel
        } : null,
        byCategory: skillsByCategory
      },
      reputation: {
        points: reputation?.points || 0,
        tier: reputation?.tier || 0
      }
    }
  }
  
  /**
   * Award reputation points for an action
   */
  static async awardReputation(
    userId: string,
    change: number,
    reason: string,
    sourceId?: string,
    sourceType?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get or create reputation
      let reputation = await tx.reputation.findUnique({
        where: { userId }
      })
      
      if (!reputation) {
        reputation = await tx.reputation.create({
          data: {
            userId,
            points: 0,
            tier: 0
          }
        })
      }
      
      // Calculate new tier
      let newTier = Math.max(0, Math.min(10, Math.floor(reputation.points / 1000)))
      
      // Update reputation
      const updated = await tx.reputation.update({
        where: { id: reputation.id },
        data: {
          points: reputation.points + change,
          tier: newTier
        }
      })
      
      // Log change
      await tx.reputationLog.create({
        data: {
          userId,
          change,
          reason,
          sourceId,
          sourceType
        }
      })
      
      return updated
    })
  }
  
  /**
   * Get reputation history
   */
  static async getReputationHistory(userId: string, limit: number = 20) {
    return await prisma.reputationLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    })
  }
}
