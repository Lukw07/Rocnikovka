import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { GuildService } from "@/app/lib/services/guilds"
import { UserRole } from "@/app/lib/generated"

/**
 * GET /api/guilds - Get all guilds
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const guilds = await GuildService.getAllGuilds()
    
    return NextResponse.json({ guilds })
  } catch (error: any) {
    console.error("GET /api/guilds error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch guilds" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/guilds - Create new guild
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, motto, logoUrl, isPublic, maxMembers } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Guild name must be at least 3 characters" },
        { status: 400 }
      )
    }

    const guild = await GuildService.createGuild({
      name: name.trim(),
      description: description?.trim(),
      motto: motto?.trim(),
      logoUrl,
      isPublic: isPublic ?? true,
      maxMembers: maxMembers ?? 10,
      leaderId: session.user.id
    })
    
    return NextResponse.json({ guild }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/guilds error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create guild" },
      { status: 500 }
    )
  }
}
