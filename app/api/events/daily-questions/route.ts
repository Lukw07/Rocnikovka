import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"
import { z } from "zod"

const createQuestionSchema = z.object({
  eventId: z.string(),
  question: z.string().min(5),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.number().int().min(0),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  xpReward: z.number().int().positive().default(50),
  moneyReward: z.number().int().positive().default(10),
  skillpointReward: z.number().int().positive().default(1)
})

/**
 * GET /api/events/daily-questions - Získat denní otázku
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

  // Najdi dnešní otázku
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const question = await prisma.dailyQuestion.findFirst({
    where: {
      eventId,
      date: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      creator: { select: { id: true, name: true } }
    }
  })

  if (!question) {
    return createSuccessResponse({ question: null }, 200, requestId)
  }

  // Zkontroluj, zda uživatel již odpověděl
  const userAnswer = await prisma.dailyQuestionAnswer.findUnique({
    where: {
      questionId_userId: {
        questionId: question.id,
        userId: session.user.id
      }
    }
  })

  return createSuccessResponse({
    question: {
      ...question,
      options: question.options,
      correctAnswer: undefined // Neodsílej správnou odpověď
    },
    userAnswer
  }, 200, requestId)
})

/**
 * POST /api/events/daily-questions - Vytvořit denní otázku (operator/AI)
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
  const data = createQuestionSchema.parse(body)

  // Zkontroluj, že event existuje
  const event = await prisma.event.findUnique({
    where: { id: data.eventId }
  })

  if (!event) {
    return ErrorResponses.notFound("Event not found", requestId)
  }

  // Zkontroluj, zda už existuje otázka na dnes
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const existingQuestion = await prisma.dailyQuestion.findFirst({
    where: {
      eventId: data.eventId,
      date: {
        gte: today,
        lt: tomorrow
      }
    }
  })

  if (existingQuestion) {
    return ErrorResponses.conflict("Question already exists for today", requestId)
  }

  const question = await prisma.dailyQuestion.create({
    data: {
      eventId: data.eventId,
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      difficulty: data.difficulty,
      xpReward: data.xpReward,
      moneyReward: data.moneyReward,
      skillpointReward: data.skillpointReward,
      createdBy: session.user.id,
      date: new Date()
    },
    include: {
      creator: { select: { id: true, name: true } }
    }
  })

  return createSuccessResponse({ question }, 201, requestId)
})
