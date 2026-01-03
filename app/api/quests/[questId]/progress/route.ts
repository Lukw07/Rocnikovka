import { NextRequest } from "next/server"
import { z } from "zod"
import { withApiErrorHandler, ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { QuestServiceEnhanced } from "@/app/lib/services/quests-enhanced"
import { UserRole } from "@/app/lib/generated"

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100)
})

/**
 * PATCH /api/quests/[questId]/progress
 * Update quest progress manually
 */
export const PATCH = withApiErrorHandler(
  withRole([UserRole.STUDENT, UserRole.TEACHER, UserRole.OPERATOR], async (user, request, { params }) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { questId } = await params

    const body = await request.json()
    const validated = updateProgressSchema.parse(body)

    const progress = await QuestServiceEnhanced.updateProgress(
      questId,
      user.id,
      validated.progress,
      undefined,
      undefined,
      requestId
    )

    return createSuccessResponse({ progress }, 200, requestId)
  })
)

/**
 * GET /api/quests/[questId]/progress
 * Get quest progress for current user
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request, { params }) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { questId } = await params

    const progress = await QuestServiceEnhanced.getAvailableQuests(user.id, {})
    const questProgress = progress.find(q => q.id === questId)?.userProgress

    if (!questProgress) {
      return ErrorResponses.notFound("Quest progress not found", requestId)
    }

    return createSuccessResponse({ progress: questProgress }, 200, requestId)
  })
)
