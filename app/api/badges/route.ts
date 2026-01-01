import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const badges = await BadgesService.getAllBadges()
    
    let userBadges: string[] = []
    if (session?.user) {
      const owned = await BadgesService.getUserBadges(session.user.id)
      userBadges = owned.map(ub => ub.badgeId)
    }

    const badgesWithOwnership = badges.map(badge => ({
      ...badge,
      owned: userBadges.includes(badge.id)
    }))

    return NextResponse.json({ badges: badgesWithOwnership })
  } catch (error) {
    console.error("Badges GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
