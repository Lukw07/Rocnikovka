"use client"

import { useState } from "react"
import { EventList, EventDetailView, BossBattleUI } from "@/app/components/events"
import { DailyQuestionPanel } from "@/app/components/events/DailyQuestionPanel"
import { BossEventPanel } from "@/app/components/events/BossEventPanel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Button } from "@/app/components/ui/button"
import { Calendar, Sparkles, Sword, Trophy } from "lucide-react"

export default function EventsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showBossBattle, setShowBossBattle] = useState(false)

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId)
    setShowBossBattle(false)
  }

  const handleBack = () => {
    setSelectedEventId(null)
    setShowBossBattle(false)
  }

  if (showBossBattle && selectedEventId) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Button onClick={handleBack} variant="ghost" className="mb-6">
          ← Zpět na event
        </Button>
        <BossBattleUI 
          eventId={selectedEventId} 
          onVictory={() => {
            alert("Gratulujeme! Boss poražen!")
            setShowBossBattle(false)
          }}
        />
      </div>
    )
  }

  if (selectedEventId) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Button onClick={handleBack} variant="ghost" className="mb-6">
          ← Zpět na event
        </Button>
        <EventDetailView 
          eventId={selectedEventId} 
          onBack={handleBack}
        />

        {/* Daily Question */}
        <div className="mt-6">
          <DailyQuestionPanel eventId={selectedEventId} />
        </div>

        {/* Boss Event */}
        <div className="mt-6">
          <BossEventPanel eventId={selectedEventId} />
        </div>
        
        {/* Boss Battle Button */}
        <Card className="mt-6 border-red-500/50">
          <CardContent className="pt-6">
            <Button 
              onClick={() => setShowBossBattle(true)}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              <Sword className="w-5 h-5 mr-2" />
              Vstoupit do Boss Battle
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Calendar className="w-10 h-10" />
          Eventy
        </h1>
        <p className="text-lg text-muted-foreground">
          Účastni se časově omezených eventů, příběhových misí a epických boss bitev
        </p>
      </div>

      {/* Event Types Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Časově omezené
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Bonusy a odměny dostupné pouze po určitou dobu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              📖 Příběhové
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Postupuj fázemi a odkrývej příběh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sword className="w-4 h-4 text-red-500" />
              Boss Battle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Společně porazte mohutné bossové
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Soutěže
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Soupeř s ostatními o nejlepší pozici
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Všechny</TabsTrigger>
          <TabsTrigger value="TIMED">Časové</TabsTrigger>
          <TabsTrigger value="STORY">Příběhové</TabsTrigger>
          <TabsTrigger value="BOSS_BATTLE">Boss</TabsTrigger>
          <TabsTrigger value="SEASONAL">Sezónní</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <EventList onEventClick={handleEventClick} />
        </TabsContent>

        <TabsContent value="TIMED" className="mt-6">
          <EventList filterType="TIMED" onEventClick={handleEventClick} />
        </TabsContent>

        <TabsContent value="STORY" className="mt-6">
          <EventList filterType="STORY" onEventClick={handleEventClick} />
        </TabsContent>

        <TabsContent value="BOSS_BATTLE" className="mt-6">
          <EventList filterType="BOSS_BATTLE" onEventClick={handleEventClick} />
        </TabsContent>

        <TabsContent value="SEASONAL" className="mt-6">
          <EventList filterType="SEASONAL" onEventClick={handleEventClick} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
