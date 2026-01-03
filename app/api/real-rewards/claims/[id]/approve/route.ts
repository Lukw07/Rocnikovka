/**
 * Reward Claims Management API
 * Approve, reject, complete claims (teachers/operators only)
 */

import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/app/lib/api/guards"
import { UserRole } from "@/app/lib/generated"
import { RealRewardsService } from "@/app/lib/services/real-rewards"
import { createSuccessResponse, ErrorResponses } from "@/app/lib/http/responses"
import { z } from "zod"

const approveClaimSchema = z.object({
  adminNote: z.string().max(200).optional()
})

const rejectClaimSchema = z.object({
  rejectedReason: z.string().min(5).max(200)
})

/**
 * POST /api/real-rewards/claims/[id]/approve
 * Approve a claim
 */
export const POST = withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split("/")
    const claimId = pathParts[pathParts.length - 2]
    
    if (!claimId) {
      return NextResponse.json(ErrorResponses.VALIDATION_ERROR("Claim ID required", requestId), { status: 400 })
    }
    
    const body = await request.json()
    const validatedData = approveClaimSchema.parse(body)
    
    try {
      const claim = await RealRewardsService.approveClaim({
        claimId,
        approvedBy: user.id,
        adminNote: validatedData.adminNote
      }, requestId)
      
      return NextResponse.json({
        ok: true,
        data: {
          claim,
          message: "Claim approved successfully"
        },
        requestId
      }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(ErrorResponses.VALIDATION_ERROR(error.message, requestId), { status: 400 })
    }
  })
