import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { EventsServiceV2 } from "@/app/lib/services/events-v2"
import { BossService } from "@/app/lib/services/boss"
import { 
  createAdvancedEventSchema, 
  addEventPhasesSchema,
  updateProgressSchema,
  createBossSchema,
  attackBossSchema 
} from "./schema"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"

/**
 * GET /api/events/v2 - Získat aktivní eventy podle typu
 */
export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }
  
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") as any
  
  const events = await EventsServiceV2.getActiveEventsByType(type)
  return createSuccessResponse({ events }, 200, requestId)
})

/**
 * POST /api/events/v2 - Vytvořit pokročilý event
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
  const validatedData = createAdvancedEventSchema.parse(body)
  
  const event = await EventsServiceV2.createAdvancedEvent({
    title: validatedData.title,
    description: validatedData.description,
    type: validatedData.type,
    category: validatedData.category,
    startsAt: new Date(validatedData.startsAt),
    endsAt: validatedData.endsAt ? new Date(validatedData.endsAt) : undefined,
    xpBonus: validatedData.xpBonus,
    coinReward: validatedData.coinReward,
    rarityReward: validatedData.rarityReward,
    storyContent: validatedData.storyContent,
    unlockCondition: validatedData.unlockCondition,
    itemRewards: validatedData.itemRewards,
    dungeonBossId: validatedData.dungeonBossId
  }, session.user.id)
  
  return createSuccessResponse({ event }, 201, requestId)
})
