/**
 * Teacher Leaderboard API
 */

import { NextRequest, NextResponse } from "next/server"
import { TeacherStatsService } from "@/app/lib/services/teacher-stats"

/**
 * GET /api/teacher-stats/leaderboard
 * Get teacher leaderboard (public or semi-public)
 */
export const GET = async (request: NextRequest) => {
  const requestId = request.headers.get("x-request-id") || undefined
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get("limit") || "10")
  const metric = searchParams.get("metric") as "motivationPoints" | "totalJobsCreated" | "totalXPAwarded" || "motivationPoints"
  const period = searchParams.get("period") as "all" | "monthly" | "weekly" || "all"
  
  const leaderboard = await TeacherStatsService.getLeaderboard({
    limit,
    metric,
    period
  })
  
  return NextResponse.json({
    ok: true,
    data: { leaderboard },
    requestId
  }, { status: 200 })
}
