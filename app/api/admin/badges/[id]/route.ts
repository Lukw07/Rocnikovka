import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { requireOperator } from "@/app/lib/rbac"
import { createBadgeSchema } from "../schema"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOperator()
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
    await requireOperator()
    const { id } = await params
    
    await BadgesService.deleteBadge(id)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Badge DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
