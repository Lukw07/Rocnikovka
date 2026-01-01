import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { requireOperator } from "@/app/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    await requireOperator()
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ classes })
  } catch (error) {
    console.error("Classes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
