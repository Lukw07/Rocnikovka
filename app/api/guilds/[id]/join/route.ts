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
 * POST /api/guilds/[id]/join - Join guild
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await GuildService.joinGuild(id, session.user.id)
    
    return NextResponse.json({ member }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/guilds/[id]/join error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to join guild" },
      { status: 500 }
    )
  }
}
