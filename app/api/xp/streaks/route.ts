import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"

/**
 * GET /api/xp/streaks
 * Get streak information for a student
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
    
    // Authorization
    if (session.user.role === UserRole.STUDENT && studentId !== session.user.id) {
      return ErrorResponses.forbidden(requestId)
    }
    
    const streak = await prisma.streak.findUnique({
      where: { userId: studentId }
    })
    
    if (!streak) {
      return createSuccessResponse({
        studentId,
        currentStreak: 0,
        maxStreak: 0,
        xpMultiplier: 1.0,
        totalParticipation: 0,
        lastActivityDate: null,
        streakBrokenAt: null,
        isActive: false
      }, 200, requestId)
    }
    
    // Check if streak is still active (had activity today or yesterday)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null
    lastActivity?.setHours(0, 0, 0, 0)
    
    const isActive = lastActivity && (
      lastActivity.getTime() === today.getTime() || 
      lastActivity.getTime() === yesterday.getTime()
    )
    
    return createSuccessResponse({
      studentId,
      currentStreak: streak.currentStreak,
      maxStreak: streak.maxStreak,
      xpMultiplier: streak.currentMultiplier,
      totalParticipation: streak.totalParticipation,
      lastActivityDate: streak.lastActivityDate,
      streakBrokenAt: streak.streakBrokenAt,
      isActive: isActive || false
    }, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("API Error:", error)
    return ErrorResponses.internalError(requestId)
  }
}
