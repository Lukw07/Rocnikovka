import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { createBadgeSchema } from "./schema"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TEACHER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const badges = await BadgesService.getAllBadges()
    return NextResponse.json({ badges })
  } catch (error) {
    console.error("Badges GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TEACHER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = createBadgeSchema.parse(body)
    
    const badge = await BadgesService.createBadge(validatedData)
    
    return NextResponse.json({ 
      ok: true,
      data: { badge }
    }, { status: 201 })
  } catch (error) {
    console.error("Badges POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
