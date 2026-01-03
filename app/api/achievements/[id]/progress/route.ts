/**
 * API Route: POST /api/achievements/[id]/progress
 * Aktualizuje progress pro progressive achievement
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { AchievementsEnhancedService } from "@/app/lib/services/achievements-enhanced"
import { z } from "zod"

const progressSchema = z.object({
  increment: z.number().int().min(1).default(1)
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
    const { increment } = progressSchema.parse(body)

    const result = await AchievementsEnhancedService.updateAchievementProgress(
      session.user.id,
      achievementId,
      increment
    )

    if (!result) {
      return NextResponse.json({
        code: 'NOT_FOUND',
        message: 'Achievement not found or not progressive'
      }, { status: 404 })
    }

    if (result.completed) {
      return NextResponse.json({
        success: true,
        completed: true,
        unlocked: result.unlocked
      })
    }

    return NextResponse.json({
      success: true,
      progress: result.progress
    })
  } catch (error) {
    console.error("Achievement progress error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
