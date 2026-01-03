import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { ProgressionService } from "@/app/lib/services/progression"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"

/**
 * GET /api/progression/stats
 * Get player's complete progression stats
 */
export async function GET(request: NextRequest) {
  try {
    const requestId = request.headers.get('x-request-id') || undefined
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return ErrorResponses.unauthorized(requestId)
    }
    
    // Get query param for viewing other players (teachers/operators only)
    const playerIdParam = request.nextUrl.searchParams.get('playerId')
    const playerId = playerIdParam || session.user.id
    
    // Authorization
    if (
      session.user.role === UserRole.STUDENT && 
      playerIdParam && 
      playerIdParam !== session.user.id
    ) {
      return ErrorResponses.forbidden(requestId)
    }
    
    const stats = await ProgressionService.getProgressionStats(playerId)
    
    return createSuccessResponse(stats, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("API Error:", error)
    return ErrorResponses.internalError(requestId)
  }
}

