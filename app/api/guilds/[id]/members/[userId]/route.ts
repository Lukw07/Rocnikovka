import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { GuildService } from "@/app/lib/services/guilds"

type Params = {
  params: Promise<{
    id: string
    userId: string
  }>
}

/**
 * DELETE /api/guilds/[id]/members/[userId] - Kick member from guild (leader/officer only)
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: guildId, userId: targetUserId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await GuildService.kickMember(guildId, targetUserId, session.user.id)

    return NextResponse.json({
      success: true,
      message: "Člen byl úspěšně vyhozen z guildy",
      kickedMember: {
        id: result.id,
        userId: result.userId,
        userName: result.user.name
      }
    })
  } catch (error: any) {
    console.error("DELETE /api/guilds/[id]/members/[userId] error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to kick member" },
      { status: 500 }
    )
  }
}