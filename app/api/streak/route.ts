/**
 * API Route: GET /api/streak
 * Získá informace o streaku aktuálního uživatele
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

    const streakInfo = await StreakService.getStreakInfo(session.user.id)
    
    return NextResponse.json({ 
      streak: streakInfo,
      milestones: StreakService.MILESTONES 
    })
  } catch (error) {
    console.error("Streak GET error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
