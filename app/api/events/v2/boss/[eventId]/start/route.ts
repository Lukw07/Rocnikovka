import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { BossService } from "@/app/lib/services/boss"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * POST /api/events/v2/boss/[eventId]/start - Zahájit boss fight
 */
export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) => {
  const { eventId } = await params
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  const dungeonRun = await BossService.startBossFight(
    eventId,
    session.user.id
  )
  
  return createSuccessResponse({ dungeonRun }, 201, requestId)
})
