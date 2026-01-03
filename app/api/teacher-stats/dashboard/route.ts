/**
 * Teacher Dashboard API
 * Comprehensive data for teacher motivation dashboard
 */

import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/app/lib/api/guards"
import { UserRole } from "@/app/lib/generated"
import { TeacherStatsService } from "@/app/lib/services/teacher-stats"
import { createSuccessResponse } from "@/app/lib/http/responses"

/**
 * GET /api/teacher-stats/dashboard
 * Get comprehensive teacher dashboard data
 */
export const GET = withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    
    const dashboardData = await TeacherStatsService.getTeacherDashboard(user.id)
    
    return NextResponse.json({
      ok: true,
      data: { dashboard: dashboardData },
      requestId
    }, { status: 200 })
  })
