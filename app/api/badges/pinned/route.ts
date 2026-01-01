import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userBadge = await prisma.userBadge.findFirst({
      where: {
        userId: session.user.id,
        isPinned: true
      },
      include: {
        badge: true
      }
    })

    return NextResponse.json({ badge: userBadge?.badge || null })
  } catch (error) {
    console.error("Pinned Badge GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
