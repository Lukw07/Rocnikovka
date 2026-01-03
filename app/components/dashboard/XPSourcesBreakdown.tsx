"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { BarChart3, TrendingUp, Target } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface XPSource {
  type: string
  count: number
  totalXP: number
  bonusXP: number
}

interface XPSourcesBreakdownProps {
  sources?: XPSource[]
  summary?: {
    totalXP: number
    totalBonusXP: number
    sourceCount: number
    activityCount: number
  }
  isLoading?: boolean
}

/**
 * Shows XP earned from different sources (jobs, quests, activity, etc.)
 * Displays breakdown and bonus XP earned
 */
export function XPSourcesBreakdown({
  sources = [],
  summary,
  isLoading = false
}: XPSourcesBreakdownProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const sourceLabels: Record<string, { label: string; color: string; icon: string }> = {
    JOB: { label: "Jobs", color: "bg-blue-100 dark:bg-blue-950", icon: "💼" },
    QUEST: { label: "Quests", color: "bg-purple-100 dark:bg-purple-950", icon: "⚔️" },
    ACTIVITY: { label: "Activity", color: "bg-green-100 dark:bg-green-950", icon: "✨" },
    ATTENDANCE: { label: "Attendance", color: "bg-orange-100 dark:bg-orange-950", icon: "📍" },
    EVENT: { label: "Events", color: "bg-pink-100 dark:bg-pink-950", icon: "🎉" },
    ACHIEVEMENT: { label: "Achievements", color: "bg-yellow-100 dark:bg-yellow-950", icon: "🏆" },
    BONUS: { label: "Bonuses", color: "bg-red-100 dark:bg-red-950", icon: "⭐" }
  }
  
  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />
  }
  
  if (!sources || sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            XP Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No XP sources yet. Complete jobs, quests, or participate in activities!
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // Calculate total for percentages
  const totalXP = sources.reduce((sum, s) => sum + s.totalXP, 0)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          XP Sources Breakdown
        </CardTitle>
        <CardDescription>
          {summary && `${summary.activityCount} activities earned ${summary.totalXP.toLocaleString()} XP`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground">Total XP</p>
              <p className="text-lg font-bold">{summary.totalXP.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground">Bonus XP</p>
              <p className="text-lg font-bold text-yellow-600">+{summary.totalBonusXP.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground">Activities</p>
              <p className="text-lg font-bold">{summary.activityCount}</p>
            </div>
          </div>
        )}
        
        {/* Sources List */}
        <div className="space-y-3">
          {sources.map((source) => {
            const config = sourceLabels[source.type as keyof typeof sourceLabels] || {
              label: source.type,
              color: "bg-gray-100 dark:bg-gray-900",
              icon: "💬"
            }
            const percentage = totalXP > 0 ? (source.totalXP / totalXP) * 100 : 0
            
            return (
              <div key={source.type} className="space-y-1">
                {/* Source Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="font-semibold text-sm">{config.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {source.count} {source.count === 1 ? 'activity' : 'activities'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{source.totalXP.toLocaleString()} XP</p>
                    {source.bonusXP > 0 && (
                      <p className="text-xs text-yellow-600">+{source.bonusXP} bonus</p>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className={cn("h-2 rounded-full bg-muted relative overflow-hidden", config.color)}>
                  <div
                    className="h-full bg-linear-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {/* Percentage */}
                <p className="text-xs text-muted-foreground text-right">
                  {percentage.toFixed(1)}% of total
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
