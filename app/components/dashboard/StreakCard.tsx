"use client"

/**
 * Komponenta pro zobrazení streak informací
 * Zobrazuje aktuální streak, milníky a odměny
 */

import * as React from "react"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { useApi } from "@/app/hooks/use-api"
import { Flame, Award, TrendingUp, Calendar, Zap } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface StreakInfo {
  currentStreak: number
  maxStreak: number
  lastActivityDate?: Date
  currentMultiplier: number
  totalParticipation: number
  nextMilestone?: number
  milestonesReached: number[]
  daysUntilBreak: number
}

interface StreakMilestone {
  days: number
  xpReward: number
  moneyReward: number
  multiplierBonus?: number
}

interface StreakData {
  streak: StreakInfo
  milestones: StreakMilestone[]
}

export default function StreakCard() {
  const { data, loading, error, execute } = useApi<StreakData | null>(null)

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/streak')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Načítání streak…</div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-destructive">Chyba při načítání streak</div>
        </CardContent>
      </Card>
    )
  }

  const { streak, milestones } = data

  // Najít další milník
  const nextMilestone = milestones.find(m => m.days > streak.currentStreak)
  const progressToNext = nextMilestone 
    ? (streak.currentStreak / nextMilestone.days) * 100 
    : 100

  // Získat aktuální milník (dosažený)
  const currentMilestone = [...milestones]
    .reverse()
    .find(m => m.days <= streak.currentStreak)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Flame className="h-6 w-6" />
              Streak
            </CardTitle>
            <CardDescription className="text-white/90">
              Po sobě jdoucích dní s aktivitou
            </CardDescription>
          </div>
          <div className="text-5xl font-bold">
            {streak.currentStreak}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-orange-500">
              {streak.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">Aktuální</div>
          </div>

          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-500">
              {streak.maxStreak}
            </div>
            <div className="text-xs text-muted-foreground">Maximum</div>
          </div>

          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-purple-500">
              {streak.currentMultiplier.toFixed(2)}x
            </div>
            <div className="text-xs text-muted-foreground">XP Multiplikátor</div>
          </div>

          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {streak.totalParticipation}
            </div>
            <div className="text-xs text-muted-foreground">Celkem aktivit</div>
          </div>
        </div>

        {/* Varování před prolomením */}
        {streak.currentStreak > 0 && streak.daysUntilBreak === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <div className="text-red-500">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">
                ⚠️ Pozor! Tvůj streak bude prolomen!
              </p>
              <p className="text-xs text-red-700">
                Máš méně než 24 hodin na další aktivitu
              </p>
            </div>
          </div>
        )}

        {/* Progress k dalšímu milníku */}
        {nextMilestone && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Další milník: {nextMilestone.days} dní
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {streak.currentStreak} / {nextMilestone.days}
              </span>
            </div>
            
            <Progress value={progressToNext} className="h-3" />
            
            <div className="flex gap-2 text-xs">
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                {nextMilestone.xpReward} XP
              </Badge>
              <Badge variant="secondary" className="gap-1">
                💰 {nextMilestone.moneyReward}
              </Badge>
              {nextMilestone.multiplierBonus && (
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{(nextMilestone.multiplierBonus * 100).toFixed(0)}% XP
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Dosažené milníky */}
        {streak.milestonesReached.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Dosažené milníky
            </h4>
            <div className="flex flex-wrap gap-2">
              {streak.milestonesReached.map(days => {
                const milestone = milestones.find(m => m.days === days)
                return (
                  <Badge 
                    key={days}
                    variant="outline"
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200"
                  >
                    🏆 {days} dní
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Všechny milníky */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Milníky a odměny
          </h4>
          <div className="space-y-1">
            {milestones.map(milestone => {
              const isReached = streak.milestonesReached.includes(milestone.days)
              const isCurrent = currentMilestone?.days === milestone.days
              
              return (
                <div 
                  key={milestone.days}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border",
                    isReached ? "bg-green-50 border-green-200" : "bg-muted/50 border-muted",
                    isCurrent && "ring-2 ring-orange-500"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isReached ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {milestone.days}
                    </div>
                    <span className="text-sm font-medium">
                      {milestone.days} dní
                    </span>
                  </div>
                  
                  <div className="flex gap-1 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      {milestone.xpReward} XP
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      💰 {milestone.moneyReward}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Last activity */}
        {streak.lastActivityDate && (
          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Poslední aktivita: {new Date(streak.lastActivityDate).toLocaleString('cs-CZ')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
