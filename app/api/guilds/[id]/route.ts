import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { GuildService } from "@/app/lib/services/guilds"

type Params = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/guilds/[id] - Get guild details
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const guild = await GuildService.getGuildDetails(id)
    
    if (!guild) {
      return NextResponse.json({ error: "Guild not found" }, { status: 404 })
    }
    
    // Filter out members with null users
    const filteredGuild = {
      ...guild,
      members: guild.members.filter(member => member.user !== null)
    }
    
    return NextResponse.json({ guild: filteredGuild })
  } catch (error: any) {
    console.error("GET /api/guilds/[id] error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch guild" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/guilds/[id] - Update guild
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { description, motto, logoUrl, isPublic, maxMembers } = body

    const guild = await GuildService.updateGuild(
      id,
      {
        description: description?.trim(),
        motto: motto?.trim(),
        logoUrl,
        isPublic,
        maxMembers
      },
      session.user.id
    )
    
    return NextResponse.json({ guild })
  } catch (error: any) {
    console.error("PATCH /api/guilds/[id] error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update guild" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/guilds/[id] - Delete guild (leader only)
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await GuildService.deleteGuild(id, session.user.id)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE /api/guilds/[id] error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete guild" },
      { status: 500 }
    )
  }
}
