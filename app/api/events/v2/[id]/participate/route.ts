import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { EventsServiceV2 } from "@/app/lib/services/events-v2"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * POST /api/events/v2/[id]/participate - Účast na pokročilém eventu
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
  
  const participation = await EventsServiceV2.participateAdvanced(
    id,
    session.user.id
  )
  
  return createSuccessResponse({ participation }, 201, requestId)
})
