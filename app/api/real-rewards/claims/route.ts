/**
 * Reward Claims API
 * Endpoints for claiming and managing reward claims
 */

import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/app/lib/api/guards"
import { UserRole, ClaimStatus } from "@/app/lib/generated"
import { RealRewardsService } from "@/app/lib/services/real-rewards"
import { createSuccessResponse, ErrorResponses } from "@/app/lib/http/responses"
import { z } from "zod"

const claimRewardSchema = z.object({
  rewardId: z.string().cuid(),
  studentNote: z.string().max(200).optional()
})

const approveClaimSchema = z.object({
  claimId: z.string().cuid(),
  adminNote: z.string().max(200).optional()
})

const rejectClaimSchema = z.object({
  claimId: z.string().cuid(),
  rejectedReason: z.string().min(5).max(200)
})

const completeClaimSchema = z.object({
  claimId: z.string().cuid()
})

/**
 * GET /api/real-rewards/claims
 * Get claims (students see their own, teachers see all)
 */
export const GET = withRole([UserRole.STUDENT, UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { searchParams } = new URL(request.url)
    
    if (user.role === UserRole.STUDENT) {
      // Students see only their claims
      const claims = await RealRewardsService.getStudentClaims(user.id)
      return NextResponse.json({
        ok: true,
        data: { claims },
        requestId
      }, { status: 200 })
    }
    
    // Teachers/operators see all claims or filtered
    const status = searchParams.get("status") as ClaimStatus | null
    const userId = searchParams.get("userId")
    const rewardId = searchParams.get("rewardId")
    
    if (status === ClaimStatus.PENDING) {
      const claims = await RealRewardsService.getPendingClaims()
      return NextResponse.json({
        ok: true,
        data: { claims },
        requestId
      }, { status: 200 })
    }
    
    const claims = await RealRewardsService.getAllClaims({
      ...(status && { status }),
      ...(userId && { userId }),
      ...(rewardId && { rewardId })
    })
    
    return NextResponse.json({
      ok: true,
      data: { claims },
      requestId
    }, { status: 200 })
  })

/**
 * POST /api/real-rewards/claims
 * Claim a reward (students only)
 */
export const POST = withRole([UserRole.STUDENT], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    
    const body = await request.json()
    const validatedData = claimRewardSchema.parse(body)
    
    try {
      const claim = await RealRewardsService.claimReward({
        userId: user.id,
        rewardId: validatedData.rewardId,
        studentNote: validatedData.studentNote
      }, requestId)
      
      return NextResponse.json({
        ok: true,
        data: {
          claim,
          message: "Reward claimed successfully. Waiting for approval."
        },
        requestId
      }, { status: 201 })
    } catch (error: any) {
      return NextResponse.json(ErrorResponses.VALIDATION_ERROR(error.message, requestId), { status: 400 })
    }
  })
