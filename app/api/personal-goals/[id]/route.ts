import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { PersonalGoalService } from "@/app/lib/services/personal-goals"
import { UserRole } from "@/app/lib/generated"
import { z } from "zod"

const updateProgressSchema = z.object({
  increment: z.number().min(0).max(1000),
  reflection: z.string().min(10).max(1000).optional(), // Textové sebehodnocení
})

/**
 * PATCH /api/personal-goals/[id] - Aktualizuje progres cíle
 */
export const PATCH = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request, { params }: any) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const goalId = params.id

    const body = await request.json()
    const validated = updateProgressSchema.parse(body)

    const goal = await PersonalGoalService.updateProgress(
      user.id,
      goalId,
      validated.increment,
      validated.reflection,
      requestId
    )

    return createSuccessResponse({ goal }, 200, requestId)
  })
)

/**
 * DELETE /api/personal-goals/[id] - Opustí/smaže cíl
 */
export const DELETE = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request, { params }: any) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const goalId = params.id

    await PersonalGoalService.abandonGoal(user.id, goalId, requestId)

    return createSuccessResponse({ success: true }, 200, requestId)
  })
)

/**
 * GET /api/personal-goals/[id] - Získá detail konkrétního cíle
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request, { params }: any) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const goalId = params.id

    const goal = await PersonalGoalService.getGoalById(user.id, goalId, requestId)

    return createSuccessResponse({ goal }, 200, requestId)
  })
)
