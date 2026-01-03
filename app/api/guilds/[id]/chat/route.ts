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
 * GET /api/guilds/[id]/chat - Get guild chat messages
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    const messages = await GuildService.getChatMessages(id, limit)
    
    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("GET /api/guilds/[id]/chat error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch chat messages" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/guilds/[id]/chat - Send chat message
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      )
    }

    const message = await GuildService.sendChatMessage(
      id,
      session.user.id,
      content.trim()
    )
    
    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/guilds/[id]/chat error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    )
  }
}
