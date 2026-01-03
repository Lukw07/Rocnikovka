import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { BossService } from "@/app/lib/services/boss"
import { attackBossSchema } from "../../../schema"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * POST /api/events/v2/boss/dungeon/[dungeonRunId]/attack - Útok na bosse
 */
export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ dungeonRunId: string }> }
) => {
  const { dungeonRunId } = await params
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  const body = await request.json()
  const validatedData = attackBossSchema.parse(body)
  
  const result = await BossService.attackBoss(
    dungeonRunId,
    session.user.id,
    validatedData.damage
  )
  
  return createSuccessResponse(result, 200, requestId)
})

/**
 * GET /api/events/v2/boss/dungeon/[dungeonRunId]/stats - Statistiky boss fightu
 */
export const GET = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ dungeonRunId: string }> }
) => {
  const { dungeonRunId } = await params
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  const stats = await BossService.getBossFightStats(dungeonRunId)
  
  if (!stats) {
    return ErrorResponses.notFound("Boss fight not found", requestId)
  }
  
  return createSuccessResponse({ stats }, 200, requestId)
})
