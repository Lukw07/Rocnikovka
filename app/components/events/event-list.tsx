"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Calendar, Clock, Trophy, Users, Zap } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string | null
  type: string
  category: string
  startsAt: string
  endsAt: string | null
  xpBonus: number
  coinReward: number
  isActive: boolean
  storyContent: string | null
  dungeonBossId: string | null
  _count: {
    participations: number
  }
}

interface EventListProps {
  filterType?: string
  onEventClick?: (eventId: string) => void
}

export function EventList({ filterType, onEventClick }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [filterType])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const url = filterType 
        ? `/api/events/v2?type=${filterType}` 
        : '/api/events/v2'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch events")
      }
      
      setEvents(data.events || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TIMED: "bg-blue-500",
      STORY: "bg-purple-500",
      BOSS_BATTLE: "bg-red-500",
      SEASONAL: "bg-green-500",
      COMPETITION: "bg-orange-500"
    }
    return colors[type] || "bg-gray-500"
  }

  const getEventTypeName = (type: string) => {
    const names: Record<string, string> = {
      TIMED: "Časově omezený",
      STORY: "Příběhový",
      BOSS_BATTLE: "Boss Fight",
      SEASONAL: "Sezónní",
      COMPETITION: "Soutěž"
    }
    return names[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isEventActive = (event: Event) => {
    const now = new Date()
    const start = new Date(event.startsAt)
    const end = event.endsAt ? new Date(event.endsAt) : null
    
    return event.isActive && now >= start && (!end || now <= end)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Chyba: {error}</p>
          <Button onClick={fetchEvents} variant="outline" className="mt-4">
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Žádné aktivní eventy
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const active = isEventActive(event)
        
        return (
          <Card 
            key={event.id} 
            className={`hover:shadow-lg transition-shadow cursor-pointer ${
              !active ? 'opacity-60' : ''
            }`}
            onClick={() => onEventClick?.(event.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                  <div className="flex gap-2 mb-2">
                    <Badge className={getEventTypeColor(event.type)}>
                      {getEventTypeName(event.type)}
                    </Badge>
                    {active && (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        Aktivní
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {event.description && (
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Časové informace */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="truncate">{formatDate(event.startsAt)}</span>
              </div>
              
              {event.endsAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="truncate">Do {formatDate(event.endsAt)}</span>
                </div>
              )}

              {/* Odměny */}
              <div className="flex flex-wrap gap-3 text-sm">
                {event.xpBonus > 0 && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Zap className="w-4 h-4" />
                    <span>+{event.xpBonus} XP</span>
                  </div>
                )}
                {event.coinReward > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Trophy className="w-4 h-4" />
                    <span>+{event.coinReward} mincí</span>
                  </div>
                )}
              </div>

              {/* Účastníci */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Users className="w-4 h-4" />
                <span>{event._count.participations} účastníků</span>
              </div>

              {/* Speciální indikátory */}
              {event.dungeonBossId && (
                <Badge variant="destructive" className="w-full justify-center">
                  🐉 Boss Event
                </Badge>
              )}
              
              {event.storyContent && (
                <Badge variant="secondary" className="w-full justify-center">
                  📖 Příběhový event
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
