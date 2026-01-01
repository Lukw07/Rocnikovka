import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const updatedUserBadge = await BadgesService.togglePinBadge(session.user.id, id)

    return NextResponse.json({ ok: true, data: updatedUserBadge })
  } catch (error) {
    console.error("Badge Pin error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
