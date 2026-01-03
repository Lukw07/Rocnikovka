import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { ProgressionService } from "@/app/lib/services/progression"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"

/**
 * GET /api/progression/reputation
 * Get player's reputation info
 */
export async function GET(request: NextRequest) {
  try {
    const requestId = request.headers.get('x-request-id') || undefined
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return ErrorResponses.unauthorized(requestId)
    }
    
    const playerIdParam = request.nextUrl.searchParams.get('playerId')
    const playerId = playerIdParam || session.user.id
    
    if (session.user.role === UserRole.STUDENT && playerIdParam && playerIdParam !== session.user.id) {
      return ErrorResponses.forbidden(requestId)
    }
    
    const [history] = await Promise.all([
      ProgressionService.getReputationHistory(playerId, 10)
    ])
    
    return createSuccessResponse({ history }, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("API Error:", error)
    return ErrorResponses.internalError(requestId)
  }
}
