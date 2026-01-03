import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { getAllCoreAttributes } from "@/app/lib/attribute-effects"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"

/**
 * GET /api/progression/attributes
 * Get list of all core attributes
 */
export async function GET(request: NextRequest) {
  try {
    const requestId = request.headers.get('x-request-id') || undefined
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return ErrorResponses.unauthorized(requestId)
    }
    
    const attributes = await getAllCoreAttributes()
    
    return createSuccessResponse({
      attributes,
      total: attributes.length
    }, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("Error fetching attributes:", error)
    return ErrorResponses.internalError(requestId)
  }
}
