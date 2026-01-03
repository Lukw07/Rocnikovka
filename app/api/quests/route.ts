import { NextRequest } from "next/server"
import { z } from "zod"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { QuestService } from "@/app/lib/services/quests"
import { UserRole } from "@/app/lib/generated"

const createQuestSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string().min(2).max(50),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "LEGENDARY"]),
  requiredLevel: z.number().min(0).max(100),
  xpReward: z.number().min(10).max(10000),
  moneyReward: z.number().min(0).max(5000).default(0)
})

/**
 * GET /api/quests - Get all available quests
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const quests = await QuestService.getAvailableQuests(user.id)
    return createSuccessResponse({ quests }, 200, requestId)
  })
)

/**
 * POST /api/quests - Create new quest (teachers/admins only)
 */
export const POST = withApiErrorHandler(
  withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const body = await request.json()
    const validated = createQuestSchema.parse(body)

    const quest = await QuestService.createQuest(
      {
        ...validated,
        createdBy: user.id
      },
      requestId
    )

    return createSuccessResponse(
      { quest },
      201,
      requestId
    )
  })
)
