import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { BossService } from "@/app/lib/services/boss"
import { createBossSchema } from "../schema"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * POST /api/events/v2/boss - Vytvořit bosse pro event
 */
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  if (session.user.role !== "OPERATOR") {
    return ErrorResponses.forbidden(requestId)
  }
  
  const body = await request.json()
  const validatedData = createBossSchema.parse(body)
  
  const boss = await BossService.createBossForEvent(
    validatedData.eventId,
    {
      name: validatedData.name,
      description: validatedData.description,
      hp: validatedData.hp,
      level: validatedData.level,
      xpReward: validatedData.xpReward,
      moneyReward: validatedData.moneyReward
    }
  )
  
  return createSuccessResponse({ boss }, 201, requestId)
})
