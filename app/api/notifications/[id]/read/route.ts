/**
 * API Route: POST /api/notifications/[id]/read
 * Označí notifikaci jako přečtenou
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { NotificationService } from "@/app/lib/services/notification"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (id === 'all') {
      // Označit všechny jako přečtené
      await NotificationService.markAllAsRead(session.user.id)
      return NextResponse.json({ success: true, markedAll: true })
    }

    // Označit konkrétní notifikaci
    await NotificationService.markAsRead(id, session.user.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification mark read error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
