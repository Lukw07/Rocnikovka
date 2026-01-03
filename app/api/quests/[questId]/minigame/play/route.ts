import { NextRequest } from "next/server"
import { z } from "zod"
import { withApiErrorHandler, ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { QuestServiceEnhanced } from "@/app/lib/services/quests-enhanced"
import { UserRole } from "@/app/lib/generated"

const playMiniGameSchema = z.object({
  score: z.number().min(0).max(1000),
  gameData: z.any().optional()
})

/**
 * POST /api/quests/[questId]/minigame/play
 * Submit mini game results and update quest progress
 */
export const POST = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request, { params }) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { questId } = await params

    const body = await request.json()
    const validated = playMiniGameSchema.parse(body)

    // Calculate progress based on score (100 score = 100% progress)
    const progressPercent = Math.min(100, validated.score)

    const progress = await QuestServiceEnhanced.updateProgress(
      questId,
      user.id,
      progressPercent,
      validated.score,
      validated.gameData,
      requestId
    )

    return createSuccessResponse({ progress }, 200, requestId)
  })
)
