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
 * POST /api/guilds/[id]/contribute - Contribute to guild treasury
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid contribution amount" },
        { status: 400 }
      )
    }

    const result = await GuildService.contributeMoney(id, session.user.id, amount)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("POST /api/guilds/[id]/contribute error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to contribute" },
      { status: 500 }
    )
  }
}
