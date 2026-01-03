import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { EventsServiceV2 } from "@/app/lib/services/events-v2"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * GET /api/events/v2/[id] - Získat detail eventu s progress uživatele
 */
export const GET = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  const event = await EventsServiceV2.getEventWithProgress(id, session.user.id)
  
  if (!event) {
    return ErrorResponses.notFound("Event not found", requestId)
  }
  
  return createSuccessResponse({ event }, 200, requestId)
})
