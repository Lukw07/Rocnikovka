import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"
import { z } from "zod"

const attackBossSchema = z.object({
  bossEventId: z.string(),
  damage: z.number().int().positive().default(1),
  message: z.string().optional()
})

/**
 * POST /api/events/boss/attack - Zaútoči na bosse
 */
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }

  const body = await request.json()
  const { bossEventId, damage, message } = attackBossSchema.parse(body)

  // Najdi boss event
  let bossEvent = await prisma.bossEvent.findUnique({
    where: { id: bossEventId },
    include: { participants: true }
  })

  if (!bossEvent) {
    return ErrorResponses.notFound("Boss event not found", requestId)
  }

  if (bossEvent.isDefeated) {
    return ErrorResponses.conflict("Boss is already defeated", requestId)
  }

  // Přidej útok
  const attack = await prisma.bossAttack.create({
    data: {
      bossEventId,
      userId: session.user.id,
      damage,
      message
    }
  })

  // Aktualizuj HPs bosse
  let newHp = bossEvent.currentHp - damage
  let isDefeated = false

  if (newHp <= 0) {
    newHp = 0
    isDefeated = true
  }

  await prisma.bossEvent.update({
    where: { id: bossEventId },
    data: {
      currentHp: newHp,
      isDefeated,
      defeatedAt: isDefeated ? new Date() : null
    }
  })

  // Aktualizuj eller vytvoř participanta
  let participant = bossEvent.participants.find(p => p.userId === session.user.id)
  
  if (participant) {
    await prisma.bossEventParticipant.update({
      where: { id: participant.id },
      data: {
        totalDamage: { increment: damage },
        attackCount: { increment: 1 }
      }
    })
  } else {
    await prisma.bossEventParticipant.create({
      data: {
        bossEventId,
        userId: session.user.id,
        totalDamage: damage,
        attackCount: 1
      }
    })
  }

  // Pokud je boss poražen, přidej odměny všem participantům
  if (isDefeated) {
    const allParticipants = await prisma.bossEventParticipant.findMany({
      where: { bossEventId },
      include: { user: true }
    })

    for (const p of allParticipants) {
      // Přidej peníze
      await prisma.user.update({
        where: { id: p.userId },
        data: {
          gold: { increment: bossEvent.moneyRewardPerKill }
        }
      })

      // Přidej XP audit
      await prisma.xPAudit.create({
        data: {
          userId: p.userId,
          amount: bossEvent.xpRewardPerKill,
          reason: `Boss defeated: ${bossEvent.name}`
          // source: "BOSS_EVENT" // Commented out due to type error
        }
      })
    }
  }

  return createSuccessResponse({
    attack,
    bossState: {
      currentHp: newHp,
      isDefeated,
      maxHp: bossEvent.maxHp
    }
  }, 201, requestId)
})
