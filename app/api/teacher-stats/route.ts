/**
 * Teacher Statistics API
 * Endpoints for tracking teacher performance and motivation
 */

import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/app/lib/api/guards"
import { UserRole } from "@/app/lib/generated"
import { TeacherStatsService } from "@/app/lib/services/teacher-stats"
import { createSuccessResponse } from "@/app/lib/http/responses"

/**
 * GET /api/teacher-stats
 * Get teacher statistics
 */
export const GET = withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { searchParams } = new URL(request.url)
    
    const teacherId = searchParams.get("teacherId") || user.id
    
    // Only teachers can see their own stats, operators can see any
    if (user.role === UserRole.TEACHER && teacherId !== user.id) {
      return NextResponse.json({
        ok: false,
        error: "Unauthorized",
        requestId
      }, { status: 403 })
    }
    
    const stats = await TeacherStatsService.getStats(teacherId)
    const rank = await TeacherStatsService.getTeacherRank(teacherId)
    
    return NextResponse.json({
      ok: true,
      data: { stats, rank },
      requestId
    }, { status: 200 })
  })
