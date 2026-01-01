import { NextRequest, NextResponse } from "next/server"
import { BadgesService } from "@/app/lib/services/badges"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { z } from "zod"

const assignClassSchema = z.object({
  badgeId: z.string(),
  classId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TEACHER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { badgeId, classId } = assignClassSchema.parse(body)
    
    await BadgesService.awardBadgeToClass(classId, badgeId)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Assign badge to class error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
