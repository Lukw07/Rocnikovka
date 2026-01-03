/**
 * API Route: GET /api/notifications
 * Získá notifikace aktuálního uživatele
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { NotificationService } from "@/app/lib/services/notification"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    let notifications
    
    if (unreadOnly) {
      notifications = await NotificationService.getUnreadNotifications(session.user.id)
    } else if (type) {
      notifications = await NotificationService.getNotificationsByType(
        session.user.id, 
        type as any,
        limit
      )
    } else {
      notifications = await NotificationService.getAllNotifications(session.user.id, limit)
    }

    const unreadCount = await NotificationService.getUnreadCount(session.user.id)
    
    return NextResponse.json({ 
      notifications,
      unreadCount 
    })
  } catch (error) {
    console.error("Notifications GET error:", error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
