import { NextRequest } from "next/server"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { QuestService } from "@/app/lib/services/quests"
import { UserRole } from "@/app/lib/generated"

/**
 * GET /api/quests/[questId]/progress - Get quest progress
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const progress = await QuestService.getQuestProgress(user.id)
    return createSuccessResponse({ progress }, 200, requestId)
  })
)
