import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { EventsServiceV2 } from "@/app/lib/services/events-v2"
import { addEventPhasesSchema } from "../../schema"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * POST /api/events/v2/[id]/phases - Přidat fáze k story eventu
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
  
  if (session.user.role !== "OPERATOR") {
    return ErrorResponses.forbidden(requestId)
  }
  
  const body = await request.json()
  const validatedData = addEventPhasesSchema.parse(body)
  
  const phases = await EventsServiceV2.addEventPhases(
    id,
    validatedData.phases,
    session.user.id
  )
  
  return createSuccessResponse({ phases }, 201, requestId)
})
