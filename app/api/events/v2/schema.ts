import { z } from "zod"

// Advanced Event schemas
export const createAdvancedEventSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).trim().optional(),
  type: z.enum(["TIMED", "STORY", "BOSS_BATTLE", "SEASONAL", "COMPETITION"]),
  category: z.enum(["ACADEMIC", "SOCIAL", "COMPETITION", "SPECIAL", "SEASONAL"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  xpBonus: z.number().int().min(0).max(10000).optional(),
  coinReward: z.number().int().min(0).max(100000).optional(),
  rarityReward: z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]).optional(),
  storyContent: z.string().max(5000).optional(),
  unlockCondition: z.object({
    minLevel: z.number().int().min(1).optional(),
    requiredQuestId: z.string().optional(),
    requiredAchievementId: z.string().optional()
  }).optional(),
  itemRewards: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().min(1)
  })).optional(),
  dungeonBossId: z.string().optional()
})

export const addEventPhasesSchema = z.object({
  eventId: z.string(),
  phases: z.array(z.object({
    phaseNumber: z.number().int().min(1),
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    storyContent: z.string().max(3000).optional(),
    unlockCondition: z.object({
      minLevel: z.number().int().min(1).optional(),
      requiredQuestId: z.string().optional(),
      requiredAchievementId: z.string().optional()
    }).optional(),
    xpReward: z.number().int().min(0).optional(),
    coinReward: z.number().int().min(0).optional()
  })).min(1)
})

export const updateProgressSchema = z.object({
  progressDelta: z.number().int().min(1).max(100)
})

// Boss schemas
export const createBossSchema = z.object({
  eventId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  hp: z.number().int().min(100).max(1000000),
  level: z.number().int().min(1).max(100),
  xpReward: z.number().int().min(0).max(50000),
  moneyReward: z.number().int().min(0).max(100000)
})

export const attackBossSchema = z.object({
  damage: z.number().int().min(1).max(10000)
})

export type CreateAdvancedEventRequest = z.infer<typeof createAdvancedEventSchema>
export type AddEventPhasesRequest = z.infer<typeof addEventPhasesSchema>
export type UpdateProgressRequest = z.infer<typeof updateProgressSchema>
export type CreateBossRequest = z.infer<typeof createBossSchema>
export type AttackBossRequest = z.infer<typeof attackBossSchema>
