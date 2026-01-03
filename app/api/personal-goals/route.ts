import { NextRequest } from "next/server"
import { z } from "zod"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { PersonalGoalService } from "@/app/lib/services/personal-goals"
import { UserRole } from "@/app/lib/generated"

const createGoalSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500).optional(),
  targetValue: z.number().min(1).max(1000),
  reward: z.number().min(10).max(1000),
  deadline: z.string().datetime().optional(), // ISO datetime string
})

/**
 * GET /api/personal-goals - Získá osobní cíle aktuálního uživatele
 * Query params: ?status=ACTIVE|COMPLETED|ABANDONED|EXPIRED
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request: NextRequest) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "ACTIVE"

    const goals = await PersonalGoalService.getUserGoals(
      user.id,
      status as any,
      requestId
    )

    return createSuccessResponse({ goals }, 200, requestId)
  })
)

/**
 * POST /api/personal-goals - Vytvoří nový osobní cíl
 */
export const POST = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const body = await request.json()
    const validated = createGoalSchema.parse(body)

    const goal = await PersonalGoalService.createGoal(
      user.id,
      {
        ...validated,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
      },
      requestId
    )

    return createSuccessResponse({ goal }, 201, requestId)
  })
)
