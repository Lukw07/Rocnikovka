import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { GuildService } from "@/app/lib/services/guilds"
import { prisma } from "@/app/lib/prisma"

interface Params {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/guilds/[id]/request - Create join request
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate user exists in database
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const message: string | undefined = body?.message

    const request = await GuildService.requestJoin(id, session.user.id, message)

    return NextResponse.json({ request }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/guilds/[id]/request error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to request guild join" },
      { status: 500 }
    )
  }
}
