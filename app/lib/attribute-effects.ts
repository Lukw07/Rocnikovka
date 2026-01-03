/**
 * Core Attributes Effects System
 * 
 * Defines how core attributes (Time Management, Focus, Leadership, Communication, Consistency)
 * affect the overall gamification system.
 * 
 * Each attribute has specific multipliers that are applied based on the player's level
 * in that attribute.
 */

import { prisma } from "./prisma"

export interface AttributeBonus {
  attributeName: string
  level: number
  bonusPercentage: number
}

export interface PlayerAttributeEffects {
  timeManagementBonus: number // XP gain multiplier (e.g., 1.1 = +10%)
  focusBonus: number // Skill learning speed multiplier
  leadershipBonus: number // Job reward multiplier
  communicationBonus: number // Reputation gain multiplier
  consistencyBonus: number // Streak bonus multiplier
  totalEffectPower: number // Combined effect strength (0-100 scale)
}

/**
 * Core Attributes Definition
 * Maps attribute names to their effect calculations
 */
const CORE_ATTRIBUTES = {
  TIME_MANAGEMENT: {
    name: "Time Management",
    effectType: "XP_MULTIPLIER",
    baseEffectValue: 0.02, // +2% per level
    maxBonus: 0.20 // Max +20% at level 10
  },
  FOCUS: {
    name: "Focus",
    effectType: "SKILL_LEARNING_SPEED",
    baseEffectValue: 0.03, // +3% per level
    maxBonus: 0.30 // Max +30% at level 10
  },
  LEADERSHIP: {
    name: "Leadership",
    effectType: "JOB_REWARD_MULTIPLIER",
    baseEffectValue: 0.02, // +2% per level
    maxBonus: 0.20 // Max +20% at level 10
  },
  COMMUNICATION: {
    name: "Communication",
    effectType: "REPUTATION_MULTIPLIER",
    baseEffectValue: 0.03, // +3% per level
    maxBonus: 0.30 // Max +30% at level 10
  },
  CONSISTENCY: {
    name: "Consistency",
    effectType: "STREAK_BONUS_MULTIPLIER",
    baseEffectValue: 0.015, // +1.5% per level
    maxBonus: 0.15 // Max +15% at level 10
  }
}

/**
 * Calculate multiplier bonus based on attribute level
 * @param level Current attribute level (0-10)
 * @param baseEffect Base effect per level
 * @param maxBonus Maximum bonus at level 10
 * @returns Multiplier (e.g., 1.1 for +10%)
 */
function calculateMultiplier(
  level: number,
  baseEffect: number,
  maxBonus: number
): number {
  const bonus = Math.min(maxBonus, level * baseEffect)
  return 1.0 + bonus
}

/**
 * Get all attribute effects for a player
 * @param userId Player ID
 * @returns Object with all attribute effect multipliers
 */
export async function getPlayerAttributeEffects(
  userId: string
): Promise<PlayerAttributeEffects> {
  try {
    // Get player's attribute levels
    const playerAttributes = await prisma.playerSkill.findMany({
      where: {
        userId,
        skill: {
          category: "Core"
        }
      },
      include: {
        skill: {
          select: {
            name: true
          }
        }
      }
    })

    // Build attribute map
    const attributeLevels: Record<string, number> = {}
    playerAttributes.forEach(pa => {
      if (pa.skill) {
        attributeLevels[pa.skill.name] = pa.level
      }
    })

    // Calculate each attribute bonus
    const timeManagementLevel = attributeLevels[CORE_ATTRIBUTES.TIME_MANAGEMENT.name] || 0
    const focusLevel = attributeLevels[CORE_ATTRIBUTES.FOCUS.name] || 0
    const leadershipLevel = attributeLevels[CORE_ATTRIBUTES.LEADERSHIP.name] || 0
    const communicationLevel = attributeLevels[CORE_ATTRIBUTES.COMMUNICATION.name] || 0
    const consistencyLevel = attributeLevels[CORE_ATTRIBUTES.CONSISTENCY.name] || 0

    const effects: PlayerAttributeEffects = {
      timeManagementBonus: calculateMultiplier(
        timeManagementLevel,
        CORE_ATTRIBUTES.TIME_MANAGEMENT.baseEffectValue,
        CORE_ATTRIBUTES.TIME_MANAGEMENT.maxBonus
      ),
      focusBonus: calculateMultiplier(
        focusLevel,
        CORE_ATTRIBUTES.FOCUS.baseEffectValue,
        CORE_ATTRIBUTES.FOCUS.maxBonus
      ),
      leadershipBonus: calculateMultiplier(
        leadershipLevel,
        CORE_ATTRIBUTES.LEADERSHIP.baseEffectValue,
        CORE_ATTRIBUTES.LEADERSHIP.maxBonus
      ),
      communicationBonus: calculateMultiplier(
        communicationLevel,
        CORE_ATTRIBUTES.COMMUNICATION.baseEffectValue,
        CORE_ATTRIBUTES.COMMUNICATION.maxBonus
      ),
      consistencyBonus: calculateMultiplier(
        consistencyLevel,
        CORE_ATTRIBUTES.CONSISTENCY.baseEffectValue,
        CORE_ATTRIBUTES.CONSISTENCY.maxBonus
      ),
      totalEffectPower: 0 // Will be calculated below
    }

    // Calculate total effect power (0-100 scale)
    // Sum all bonuses as percentage points
    const totalBonus =
      (effects.timeManagementBonus - 1) * 100 +
      (effects.focusBonus - 1) * 100 +
      (effects.leadershipBonus - 1) * 100 +
      (effects.communicationBonus - 1) * 100 +
      (effects.consistencyBonus - 1) * 100

    effects.totalEffectPower = Math.min(100, totalBonus)

    return effects
  } catch (error) {
    console.error("Error getting player attribute effects:", error)
    // Return neutral effects if error
    return {
      timeManagementBonus: 1.0,
      focusBonus: 1.0,
      leadershipBonus: 1.0,
      communicationBonus: 1.0,
      consistencyBonus: 1.0,
      totalEffectPower: 0
    }
  }
}

