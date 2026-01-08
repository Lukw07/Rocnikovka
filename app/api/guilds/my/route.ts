import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { GuildService } from "@/app/lib/services/guilds"

/**
 * GET /api/guilds/my - Get current user's guild
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const guild = await GuildService.getUserGuild(session.user.id)

    return NextResponse.json({ guild })
  } catch (error: any) {
    console.error("GET /api/guilds/my error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get user guild" },
      { status: 500 }
    )
  }
}