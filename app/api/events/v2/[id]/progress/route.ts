import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { EventsServiceV2 } from "@/app/lib/services/events-v2"
import { updateProgressSchema } from "../../schema"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * PATCH /api/events/v2/[id]/progress - Aktualizovat progress
 */
export const PATCH = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  const body = await request.json()
  const validatedData = updateProgressSchema.parse(body)
  
  const participation = await EventsServiceV2.updateProgress(
    id,
    session.user.id,
    validatedData.progressDelta
  )
  
  return createSuccessResponse({ participation }, 200, requestId)
})
