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
 * GET /api/guilds/[id]/members - Get guild members
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const members = await GuildService.getGuildMembers(id)
    
    return NextResponse.json({ members })
  } catch (error: any) {
    console.error("GET /api/guilds/[id]/members error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch members" },
      { status: 500 }
    )
  }
}
