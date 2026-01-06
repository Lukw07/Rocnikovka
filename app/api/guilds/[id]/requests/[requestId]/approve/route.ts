import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { GuildService } from "@/app/lib/services/guilds"

interface Params {
  params: Promise<{
    id: string
    requestId: string
  }>
}

/**
 * POST /api/guilds/[id]/requests/[requestId]/approve - Approve join request
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id, requestId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await GuildService.approveJoinRequest(id, requestId, session.user.id)

    return NextResponse.json({ request: result }, { status: 200 })
  } catch (error: any) {
    console.error("POST /api/guilds/[id]/requests/[requestId]/approve error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to approve join request" },
      { status: 500 }
    )
  }
}
