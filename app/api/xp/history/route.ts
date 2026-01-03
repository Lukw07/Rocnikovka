import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { XPService } from "@/app/lib/services/xp"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"

/**
 * GET /api/xp/history
 * Get daily activity history for a student
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
    
    // Authorization
    if (session.user.role === UserRole.STUDENT && studentId !== session.user.id) {
      return ErrorResponses.forbidden(requestId)
    }
    
    if (isNaN(daysBack) || daysBack < 1 || daysBack > 365) {
      return ErrorResponses.badRequest("daysBack must be between 1 and 365", requestId)
    }
    
    const history = await XPService.getDailyActivityHistory(studentId, daysBack)
    
    // Calculate stats
    const stats = {
      totalDays: history.length,
      activeDays: history.filter(d => d.xpEarned > 0).length,
      totalXP: history.reduce((sum, d) => sum + d.xpEarned, 0),
      averageXPPerDay: Math.round(history.reduce((sum, d) => sum + d.xpEarned, 0) / (daysBack || 1)),
      maxXPInDay: Math.max(...history.map(d => d.xpEarned), 0),
      totalActivities: history.reduce((sum, d) => sum + d.activityCount, 0)
    }
    
    return createSuccessResponse({
      studentId,
      daysBack,
      stats,
      history: history.map(d => ({
        date: d.date,
        xpEarned: d.xpEarned,
        activityCount: d.activityCount,
        sources: d.sources
      }))
    }, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("API Error:", error)
    return ErrorResponses.internalError(requestId)
  }
}
