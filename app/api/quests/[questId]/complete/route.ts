import { NextRequest } from "next/server"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { QuestService } from "@/app/lib/services/quests"
import { UserRole } from "@/app/lib/generated"

/**
 * POST /api/quests/[questId]/complete - Complete a quest
 */
export const POST = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const questId = request.nextUrl.searchParams.get("questId")

    if (!questId) {
      throw new Error("Quest ID is required")
    }

    const progress = await QuestService.completeQuest(
      questId as string,
      user.id,
      requestId
    )

    return createSuccessResponse({ progress }, 200, requestId)
  })
)
