import { z } from "zod"

export const createJobSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),
  description: z.string()
    .min(1, "Description is required")
    .max(1000, "Description cannot exceed 1000 characters")
    .trim(),
  subjectId: z.string().cuid("Invalid subject ID format").optional(),
  badgeId: z.string().cuid("Invalid badge ID format").optional(),
  categoryId: z.string().cuid().optional(),
  tier: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT", "LEGENDARY"]).default("BASIC"),
  xpReward: z.number()
    .int("XP reward must be an integer")
    .min(1, "XP reward must be at least 1")
    .max(10000, "XP reward cannot exceed 10,000"),
  moneyReward: z.number()
    .int("Money reward must be an integer")
    .min(0, "Money reward cannot be negative")
    .max(10000, "Money reward cannot exceed 10,000"),
  skillpointsReward: z.number()
    .int("Skillpoints reward must be an integer")
    .min(0, "Skillpoints reward cannot be negative")
    .max(10, "Skillpoints reward cannot exceed 10")
    .default(1),
  reputationReward: z.number()
    .int("Reputation reward must be an integer")
    .min(-100, "Reputation reward cannot be less than -100")
    .max(100, "Reputation reward cannot exceed 100")
    .default(0),
  maxStudents: z.number()
    .int("Max students must be an integer")
    .min(1, "Max students must be at least 1")
    .max(10, "Max students cannot exceed 10")
    .optional(),
  isTeamJob: z.boolean().default(false),
  requiredLevel: z.number().int().min(0).default(0),
  requiredSkillId: z.string().cuid().optional(),
  requiredSkillLevel: z.number().int().min(0).optional(),
  estimatedHours: z.number().int().min(1).optional()
})

export const getJobsQuerySchema = z.object({
  includeInactive: z.boolean().optional().default(false),
  subjectId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  tier: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT", "LEGENDARY"]).optional(),
  isTeamJob: z.boolean().optional()
})

export type CreateJobRequest = z.infer<typeof createJobSchema>
export type GetJobsQuery = z.infer<typeof getJobsQuerySchema>
