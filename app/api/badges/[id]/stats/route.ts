import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stats = await BadgesService.getBadgeStats(id)
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Badge Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
