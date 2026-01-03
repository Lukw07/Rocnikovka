import { NextRequest } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { withRole } from "@/app/lib/api/guards"
import { UserRole } from "@/app/lib/generated"
import { ErrorResponses, createSuccessResponse, withApiErrorHandler } from "@/app/lib/api/error-responses"
import { z } from "zod"

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/jobs/categories/[id]
 * Získat detail kategorie
 */
export const GET = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const requestId = request.headers.get('x-request-id') || undefined
  const { id } = await params
  
  const category = await prisma.jobCategory.findUnique({
    where: { id },
    include: {
      jobs: {
        where: { status: 'OPEN' },
        include: {
          subject: true,
          teacher: { select: { id: true, name: true } }
        }
      },
      _count: {
        select: { jobs: true }
      }
    }
  })
  
  if (!category) {
    return ErrorResponses.notFound("Category not found", requestId)
  }
  
  return createSuccessResponse({ category }, 200, requestId)
})

/**
 * PATCH /api/jobs/categories/[id]
 * Aktualizovat kategorii (pouze TEACHER, OPERATOR)
 */
export const PATCH = withApiErrorHandler(
  withRole([UserRole.TEACHER, UserRole.OPERATOR], async (
    user,
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const requestId = request.headers.get('x-request-id') || undefined
    const { id } = await params
    
    try {
      const body = await request.json()
      const validatedData = updateCategorySchema.parse(body)
      
      const category = await prisma.jobCategory.update({
        where: { id },
        data: validatedData
      })
      
      return createSuccessResponse({ category }, 200, requestId)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ErrorResponses.validationError("Invalid request body", error, requestId)
      }
      throw error
    }
  })
)

/**
 * DELETE /api/jobs/categories/[id]
 * Smazat kategorii (soft delete - pouze OPERATOR)
 */
export const DELETE = withApiErrorHandler(
  withRole([UserRole.OPERATOR], async (
    user,
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const requestId = request.headers.get('x-request-id') || undefined
    const { id } = await params
    
    const category = await prisma.jobCategory.update({
      where: { id },
      data: { isActive: false }
    })
    
    return createSuccessResponse({ category }, 200, requestId)
  })
)
