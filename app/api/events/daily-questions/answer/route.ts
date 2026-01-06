import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"
import { z } from "zod"

const answerQuestionSchema = z.object({
  questionId: z.string(),
  selectedAnswer: z.number().int().min(0)
})

/**
 * POST /api/events/daily-questions/answer - Odpovědět na denní otázku
 */
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const requestId = request.headers.get('x-request-id') || undefined
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return ErrorResponses.unauthorized(requestId)
  }

  const body = await request.json()
  const { questionId, selectedAnswer } = answerQuestionSchema.parse(body)

  // Najdi otázku
  const question = await prisma.dailyQuestion.findUnique({
    where: { id: questionId }
  })

  if (!question) {
    return ErrorResponses.notFound("Question not found", requestId)
  }

  // Zkontroluj, zda uživatel již odpověděl
  const existingAnswer = await prisma.dailyQuestionAnswer.findUnique({
    where: {
      questionId_userId: {
        questionId,
        userId: session.user.id
      }
    }
  })

  if (existingAnswer) {
    return ErrorResponses.conflict("You already answered this question", requestId)
  }

  // Vyhodnoť odpověď
  const isCorrect = selectedAnswer === question.correctAnswer

  // Ulož odpověď
  const answer = await prisma.dailyQuestionAnswer.create({
    data: {
      questionId,
      userId: session.user.id,
      selectedAnswer,
      isCorrect
    }
  })

  // Pokud je správně, přidej odměny
  if (isCorrect) {
    // Přidej peníze
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        gold: { increment: question.moneyReward }
      }
    })

    // Přidej XP audit
    await prisma.xPAudit.create({
      data: {
        userId: session.user.id,
        amount: question.xpReward,
        reason: `Daily question: ${question.question}`
      }
    })

    // Přidej skillpoint
    await prisma.skillPoint.update({
      where: { userId: session.user.id },
      data: {
        available: { increment: question.skillpointReward }
      }
    })
  }

  return createSuccessResponse({
    answer,
    isCorrect,
    rewards: isCorrect ? {
      xp: question.xpReward,
      money: question.moneyReward,
      skillpoints: question.skillpointReward
    } : null
  }, 201, requestId)
})
