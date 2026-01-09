import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { GuildService } from "@/app/lib/services/guilds"
import { GuildMemberRole } from "@/app/lib/generated"

type Params = {
  params: Promise<{
    id: string
    userId: string
  }>
}

/**
 * PATCH /api/guilds/[id]/members/[userId]/role - Change member role (leader/officer only)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: guildId, userId: targetUserId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { role } = body

    if (!role || !Object.values(GuildMemberRole).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const result = await GuildService.changeMemberRole(guildId, targetUserId, role, session.user.id)

    return NextResponse.json({
      success: true,
      message: "Role člena byla úspěšně změněna",
      member: result
    })
  } catch (error: any) {
    console.error("PATCH /api/guilds/[id]/members/[userId]/role error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to change member role" },
      { status: 500 }
    )
  }
}