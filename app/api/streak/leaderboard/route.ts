/**
 * API Route: GET /api/streak/leaderboard
 * Získá žebříček nejlepších streaks
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { StreakService } from "@/app/lib/services/streak"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const topStreaks = await StreakService.getTopStreaks(limit)
    
    return NextResponse.json({ streaks: topStreaks })
  } catch (error) {
    console.error("Streak leaderboard error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
