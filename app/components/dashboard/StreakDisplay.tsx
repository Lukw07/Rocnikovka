"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Flame, Zap } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface StreakInfo {
  currentStreak: number
  maxStreak: number
  xpMultiplier: number
  totalParticipation: number
  lastActivityDate: string | null
  isActive: boolean
}

interface StreakDisplayProps {
  streak?: StreakInfo
  isLoading?: boolean
  showMaxStreak?: boolean
  showMultiplier?: boolean
  compact?: boolean
}

/**
 * Displays user's current streak with fire animation and bonus multiplier
 * Shows consecutive day counter and encourages daily participation
 */
export function StreakDisplay({
  streak,
  isLoading = false,
  showMaxStreak = true,
  showMultiplier = true,
  compact = false
}: StreakDisplayProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (isLoading) {
    return <div className="h-20 bg-muted animate-pulse rounded-lg" />
  }
  
  if (!streak || streak.currentStreak === 0) {
    return (
      <Card className={cn("border-dashed", compact && "h-auto")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-gray-400" />
            No Active Streak
          </CardTitle>
        </CardHeader>
        {!compact && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Participate daily to build a streak and earn XP bonuses!
            </p>
          </CardContent>
        )}
      </Card>
    )
  }
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Flame className={cn("h-5 w-5", streak.isActive ? "text-red-500 animate-pulse" : "text-gray-400")} />
        <span>{streak.currentStreak} day streak</span>
        {showMultiplier && streak.xpMultiplier > 1.0 && (
          <Badge variant="secondary" className="ml-auto">
            {(streak.xpMultiplier * 100).toFixed(0)}% XP
          </Badge>
        )}
      </div>
    )
  }
  
  return (
    <Card className={cn("border-gradient", streak.isActive && "ring-2 ring-red-500/50")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame 
              className={cn(
                "h-6 w-6",
                streak.isActive 
                  ? "text-red-500 animate-pulse" 
                  : "text-gray-400"
              )} 
            />
            <div>
              <CardTitle className="text-3xl font-bold">
                {streak.currentStreak}
              </CardTitle>
              <CardDescription>Day Streak</CardDescription>
            </div>
          </div>
          {streak.isActive && (
            <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Multiplier Display */}
        {showMultiplier && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Zap className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                XP Bonus Active
              </p>
              <p className="text-lg font-bold text-yellow-600">
                ×{streak.xpMultiplier.toFixed(2)} ({Math.round((streak.xpMultiplier - 1) * 100)}% bonus)
              </p>
            </div>
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          {showMaxStreak && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Max Streak</p>
              <p className="text-2xl font-bold">{streak.maxStreak}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Activities</p>
            <p className="text-2xl font-bold">{streak.totalParticipation}</p>
          </div>
        </div>
        
        {/* Encouragement Message */}
        {streak.isActive && (
          <div className="text-xs text-center text-muted-foreground pt-2">
            Keep it up! Come back tomorrow to extend your streak.
          </div>
        )}
        {!streak.isActive && streak.currentStreak > 0 && (
          <div className="text-xs text-center text-yellow-600 dark:text-yellow-400 pt-2">
            Visit today to reactivate your streak!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
