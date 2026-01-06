import { NextRequest } from "next/server"
import { withRole } from "@/app/lib/api/guards"
import { withApiErrorHandler, createSuccessResponse, ErrorResponses } from "@/app/lib/api/error-responses"
import { UserRole } from "@/app/lib/generated"
import { JobBadgeRequestService } from "@/app/lib/services/job-badge-requests"

export const GET = withApiErrorHandler(
  withRole([UserRole.OPERATOR], async (_user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const data = await JobBadgeRequestService.listPending(requestId)
    return createSuccessResponse({ requests: data }, 200, requestId)
  })
)

export const POST = withApiErrorHandler(
  withRole([UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const body = await request.json()

    if (!body?.requestId || !body?.action || !["approve", "reject"].includes(body.action)) {
      return ErrorResponses.validationError("Invalid body", new Error("requestId and action are required"), requestId)
    }

    const updated = await JobBadgeRequestService.updateStatus(
      { requestId: body.requestId, action: body.action, reviewerId: user.id },
      requestId
    )

    return createSuccessResponse({ request: updated }, 200, requestId)
  })
)
