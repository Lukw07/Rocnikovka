import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { ProgressionService } from "@/app/lib/services/progression"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"
import { z } from "zod"

const spendSkillpointSchema = z.object({
  skillId: z.string().cuid("Invalid skill ID"),
  points: z.number().int().min(1).default(1)
})

/**
 * POST /api/progression/skillpoints/spend
 * Spend a skillpoint on a skill
 */
export async function POST(request: NextRequest) {
  try {
    const requestId = request.headers.get('x-request-id') || undefined
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return ErrorResponses.forbidden(requestId)
    }
    
    const body = await request.json()
    const { skillId, points } = spendSkillpointSchema.parse(body)
    
    const result = await ProgressionService.spendSkillpoint(
      session.user.id,
      skillId,
      points
    )
    
    return createSuccessResponse(result, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'Validation error'
      return ErrorResponses.badRequest(message, requestId)
    }
    
    if (error instanceof Error) {
      return ErrorResponses.badRequest(error.message, requestId)
    }
    
    console.error("API Error:", error)
    return ErrorResponses.internalError(requestId)
  }
}
