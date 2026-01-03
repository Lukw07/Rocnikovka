import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Zap, TrendingUp } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface LevelProgressProps {
  level: number
  totalXP: number
  xpNeededForNextLevel: number
  xpForNextLevel: number
  progressPercent?: number
  compact?: boolean
  showXPText?: boolean
}

/**
 * Displays player level with progress bar to next level
 * Shows current XP and total XP needed for next level
 */
export function LevelProgress({
  level,
  totalXP,
  xpNeededForNextLevel,
  xpForNextLevel,
  progressPercent,
  compact = false,
  showXPText = true
}: LevelProgressProps) {
  // Calculate progress if not provided
  const xpInCurrentLevel = totalXP - (totalXP - xpNeededForNextLevel)
  const actualProgress = progressPercent ?? Math.min(100, Math.max(0, (xpInCurrentLevel / xpForNextLevel) * 100))
  
  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            Level <span className="text-lg text-yellow-500">{level}</span>
          </span>
          {showXPText && (
            <span className="text-xs text-muted-foreground">
              {xpNeededForNextLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
            </span>
          )}
        </div>
        <Progress value={actualProgress} className="h-2" />
      </div>
    )
  }
  
  return (
    <Card className="border-gradient">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-xl">
              Level {level}
            </CardTitle>
            <Badge variant="secondary" className="ml-2">
              {Math.round(actualProgress)}%
            </Badge>
          </div>
        </div>
        <CardDescription>Progress to next level</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={actualProgress} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-mono">
              {xpNeededForNextLevel.toLocaleString()} XP
            </span>
            <span className="font-mono">
              {xpForNextLevel.toLocaleString()} XP needed
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Current XP</p>
            <p className="text-sm font-mono font-bold">{totalXP.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Until Level {level + 1}</p>
            <p className="text-sm font-mono font-bold text-yellow-500">
              {Math.max(0, xpNeededForNextLevel).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
