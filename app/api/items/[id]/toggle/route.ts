import { NextRequest, NextResponse } from "next/server"
import { ItemsService } from "@/app/lib/services/items"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("POST /api/items/[id]/toggle - Starting request")
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.OPERATOR && session.user.role !== UserRole.TEACHER)) {
      console.warn("Toggle: Unauthorized user attempted access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id: itemId } = await params
    console.log(`Toggle item ${itemId}`)
    
    const updatedItem = await ItemsService.toggleItemStatus(itemId)
    console.log(`Item ${itemId} toggled successfully`)
    
    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }
    
    console.error("Item toggle error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 })
  }
}
