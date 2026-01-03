/**
 * Complete Claim API (mark as delivered)
 */

import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/app/lib/api/guards"
import { UserRole } from "@/app/lib/generated"
import { RealRewardsService } from "@/app/lib/services/real-rewards"
import { createSuccessResponse, ErrorResponses } from "@/app/lib/http/responses"

/**
 * POST /api/real-rewards/claims/[id]/complete
 */
export const POST = withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split("/")
    const claimId = pathParts[pathParts.length - 2]
    
    if (!claimId) {
      return NextResponse.json(ErrorResponses.VALIDATION_ERROR("Claim ID required", requestId), { status: 400 })
    }
    
    try {
      const claim = await RealRewardsService.completeClaim({
        claimId,
        completedBy: user.id
      }, requestId)
      
      return NextResponse.json({
        ok: true,
        data: {
          claim,
          message: "Reward marked as delivered"
        },
        requestId
      }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(ErrorResponses.VALIDATION_ERROR(error.message, requestId), { status: 400 })
    }
  })