/**
 * Get attribute bonuses by name
 * @param attributeName Name of the core attribute
 * @param level Current level of the attribute
 * @returns Multiplier for that attribute
 */
export function getAttributeMultiplier(
  attributeName: string,
  level: number
): number {
  const attribute = Object.values(CORE_ATTRIBUTES).find(
    attr => attr.name === attributeName
  )

  if (!attribute) {
    return 1.0
  }

  return calculateMultiplier(level, attribute.baseEffectValue, attribute.maxBonus)
}

/**
 * Apply Time Management bonus to XP
 * @param baseXP Base XP amount
 * @param timeManagementLevel Player's Time Management level
 * @returns XP with bonus applied
 */
export function applyTimeManagementBonus(
  baseXP: number,
  timeManagementLevel: number
): number {
  const bonus = getAttributeMultiplier("Time Management", timeManagementLevel)
  return Math.floor(baseXP * bonus)
}

/**
 * Apply Leadership bonus to job rewards
 * @param baseReward Base job reward
 * @param leadershipLevel Player's Leadership level
 * @returns Reward with bonus applied
 */
export function applyLeadershipBonus(
  baseReward: number,
  leadershipLevel: number
): number {
  const bonus = getAttributeMultiplier("Leadership", leadershipLevel)
  return Math.floor(baseReward * bonus)
}

/**
 * Apply Communication bonus to reputation gains
 * @param baseReputation Base reputation change
 * @param communicationLevel Player's Communication level
 * @returns Reputation with bonus applied
 */
export function applyCommunicationBonus(
  baseReputation: number,
  communicationLevel: number
): number {
  const bonus = getAttributeMultiplier("Communication", communicationLevel)
  return Math.floor(baseReputation * bonus)
}

/**
 * Apply Consistency bonus to streak multiplier
 * @param baseMultiplier Base streak multiplier
 * @param consistencyLevel Player's Consistency level
 * @returns Multiplier with bonus applied
 */
export function applyConsistencyBonus(
  baseMultiplier: number,
  consistencyLevel: number
): number {
  const bonus = getAttributeMultiplier("Consistency", consistencyLevel)
  return baseMultiplier * bonus
}

/**
 * Apply Focus bonus to skill learning speed
 * @param baseExperience Base experience gain
 * @param focusLevel Player's Focus level
 * @returns Experience with bonus applied
 */
export function applyFocusBonus(
  baseExperience: number,
  focusLevel: number
): number {
  const bonus = getAttributeMultiplier("Focus", focusLevel)
  return Math.floor(baseExperience * bonus)
}

/**
 * Get summary of all core attributes
 */
export async function getAllCoreAttributes() {
  return await prisma.skill.findMany({
    where: {
      category: "Core"
    },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      maxLevel: true,
      unlockLevel: true,
      isActive: true
    },
    orderBy: {
      createdAt: "asc"
    }
  })
}
