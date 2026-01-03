import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { VirtualAwardService } from "@/app/lib/services/virtual-awards"
import { UserRole } from "@/app/lib/generated"

/**
 * GET /api/virtual-awards/showcase - Získá nejvzácnější/nejnovější trofeje pro showcase
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const showcase = await VirtualAwardService.getShowcase(user.id, requestId)

    return createSuccessResponse({ showcase }, 200, requestId)
  })
)
