import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"
import { z } from "zod"

const createBossSchema = z.object({
  eventId: z.string(),
  name: z.string().min(3),
  description: z.string().optional(),
  maxHp: z.number().int().positive().default(1000),
  level: z.number().int().positive().default(10),
  xpRewardPerKill: z.number().int().positive().default(500),
  moneyRewardPerKill: z.number().int().positive().default(100)
})

/**
 * GET /api/events/boss - Získat boss event
 */
export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId")

  if (!eventId) {
    return ErrorResponses.badRequest("eventId is required", requestId)
  }

  const bossEvent = await prisma.bossEvent.findUnique({
    where: { eventId },
    include: {
      participants: {
        select: {
          id: true,
          userId: true,
          user: { select: { id: true, name: true } },
          totalDamage: true,
          attackCount: true
        },
        orderBy: { totalDamage: "desc" }
      },
      attacks: {
        take: 20,
        orderBy: { attackedAt: "desc" }
      }
    }
  })

  if (!bossEvent) {
    return createSuccessResponse({ bossEvent: null }, 200, requestId)
  }

  return createSuccessResponse({ bossEvent }, 200, requestId)
})

/**
 * POST /api/events/boss - Vytvořit boss event
 */
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }

  if (session.user.role !== UserRole.OPERATOR) {
    return ErrorResponses.forbidden(requestId)
  }

  const body = await request.json()
  const data = createBossSchema.parse(body)

  // Zkontroluj, že event existuje
  const event = await prisma.event.findUnique({
    where: { id: data.eventId }
  })

  if (!event) {
    return ErrorResponses.notFound("Event not found", requestId)
  }

  // Zkontroluj, zda pro event už boss existuje
  const existingBoss = await prisma.bossEvent.findUnique({
    where: { eventId: data.eventId }
  })

  if (existingBoss) {
    return ErrorResponses.conflict("Boss already exists for this event", requestId)
  }

  const bossEvent = await prisma.bossEvent.create({
    data: {
      eventId: data.eventId,
      name: data.name,
      description: data.description,
      maxHp: data.maxHp,
      currentHp: data.maxHp,
      level: data.level,
      xpRewardPerKill: data.xpRewardPerKill,
      moneyRewardPerKill: data.moneyRewardPerKill
    }
  })

  return createSuccessResponse({ bossEvent }, 201, requestId)
})
