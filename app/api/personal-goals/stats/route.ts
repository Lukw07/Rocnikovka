import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { PersonalGoalService } from "@/app/lib/services/personal-goals"
import { UserRole } from "@/app/lib/generated"

/**
 * GET /api/personal-goals/stats - Získá statistiky osobních cílů uživatele
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const stats = await PersonalGoalService.getUserGoalStats(user.id, requestId)

    return createSuccessResponse({ stats }, 200, requestId)
  })
)
