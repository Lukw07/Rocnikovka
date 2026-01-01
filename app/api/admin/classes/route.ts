import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.OPERATOR && session.user.role !== UserRole.TEACHER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ classes })
  } catch (error) {
    console.error("Classes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
