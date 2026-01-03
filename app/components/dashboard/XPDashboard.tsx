"use client"

import React, { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { LevelProgress } from "./LevelProgress"
import { StreakDisplay } from "./StreakDisplay"
import { XPSourcesBreakdown } from "./XPSourcesBreakdown"
import { useXPData, useXPSources, useStreak } from "@/app/hooks/use-xp"
import { Zap, Flame, BarChart3 } from "lucide-react"

interface XPDashboardProps {
  userId: string
  showTabs?: boolean
  defaultTab?: "level" | "streak" | "sources"
}

/**
 * Complete XP Dashboard - integrates level, streak, and sources
 * Shows comprehensive gamification stats
 */
export function XPDashboard({
  userId,
  showTabs = true,
  defaultTab = "level"
}: XPDashboardProps) {
  const { xpData, loading: xpLoading, fetchXP } = useXPData(userId)
  const { sources, loading: sourcesLoading, fetchSources } = useXPSources(userId)
  const { streak, loading: streakLoading, fetchStreak } = useStreak(userId)
  
  // Fetch all data on mount
  useEffect(() => {
    fetchXP()
    fetchSources()
    fetchStreak()
  }, [userId, fetchXP, fetchSources, fetchStreak])
  
  if (showTabs) {
    return (
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="level" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Level</span>
          </TabsTrigger>
          <TabsTrigger value="streak" className="gap-2">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Streak</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Sources</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="level" className="space-y-4">
          {xpData && (
            <LevelProgress
              level={xpData.level}
              totalXP={xpData.totalXP}
              xpNeededForNextLevel={xpData.xpNeededForNextLevel}
              xpForNextLevel={xpData.xpForNextLevel}
              progressPercent={xpData.progressToNextLevel}
            />
          )}
        </TabsContent>
        
        <TabsContent value="streak" className="space-y-4">
          <StreakDisplay
            streak={streak ?? undefined}
            isLoading={streakLoading}
            showMaxStreak={true}
            showMultiplier={true}
          />
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-4">
          <XPSourcesBreakdown
            sources={sources?.breakdown}
            summary={sources?.summary}
            isLoading={sourcesLoading}
          />
        </TabsContent>
      </Tabs>
    )
  }
  
  // Non-tabbed layout - show all three side by side
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        {xpData && (
          <LevelProgress
            level={xpData.level}
            totalXP={xpData.totalXP}
            xpNeededForNextLevel={xpData.xpNeededForNextLevel}
            xpForNextLevel={xpData.xpForNextLevel}
            progressPercent={xpData.progressToNextLevel}
            compact={true}
          />
        )}
      </div>
      
      <div>
        <StreakDisplay
          streak={streak ?? undefined}
          isLoading={streakLoading}
          showMaxStreak={false}
          compact={true}
        />
      </div>
      
      <div>
        <XPSourcesBreakdown
          sources={sources?.breakdown?.slice(0, 3)}
          summary={sources?.summary}
          isLoading={sourcesLoading}
        />
      </div>
    </div>
  )
}
