import { NextRequest } from "next/server"
import { z } from "zod"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { PersonalSpaceService } from "@/app/lib/services/personal-space"
import { UserRole } from "@/app/lib/generated"

const updateThemeSchema = z.object({
  theme: z.string().min(1).max(50),
  layout: z.string().optional(), // JSON string
})

/**
 * GET /api/personal-space - Získá osobní prostor uživatele
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request: NextRequest) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || user.id

    const space = await PersonalSpaceService.getUserSpace(userId, requestId)

    return createSuccessResponse({ space }, 200, requestId)
  })
)

/**
 * PUT /api/personal-space - Aktualizuje theme/layout prostoru
 */
export const PUT = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const body = await request.json()
    const validated = updateThemeSchema.parse(body)

    const space = await PersonalSpaceService.updateSpace(
      user.id,
      {
        theme: validated.theme,
        layout: validated.layout,
      },
      requestId
    )

    return createSuccessResponse({ space }, 200, requestId)
  })
)
