import { NextRequest } from "next/server"
import { withApiErrorHandler, createSuccessResponse } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { UserRole } from "@/app/lib/generated"
import { ActivityService } from "@/app/lib/services/activity"

export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT, UserRole.TEACHER, UserRole.OPERATOR], async (user, request: NextRequest) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 50
    const since = searchParams.get("since") ? new Date(searchParams.get("since") as string) : undefined
    const typesParam = searchParams.get("types")
    const types = typesParam ? typesParam.split(",").map((t) => t.trim()).filter(Boolean) : undefined

    const activity = await ActivityService.getPlayerActivity({ userId: user.id, limit, since, types }, requestId)
    return createSuccessResponse({ activity }, 200, requestId)
  })
)
