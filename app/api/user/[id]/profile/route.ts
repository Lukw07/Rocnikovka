import { NextRequest, NextResponse } from "next/server"
import { UserProfileService } from "@/app/lib/services/user-profile"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await UserProfileService.getUserProfile(id)
    
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Get Profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
