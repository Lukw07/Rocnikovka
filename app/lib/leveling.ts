/**
 * Leveling System for EduRPG
 * 
 * Level Curve Design:
 * - Total XP needed for level 100: ~1,200,000 XP
 * - Assumes 4 academic years (8 semesters)
 * - Target: Reach level 100 ~1 month before end of year 4
 * - This means ~3.75 years of progression
 * - Average XP needed per day: ~1,200,000 / (3.75 * 365) ≈ 880 XP/day
 * 
 * Curve characteristics:
 * - Early levels (1-20): Fast progression, 50-200 XP per level
 * - Mid levels (21-60): Moderate progression, 200-800 XP per level  
 * - High levels (61-90): Slower progression, 800-2000 XP per level
 * - Elite levels (91-100): Very slow progression, 2000-5000 XP per level
 * 
 * Streak Bonuses:
 * - Daily streak: +5% XP per consecutive day (max 50% at 10+ day streak)
 * - Consistency bonus: Regular activity multiplies by 1.1x every 7 days
 * - Used to reward long-term engagement and prevent burnout
 * 
 * This creates a satisfying progression curve that:
 * - Rewards early engagement with quick level-ups
 * - Maintains long-term engagement through challenging high levels
 * - Prevents burnout by not requiring excessive daily grinding
 * - Allows for meaningful progression throughout the academic career
 * - Incentivizes consistent, regular participation through streak bonuses
 */

export interface LevelInfo {
  level: number
  xpRequired: number
  totalXpForLevel: number
  xpForNextLevel: number
}

export interface StreakInfo {
  currentStreak: number
  maxStreak: number
  xpMultiplier: number // 1.0 = no bonus, 1.05 = +5% bonus, etc.
  lastActivityDate: Date | null
}

export class LevelingSystem {
  /**
   * Calculate XP required for a specific level
   * Uses a modified exponential curve: base * (level ^ 1.5) + offset
   */
  static getXPForLevel(level: number): number {
    if (level <= 0) return 0
    if (level === 1) return 0
    
    // Base formula: 50 * (level ^ 1.5) + (level * 10)
    const baseXP = Math.floor(50 * Math.pow(level, 1.5) + (level * 10))
    
    // Apply curve adjustments for different level ranges
    if (level <= 20) {
      // Early levels: Faster progression
      return Math.floor(baseXP * 0.8)
    } else if (level <= 60) {
      // Mid levels: Standard progression
      return baseXP
    } else if (level <= 90) {
      // High levels: Slower progression
      return Math.floor(baseXP * 1.2)
    } else {
      // Elite levels: Very slow progression
      return Math.floor(baseXP * 1.5)
    }
  }

  /**
   * Calculate total XP needed to reach a specific level
   */
  static getTotalXPForLevel(level: number): number {
    if (level <= 0) return 0
    
    let totalXP = 0
    for (let i = 1; i <= level; i++) {
      totalXP += this.getXPForLevel(i)
    }
    return totalXP
  }

  /**
   * Get current level from total XP
   */
  static getLevelFromXP(totalXP: number): number {
    if (totalXP < 0) return 0
    
    let level = 0
    let xpNeeded = 0
    
    while (xpNeeded <= totalXP) {
      level++
      xpNeeded += this.getXPForLevel(level)
    }
    
    return level - 1
  }

  /**
   * Get detailed level information
   */
  static getLevelInfo(totalXP: number): LevelInfo {
    const currentLevel = this.getLevelFromXP(totalXP)
    const totalXpForCurrentLevel = this.getTotalXPForLevel(currentLevel)
    const xpForNextLevel = this.getXPForLevel(currentLevel + 1)
    const xpRequired = totalXpForCurrentLevel + xpForNextLevel - totalXP
    
    return {
      level: currentLevel,
      xpRequired,
      totalXpForLevel: totalXpForCurrentLevel,
      xpForNextLevel
    }
  }

  /**
   * Get progress percentage to next level
   */
  static getProgressToNextLevel(totalXP: number): number {
    const levelInfo = this.getLevelInfo(totalXP)
    const xpInCurrentLevel = totalXP - levelInfo.totalXpForLevel
    return Math.min(100, Math.max(0, (xpInCurrentLevel / levelInfo.xpForNextLevel) * 100))
  }

  /**
   * Get XP needed for next level
   */
  static getXPNeededForNextLevel(totalXP: number): number {
    const levelInfo = this.getLevelInfo(totalXP)
    return levelInfo.xpRequired
  }

  /**
   * Validate if a level is achievable within reasonable time
   * Assumes average of 500 XP per day (realistic for active students)
   */
  static isLevelAchievable(level: number, daysAvailable: number): boolean {
    const totalXPNeeded = this.getTotalXPForLevel(level)
    const averageXpPerDay = 500
    const xpNeeded = totalXPNeeded / averageXpPerDay
    
    return xpNeeded <= daysAvailable
  }

  /**
   * Get recommended daily XP target for reaching level 100
   * Assumes 3.75 years (1370 days) to reach level 100
   */
  static getRecommendedDailyXP(): number {
    const level100XP = this.getTotalXPForLevel(100)
    const daysAvailable = 1370 // 3.75 years
    return Math.ceil(level100XP / daysAvailable)
  }

  /**
   * Calculate XP multiplier based on streak
   * - Day 1: 1.0x (no bonus)
   * - Days 2-5: 1.0x + (streak * 0.05) = up to 1.25x
   * - Days 6-10: 1.25x to 1.5x
   * - Days 11+: 1.5x (capped at 50% bonus)
   */
  static getStreakMultiplier(currentStreak: number): number {
    if (currentStreak <= 1) return 1.0
    
    const multiplier = Math.min(
      1.5, // Cap at 50% bonus
      1.0 + (currentStreak * 0.05) // +5% per day in streak
    )
    
    return multiplier
  }

  /**
   * Apply streak bonus to XP amount
   * Preserves integer XP amounts while respecting multipliers
   */
  static applyStreakBonus(baseXP: number, currentStreak: number): {
    baseXP: number
    bonusXP: number
    totalXP: number
    multiplier: number
  } {
    const multiplier = this.getStreakMultiplier(currentStreak)
    const totalXP = Math.floor(baseXP * multiplier)
    const bonusXP = totalXP - baseXP
    
    return {
      baseXP,
      bonusXP,
      totalXP,
      multiplier
    }
  }
}

// Pre-calculated values for performance
export const LEVEL_100_TOTAL_XP = LevelingSystem.getTotalXPForLevel(100)
export const RECOMMENDED_DAILY_XP = LevelingSystem.getRecommendedDailyXP()

// Export key milestones for reference
export const LEVEL_MILESTONES = {
  LEVEL_10: LevelingSystem.getTotalXPForLevel(10),
  LEVEL_25: LevelingSystem.getTotalXPForLevel(25),
  LEVEL_50: LevelingSystem.getTotalXPForLevel(50),
  LEVEL_75: LevelingSystem.getTotalXPForLevel(75),
  LEVEL_90: LevelingSystem.getTotalXPForLevel(90),
  LEVEL_100: LEVEL_100_TOTAL_XP
}
