/**
 * API Route: GET/POST /api/achievements/enhanced
 * Rozšířené endpointy pro achievementy s podporou hidden, progressive a temporary
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { AchievementsEnhancedService } from "@/app/lib/services/achievements-enhanced"
import { z } from "zod"

const createAchievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  type: z.enum(['NORMAL', 'HIDDEN', 'TEMPORARY', 'PROGRESSIVE', 'STREAK']).optional(),
  category: z.enum([
    'LEVEL', 'XP', 'ACTIVITY', 'QUEST', 'JOB', 
    'SKILL', 'REPUTATION', 'SOCIAL', 'COLLECTION', 'SPECIAL', 'OTHER'
  ]).optional(),
  badgeUrl: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  criteria: z.string().max(500).optional(),
  target: z.number().int().min(1).optional(),
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']).optional(),
  
  xpReward: z.number().int().min(0).optional(),
  skillpointsReward: z.number().int().min(0).optional(),
  reputationReward: z.number().int().min(0).optional(),
  moneyReward: z.number().int().min(0).optional(),
  
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
  sortOrder: z.number().int().optional()
})

/**
 * GET /api/achievements/enhanced
 * Získá achievementy pro aktuálního uživatele s progress trackinigem
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Operators mohou zobrazit achievementy jiných uživatelů
    if (userId !== session.user.id && session.user.role !== 'OPERATOR') {
      return NextResponse.json(
        { code: 'FORBIDDEN', message: 'Access denied' },
        { status: 403 }
      )
    }

    const achievements = await AchievementsEnhancedService.getUserAchievementsWithProgress(userId)
    
    return NextResponse.json({ achievements })
  } catch (error) {
    console.error("Achievements Enhanced GET error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/achievements/enhanced
 * Vytvoří nový achievement (pouze OPERATOR)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'OPERATOR') {
      return NextResponse.json(
        { code: 'FORBIDDEN', message: 'Operator access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createAchievementSchema.parse(body)
    
    const achievementData = {
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      badgeUrl: data.badgeUrl,
      icon: data.icon,
      color: data.color,
      criteria: data.criteria,
      target: data.target,
      rarity: data.rarity,
      xpReward: data.xpReward,
      skillpointsReward: data.skillpointsReward,
      reputationReward: data.reputationReward,
      moneyReward: data.moneyReward,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      availableTo: data.availableTo ? new Date(data.availableTo) : undefined,
      sortOrder: data.sortOrder
    }

    const achievement = await AchievementsEnhancedService.createAchievement(achievementData)

    return NextResponse.json({ 
      success: true,
      achievement 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Achievements Enhanced POST error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
