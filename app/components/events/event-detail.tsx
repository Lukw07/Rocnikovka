"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Calendar, Trophy, Users, Zap, Lock, CheckCircle2, ArrowRight } from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface EventPhase {
  id: string
  phaseNumber: number
  title: string
  description: string | null
  storyContent: string | null
  xpReward: number
  coinReward: number
}

interface EventDetail {
  id: string
  title: string
  description: string | null
  type: string
  category: string
  startsAt: string
  endsAt: string | null
  xpBonus: number
  coinReward: number
  storyContent: string | null
  dungeonBossId: string | null
  phases: EventPhase[]
  userParticipation: {
    id: string
    progress: number
    isCompleted: boolean
    currentPhaseId: string | null
  } | null
  isParticipating: boolean
  userProgress: number
  currentPhase: EventPhase | null
}

interface EventDetailViewProps {
  eventId: string
  onBack?: () => void
}

export function EventDetailView({ eventId, onBack }: EventDetailViewProps) {
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participating, setParticipating] = useState(false)
  const [unlockingPhase, setUnlockingPhase] = useState(false)

  useEffect(() => {
    fetchEventDetail()
  }, [eventId])

  const fetchEventDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/v2/${eventId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch event")
      }
      
      setEvent(data.event)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleParticipate = async () => {
    try {
      setParticipating(true)
      const response = await fetch(`/api/events/v2/${eventId}/participate`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to participate")
      }
      
      await fetchEventDetail() // Refresh data
    } catch (err: any) {
      alert(err.message)
    } finally {
      setParticipating(false)
    }
  }

  const handleUnlockNextPhase = async () => {
    try {
      setUnlockingPhase(true)
      const response = await fetch(`/api/events/v2/${eventId}/next-phase`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to unlock next phase")
      }
      
      await fetchEventDetail() // Refresh data
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUnlockingPhase(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Chyba: {error || "Event not found"}</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            Zpět
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentPhaseIndex = event.phases.findIndex(p => p.id === event.currentPhase?.id)

  return (
    <div className="space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="ghost">
          ← Zpět na seznam
        </Button>
      )}

      {/* Hlavní informace o eventu */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
              <CardDescription className="text-base">
                {event.description}
              </CardDescription>
            </div>
            {event.isParticipating && (
              <Badge variant="outline" className="ml-4">
                Účastníš se
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          {event.isParticipating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tvůj pokrok</span>
                <span className="font-medium">{event.userProgress}%</span>
              </div>
              <Progress value={event.userProgress} className="h-2" />
            </div>
          )}

          {/* Odměny */}
          <div className="flex flex-wrap gap-4">
            {event.xpBonus > 0 && (
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="font-medium">+{event.xpBonus} XP</span>
              </div>
            )}
            {event.coinReward > 0 && (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">+{event.coinReward} mincí</span>
              </div>
            )}
          </div>

          {/* Časové informace */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(event.startsAt).toLocaleDateString('cs-CZ')}
              {event.endsAt && ` - ${new Date(event.endsAt).toLocaleDateString('cs-CZ')}`}
            </span>
          </div>

          {/* Akční tlačítko */}
          {!event.isParticipating && (
            <Button 
              onClick={handleParticipate} 
              disabled={participating}
              className="w-full"
              size="lg"
            >
              {participating ? 'Připojování...' : 'Zúčastnit se eventu'}
            </Button>
          )}

          {event.isParticipating && event.userParticipation?.isCompleted && (
            <div className="flex items-center justify-center gap-2 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-600">Event dokončen!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs pro story/fáze */}
      <Tabs defaultValue="story" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="story">Příběh</TabsTrigger>
          <TabsTrigger value="phases">Fáze ({event.phases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="space-y-4">
          {event.storyContent ? (
            <Card>
              <CardContent className="pt-6 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{event.storyContent}</ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Tento event nemá příběhový obsah
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          {event.phases.length > 0 ? (
            <>
              {event.phases.map((phase, index) => {
                const isCurrent = phase.id === event.currentPhase?.id
                const isLocked = currentPhaseIndex >= 0 && index > currentPhaseIndex
                const isCompleted = currentPhaseIndex >= 0 && index < currentPhaseIndex

                return (
                  <Card 
                    key={phase.id}
                    className={`${
                      isCurrent ? 'border-2 border-primary' : ''
                    } ${isLocked ? 'opacity-50' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Fáze {phase.phaseNumber}</Badge>
                            {isCompleted && (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Dokončeno
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge className="bg-blue-500">Aktuální</Badge>
                            )}
                            {isLocked && (
                              <Badge variant="secondary">
                                <Lock className="w-3 h-3 mr-1" />
                                Zamčeno
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl">{phase.title}</CardTitle>
                          {phase.description && (
                            <CardDescription className="mt-2">
                              {phase.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {!isLocked && (
                      <CardContent className="space-y-4">
                        {phase.storyContent && (
                          <div className="prose dark:prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{phase.storyContent}</ReactMarkdown>
                          </div>
                        )}

                        <div className="flex gap-4 text-sm">
                          {phase.xpReward > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Zap className="w-4 h-4" />
                              <span>+{phase.xpReward} XP</span>
                            </div>
                          )}
                          {phase.coinReward > 0 && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Trophy className="w-4 h-4" />
                              <span>+{phase.coinReward} mincí</span>
                            </div>
                          )}
                        </div>

                        {isCurrent && index < event.phases.length - 1 && (
                          <Button 
                            onClick={handleUnlockNextPhase}
                            disabled={unlockingPhase}
                            className="w-full"
                          >
                            {unlockingPhase ? 'Odemykání...' : 'Odemknout další fázi'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Tento event nemá fáze
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
