import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { getPlayerAttributeEffects } from "@/app/lib/attribute-effects"
import { ErrorResponses, createSuccessResponse } from "@/app/lib/api/error-responses"

/**
 * GET /api/progression/attributes/player
 * Get player's attribute levels and effects
 * 
 * Returns:
 * - Player's level in each core attribute
 * - Current attribute effects (bonuses)
 * - Total effect power score
 */
export async function GET(request: NextRequest) {
  try {
    const requestId = request.headers.get('x-request-id') || undefined
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return ErrorResponses.unauthorized(requestId)
    }
    
    const userId = session.user.id
    
    // Get all player's skills that are core attributes
    const playerAttributes = await prisma.playerSkill.findMany({
      where: {
        userId,
        skill: {
          category: "Core"
        }
      },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            maxLevel: true,
            unlockLevel: true
          }
        }
      },
      orderBy: [
        { skill: { name: 'asc' } }
      ]
    })
    
    // Get attribute effects
    const effects = await getPlayerAttributeEffects(userId)
    
    // Format response
    const attributes = playerAttributes.map(pa => ({
      id: pa.id,
      skillId: pa.skillId,
      name: pa.skill?.name,
      description: pa.skill?.description,
      icon: pa.skill?.icon,
      currentLevel: pa.level,
      maxLevel: pa.skill?.maxLevel || 10,
      experience: pa.experience,
      points: pa.points,
      unlockLevel: pa.skill?.unlockLevel || 0,
      lastLeveledAt: pa.lastLeveledAt
    }))
    
    return createSuccessResponse({
      attributes,
      effects,
      attributeCount: attributes.length,
      totalPower: effects.totalEffectPower
    }, 200, requestId)
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("Error fetching player attributes:", error)
    return ErrorResponses.internalError(requestId)
  }
}
