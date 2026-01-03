/**
 * API Route: POST /api/streak/activity
 * Zaznamenává aktivitu uživatele a aktualizuje streak
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { StreakService } from "@/app/lib/services/streak"
import { z } from "zod"

const activitySchema = z.object({
  xpEarned: z.number().int().min(0).optional(),
  source: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { xpEarned, source } = activitySchema.parse(body)

    const result = await StreakService.recordActivity(
      session.user.id,
      xpEarned || 0,
      source || 'GENERAL'
    )

    return NextResponse.json({
      success: true,
      streak: result.streak,
      newStreak: result.newStreak,
      continued: result.continued,
      broken: result.broken,
      sameDay: result.sameDay,
      newMilestones: result.newMilestones,
      previousStreak: result.previousStreak
    })
  } catch (error) {
    console.error("Streak activity error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
