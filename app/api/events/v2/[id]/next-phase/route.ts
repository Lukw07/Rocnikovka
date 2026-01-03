import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { EventsServiceV2 } from "@/app/lib/services/events-v2"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * POST /api/events/v2/[id]/next-phase - Odemknout další fázi
 */
export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  const result = await EventsServiceV2.unlockNextPhase(
    id,
    session.user.id
  )
  
  return createSuccessResponse(result, 200, requestId)
})
