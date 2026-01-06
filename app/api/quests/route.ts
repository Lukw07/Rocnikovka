import { NextRequest } from "next/server"
import { z } from "zod"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { QuestServiceEnhanced } from "@/app/lib/services/quests-enhanced"
import { QuestType, UserRole } from "@/app/lib/generated"
import { prisma } from "@/app/lib/prisma"

const createQuestSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.string().min(2).max(50),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "LEGENDARY"]),
  requiredLevel: z.number().min(0).max(100),
  xpReward: z.number().min(10).max(10000),
  moneyReward: z.number().min(0).max(5000).default(0),
  skillpointsReward: z.number().min(0).max(1000).default(0).optional(),
  reputationReward: z.number().min(0).max(1000).default(0).optional(),
  questType: z.nativeEnum(QuestType).default(QuestType.STANDARD).optional(),
  isRepeatable: z.boolean().default(false).optional(),
  expiresAt: z.string().datetime().optional(),
  guildId: z.string().optional(),
  miniGameType: z.string().optional(),
  miniGameData: z.any().optional()
})

/**
 * GET /api/quests - Get all available quests (with optional filters)
 */
export const GET = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const { searchParams } = new URL(request.url)
    const filters: any = {}
    const category = searchParams.get("category")
    const difficulty = searchParams.get("difficulty") as any
    const questType = searchParams.get("questType") as QuestType | null

    if (category) filters.category = category
    if (difficulty && ["EASY","MEDIUM","HARD","LEGENDARY"].includes(difficulty)) filters.difficulty = difficulty
    if (questType && Object.values(QuestType).includes(questType)) filters.questType = questType

    // If user is in a guild and looking for guild quests, auto-filter by their guild
    if (filters.questType === QuestType.GUILD) {
      const membership = await prisma.guildMember.findFirst({
        where: { userId: user.id },
        select: { guildId: true }
      })
      if (membership) {
        filters.guildId = membership.guildId
      }
    }

    const quests = await QuestServiceEnhanced.getAvailableQuests(user.id, filters)
    return createSuccessResponse({ quests }, 200, requestId)
  })
)

/**
 * POST /api/quests - Create new quest (teachers/admins only)
 */
export const POST = withApiErrorHandler(
  withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const body = await request.json()
    const validated = createQuestSchema.parse(body)

    const quest = await QuestServiceEnhanced.createQuest(
      {
        ...validated,
        createdBy: user.id,
        questType: validated.questType || QuestType.STANDARD,
        isRepeatable: validated.isRepeatable ?? false,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
        guildId: validated.guildId,
        miniGameType: validated.miniGameType,
        miniGameData: validated.miniGameData
      },
      requestId
    )

    return createSuccessResponse(
      { quest },
      201,
      requestId
    )
  })
)
