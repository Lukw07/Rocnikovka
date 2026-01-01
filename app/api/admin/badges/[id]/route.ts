import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { createBadgeSchema } from "../schema"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.OPERATOR && session.user.role !== UserRole.TEACHER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    
    const body = await request.json()
    const validatedData = createBadgeSchema.partial().parse(body)
    
    const badge = await BadgesService.updateBadge(id, validatedData)
    
    return NextResponse.json({ 
      ok: true,
      data: { badge }
    })
  } catch (error) {
    console.error("Badge PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.OPERATOR && session.user.role !== UserRole.TEACHER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    
    await BadgesService.deleteBadge(id)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Badge DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
