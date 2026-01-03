"use client"

/**
 * Komponenta pro zobrazení notifikací
 * Podporuje různé typy notifikací včetně achievementů a streaks
 */

import * as React from "react"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { useApi } from "@/app/hooks/use-api"
import { Bell, Trophy, Flame, CheckCheck, X, Zap } from "lucide-react"
import { cn } from "@/app/lib/utils"

type NotificationType = 
  | 'ACHIEVEMENT_UNLOCKED'
  | 'ACHIEVEMENT_PROGRESS'
  | 'STREAK_MILESTONE'
  | 'LEVEL_UP'
  | 'QUEST_COMPLETED'
  | 'REWARD_RECEIVED'
  | 'GUILD_INVITE'
  | 'SYSTEM'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: Date
}

interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
}

export default function NotificationsPanel() {
  const { data, loading, error, execute } = useApi<NotificationsData | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')

  const loadNotifications = React.useCallback(() => {
    execute(async () => {
      const url = filter === 'unread' 
        ? '/api/notifications?unreadOnly=true'
        : '/api/notifications'
      
      const res = await fetch(url)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute, filter])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      if (res.ok) {
        loadNotifications()
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/all/read`, {
        method: 'POST'
      })
      
      if (res.ok) {
        loadNotifications()
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ACHIEVEMENT_UNLOCKED':
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 'ACHIEVEMENT_PROGRESS':
        return <Zap className="h-5 w-5 text-blue-500" />
      case 'STREAK_MILESTONE':
        return <Flame className="h-5 w-5 text-orange-500" />
      case 'LEVEL_UP':
        return <Zap className="h-5 w-5 text-purple-500" />
      case 'QUEST_COMPLETED':
        return <Trophy className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifikace</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
            >
              Nepřečtené
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Vše
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {loading && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Načítání notifikací…
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-sm text-destructive">
            Chyba při načítání notifikací
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="p-6 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {filter === 'unread' ? 'Žádné nepřečtené notifikace' : 'Žádné notifikace'}
            </p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <>
            {unreadCount > 0 && (
              <div className="px-4 py-2 border-b">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={markAllAsRead}
                  className="w-full"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Označit vše jako přečtené
                </Button>
              </div>
            )}

            <div className="h-[600px] overflow-y-auto">
              <div className="divide-y">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        
                        {notification.data && (
                          <div className="flex gap-2 mt-2">
                            {notification.data.rewards && (
                              <>
                                {notification.data.rewards.xp > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    {notification.data.rewards.xp} XP
                                  </Badge>
                                )}
                                {notification.data.rewards.money > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    💰 {notification.data.rewards.money}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString('cs-CZ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
