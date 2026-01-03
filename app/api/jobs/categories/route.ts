import { NextRequest } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { withRole } from "@/app/lib/api/guards"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional()
})

/**
 * GET /api/jobs/categories
 * Získat seznam všech kategorií jobů
 */
export const GET = withApiErrorHandler(async (request) => {
  const requestId = request.headers.get('x-request-id') || undefined
  
  const categories = await prisma.jobCategory.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { jobs: true }
      }
    },
    orderBy: { name: 'asc' }
  })
  
  return createSuccessResponse({ categories }, 200, requestId)
})

/**
 * POST /api/jobs/categories
 * Vytvořit novou kategorii jobů (pouze TEACHER, OPERATOR)
 */
export const POST = withApiErrorHandler(
  withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get('x-request-id') || undefined
    
    try {
      const body = await request.json()
      const validatedData = createCategorySchema.parse(body)
      
      const category = await prisma.jobCategory.create({
        data: {
          name: validatedData.name,
          description: validatedData.description || null,
          icon: validatedData.icon || null,
          color: validatedData.color || null
        }
      })
      
      return createSuccessResponse({ category }, 201, requestId)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ErrorResponses.validationError("Invalid request body", error, requestId)
      }
      throw error
    }
  })
)
