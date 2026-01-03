import { NextRequest } from "next/server"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { VirtualAwardService } from "@/app/lib/services/virtual-awards"
import { UserRole } from "@/app/lib/generated"

/**
 * GET /api/virtual-awards - Získá všechny virtuální trofeje uživatele
 * Query params: ?userId=xxx (pro zobrazení trofejí jiného uživatele)
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request: NextRequest) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || user.id

    const awards = await VirtualAwardService.getUserAwards(userId, requestId)

    return createSuccessResponse({ awards }, 200, requestId)
  })
)
