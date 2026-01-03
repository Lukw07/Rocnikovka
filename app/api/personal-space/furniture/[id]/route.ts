import { z } from "zod"
import { withApiErrorHandler } from "@/app/lib/api/error-responses"
import { withRole } from "@/app/lib/api/guards"
import { createSuccessResponse } from "@/app/lib/api/response"
import { PersonalSpaceService } from "@/app/lib/services/personal-space"
import { UserRole } from "@/app/lib/generated"

const addFurnitureSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  positionX: z.number().min(0).max(1000),
  positionY: z.number().min(0).max(1000),
  rotation: z.number().min(0).max(360).default(0),
})

const updateFurnitureSchema = z.object({
  positionX: z.number().min(0).max(1000).optional(),
  positionY: z.number().min(0).max(1000).optional(),
  rotation: z.number().min(0).max(360).optional(),
})

/**
 * POST /api/personal-space/furniture - Přidá nábytek do prostoru
 */
export const POST = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined

    const body = await request.json()
    const validated = addFurnitureSchema.parse(body)

    const furniture = await PersonalSpaceService.addFurniture(
      user.id,
      validated,
      requestId
    )

    return createSuccessResponse({ furniture }, 201, requestId)
  })
)

/**
 * PATCH /api/personal-space/furniture/[id] - Aktualizuje pozici nábytku
 */
export const PATCH = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request, { params }: any) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const furnitureId = params.id

    const body = await request.json()
    const validated = updateFurnitureSchema.parse(body)

    const furniture = await PersonalSpaceService.updateFurniture(
      user.id,
      furnitureId,
      validated,
      requestId
    )

    return createSuccessResponse({ furniture }, 200, requestId)
  })
)

/**
 * DELETE /api/personal-space/furniture/[id] - Smaže nábytek
 */
export const DELETE = withApiErrorHandler(
  withRole([UserRole.STUDENT], async (user, request, { params }: any) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const furnitureId = params.id

    await PersonalSpaceService.removeFurniture(user.id, furnitureId, requestId)

    return createSuccessResponse({ success: true }, 200, requestId)
  })
)
