/**
 * Real-Life Rewards API
 * Endpoints for managing physical rewards
 */

import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/app/lib/api/guards"
import { UserRole, RewardCategory, ClaimStatus } from "@/app/lib/generated"
import { RealRewardsService } from "@/app/lib/services/real-rewards"
import { createSuccessResponse, ErrorResponses } from "@/app/lib/http/responses"
import { z } from "zod"

// Validation schemas
const createRewardSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: z.nativeEnum(RewardCategory),
  imageUrl: z.string().url().optional(),
  goldPrice: z.number().int().min(0).optional(),
  gemsPrice: z.number().int().min(0).optional(),
  levelRequired: z.number().int().min(0).optional(),
  totalStock: z.number().int().min(1),
  isLimited: z.boolean().optional(),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
  isFeatured: z.boolean().optional(),
  priority: z.number().int().min(0).optional()
})

const claimRewardSchema = z.object({
  rewardId: z.string().cuid(),
  studentNote: z.string().max(200).optional()
})

/**
 * GET /api/real-rewards
 * Get available rewards (students) or all rewards (teachers/admins)
 */
export const GET = async (request: NextRequest) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { searchParams } = new URL(request.url)
    
    // Public endpoint for students to see available rewards
    const studentId = searchParams.get("studentId")
    
    if (studentId) {
      const rewards = await RealRewardsService.getAvailableRewards(studentId)
      return NextResponse.json({
        ok: true,
        data: { rewards },
        requestId
      }, { status: 200 })
    }
    
    // All rewards (requires auth)
    const category = searchParams.get("category") as RewardCategory | null
    const isActive = searchParams.get("isActive") === "true"
    const isFeatured = searchParams.get("isFeatured") === "true"
    
    const rewards = await RealRewardsService.getAllRewards({
      ...(category && { category }),
      isActive,
      isFeatured
    })
    
    return NextResponse.json({
      ok: true,
      data: { rewards },
      requestId
    }, { status: 200 })
  }

/**
 * POST /api/real-rewards
 * Create a new real-life reward (teachers/operators only)
 */
export const POST = withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    
    const body = await request.json()
    const validatedData = createRewardSchema.parse(body)
    
    const reward = await RealRewardsService.createReward({
      ...validatedData,
      availableFrom: validatedData.availableFrom ? new Date(validatedData.availableFrom) : undefined,
      availableTo: validatedData.availableTo ? new Date(validatedData.availableTo) : undefined,
      createdBy: user.id
    }, requestId)
    
    return NextResponse.json({
      ok: true,
      data: { reward },
      requestId
    }, { status: 201 })
  })

/**
 * PATCH /api/real-rewards/[id]
 * Update reward details (teachers/operators only)
 */
export const PATCH = withRole([UserRole.TEACHER, UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { pathname } = new URL(request.url)
    const rewardId = pathname.split("/").pop()
    
    if (!rewardId) {
      return NextResponse.json(ErrorResponses.VALIDATION_ERROR("Reward ID required", requestId), { status: 400 })
    }
    
    const body = await request.json()
    const validatedData = createRewardSchema.partial().parse(body)
    
    const reward = await RealRewardsService.updateReward(rewardId, {
      ...validatedData,
      availableFrom: validatedData.availableFrom ? new Date(validatedData.availableFrom) : undefined,
      availableTo: validatedData.availableTo ? new Date(validatedData.availableTo) : undefined
    })
    
    return NextResponse.json({
      ok: true,
      data: { reward },
      requestId
    }, { status: 200 })
  })

/**
 * DELETE /api/real-rewards/[id]
 * Delete (deactivate) a reward (operators only)
 */
export const DELETE = withRole([UserRole.OPERATOR], async (user, request) => {
    const requestId = request.headers.get("x-request-id") || undefined
    const { pathname } = new URL(request.url)
    const rewardId = pathname.split("/").pop()
    
    if (!rewardId) {
      return NextResponse.json(ErrorResponses.VALIDATION_ERROR("Reward ID required", requestId), { status: 400 })
    }
    
    await RealRewardsService.deleteReward(rewardId)
    
    return NextResponse.json({
      ok: true,
      data: { message: "Reward deactivated" },
      requestId
    }, { status: 200 })
  })
