import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { XPService } from "@/app/lib/services/xp"
import { UserRole } from "@/app/lib/generated"
import { logEvent } from "@/app/lib/utils"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"

/**
 * GET /api/xp/sources
 * Get XP breakdown by source type for a student (last 30 days by default)
 */
export async function GET(request: NextRequest) {
  try {
    const requestId = request.headers.get('x-request-id') || undefined
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return ErrorResponses.unauthorized(requestId)
    }
    
    // Get query params
    const studentId = request.nextUrl.searchParams.get('studentId') || session.user.id
    const daysBack = parseInt(request.nextUrl.searchParams.get('daysBack') || '30', 10)
    
    // Authorization: students can only see their own, teachers/operators can see all
    if (session.user.role === UserRole.STUDENT && studentId !== session.user.id) {
      return ErrorResponses.forbidden(requestId)
    }
    
    // Validate daysBack
    if (isNaN(daysBack) || daysBack < 1 || daysBack > 365) {
      return ErrorResponses.badRequest("daysBack must be between 1 and 365", requestId)
    }
    
    const breakdown = await XPService.getXPBreakdown(studentId, daysBack)
    
    return createSuccessResponse({
      studentId,
      daysBack,
      breakdown,
      summary: {
        totalXP: breakdown.reduce((sum, s) => sum + s.totalXP, 0),
        totalBonusXP: breakdown.reduce((sum, s) => sum + s.bonusXP, 0),
        sourceCount: breakdown.length,
        activityCount: breakdown.reduce((sum, s) => sum + s.count, 0)
      }
    }, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("API Error:", error)
    return ErrorResponses.internalError(requestId)
  }
}
