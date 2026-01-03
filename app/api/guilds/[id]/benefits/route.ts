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
 * GET /api/guilds/[id]/benefits - Get guild benefits
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const benefits = await GuildService.getGuildBenefits(id)
    
    return NextResponse.json({ benefits })
  } catch (error: any) {
    console.error("GET /api/guilds/[id]/benefits error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch benefits" },
      { status: 500 }
    )
  }
}
