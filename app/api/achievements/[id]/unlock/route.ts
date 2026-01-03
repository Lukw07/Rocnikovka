/**
 * API Route: POST /api/achievements/[id]/unlock
 * Odemkne achievement pro uživatele a udělí odměny
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { AchievementsEnhancedService } from "@/app/lib/services/achievements-enhanced"
import { z } from "zod"

const unlockSchema = z.object({
  userId: z.string().cuid().optional() // Optional - default je current user
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: achievementId } = await params
    const body = await request.json()
    const { userId } = unlockSchema.parse(body)
    
    const targetUserId = userId || session.user.id

    // Operators mohou odemykat achievementy pro ostatní
    if (targetUserId !== session.user.id && session.user.role !== 'OPERATOR') {
      return NextResponse.json(
        { code: 'FORBIDDEN', message: 'Access denied' },
        { status: 403 }
      )
    }

    const result = await AchievementsEnhancedService.unlockAchievement(
      targetUserId,
      achievementId,
      session.user.id
    )

    if (result.alreadyUnlocked) {
      return NextResponse.json({
        success: false,
        message: 'Achievement already unlocked'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      achievement: result.achievement,
      rewards: result.rewards
    }, { status: 201 })
  } catch (error) {
    console.error("Achievement unlock error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { code: 'ERROR', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
