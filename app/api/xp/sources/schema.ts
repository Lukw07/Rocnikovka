import { z } from "zod"

/**
 * Schema for getting XP sources breakdown
 */
export const getXPSourcesSchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  daysBack: z.number().int().min(1).max(365).default(30)
})

export type GetXPSourcesRequest = z.infer<typeof getXPSourcesSchema>

/**
 * Schema for getting daily activity history
 */
export const getDailyActivitySchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  daysBack: z.number().int().min(1).max(365).default(30)
})

export type GetDailyActivityRequest = z.infer<typeof getDailyActivitySchema>
