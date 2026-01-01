import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { requireOperator } from "@/app/lib/rbac"
import { z } from "zod"

const assignClassSchema = z.object({
  badgeId: z.string(),
  classId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    await requireOperator()
    
    const body = await request.json()
    const { badgeId, classId } = assignClassSchema.parse(body)
    
    await BadgesService.awardBadgeToClass(classId, badgeId)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Assign badge to class error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
