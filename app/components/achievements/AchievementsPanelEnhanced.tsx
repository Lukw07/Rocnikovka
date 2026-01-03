"use client"

/**
 * Rozšířený panel pro achievementy
 * Zobrazuje normal, hidden, progressive achievementy s progress barem
 */

import * as React from "react"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useApi } from "@/app/hooks/use-api"
import { Trophy, Lock, Zap, Star, Gift, TrendingUp } from "lucide-react"
import { cn } from "@/app/lib/utils"

type AchievementType = 'NORMAL' | 'HIDDEN' | 'TEMPORARY' | 'PROGRESSIVE' | 'STREAK'
type AchievementCategory = 'LEVEL' | 'XP' | 'ACTIVITY' | 'QUEST' | 'JOB' | 'SKILL' | 'REPUTATION' | 'SOCIAL' | 'COLLECTION' | 'SPECIAL' | 'OTHER'
type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

interface Achievement {
  id: string
  name: string
  description: string
  type: AchievementType
  category: AchievementCategory
  badgeUrl?: string
  icon?: string
  color?: string
  rarity: Rarity
  target?: number
  
  xpReward: number
  skillpointsReward: number
  reputationReward: number
  moneyReward: number
  
  isUnlocked: boolean
  progress?: {
    current: number
    target: number
    percentage: number
  }
  unlockedAt?: Date
  isVisible: boolean
}

export default function AchievementsPanelEnhanced() {
  const { data, loading, error, execute } = useApi<{ achievements: Achievement[] } | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all")

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/achievements/enhanced')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  const achievements: Achievement[] = data?.achievements || []

  // Filtrování
  const filteredAchievements = achievements.filter(a => {
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false
    
    if (activeTab === "unlocked") return a.isUnlocked
    if (activeTab === "locked") return !a.isUnlocked
    if (activeTab === "progressive") return a.type === 'PROGRESSIVE'
    
    return true
  })

  // Statistiky
  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.isUnlocked).length,
    locked: achievements.filter(a => !a.isUnlocked).length,
    progressive: achievements.filter(a => a.type === 'PROGRESSIVE').length
  }

  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case 'COMMON': return 'bg-slate-100 text-slate-700 border-slate-300'
      case 'UNCOMMON': return 'bg-green-100 text-green-700 border-green-300'
      case 'RARE': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'EPIC': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'LEGENDARY': return 'bg-amber-100 text-amber-700 border-amber-300'
    }
  }

  const getTypeIcon = (type: AchievementType) => {
    switch (type) {
      case 'HIDDEN': return <Lock className="h-4 w-4" />
      case 'PROGRESSIVE': return <TrendingUp className="h-4 w-4" />
      case 'STREAK': return <Zap className="h-4 w-4" />
      case 'TEMPORARY': return <Star className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">🏆 Achievements</h2>
          <p className="text-muted-foreground">
            {stats.unlocked} / {stats.total} odemčeno ({Math.round((stats.unlocked / stats.total) * 100)}%)
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Trophy className="h-3 w-3 mr-1" />
            {stats.unlocked} Unlocked
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Lock className="h-3 w-3 mr-1" />
            {stats.locked} Locked
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {stats.progressive} Progressive
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
          <TabsTrigger value="all" className="rounded-sm px-4 py-2">Vše ({stats.total})</TabsTrigger>
          <TabsTrigger value="unlocked" className="rounded-sm px-4 py-2">Odemčené ({stats.unlocked})</TabsTrigger>
          <TabsTrigger value="locked" className="rounded-sm px-4 py-2">Uzamčené ({stats.locked})</TabsTrigger>
          <TabsTrigger value="progressive" className="rounded-sm px-4 py-2">Progressive ({stats.progressive})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          size="sm" 
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
        >
          Vše
        </Button>
        {(['LEVEL', 'XP', 'ACTIVITY', 'QUEST', 'JOB', 'SKILL'] as AchievementCategory[]).map(cat => (
          <Button 
            key={cat}
            size="sm" 
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Loading/Error states */}
      {loading && <div className="text-sm text-muted-foreground">Načítání achievementů…</div>}
      {error && <div className="text-sm text-destructive">Chyba: {error}</div>}

      {/* Achievement Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <Card 
              key={achievement.id} 
              className={cn(
                "transition-all hover:shadow-lg border-2",
                achievement.isUnlocked ? "opacity-100" : "opacity-70",
                getRarityColor(achievement.rarity)
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xl",
                      achievement.color ? `bg-[${achievement.color}]` : "bg-gradient-to-br from-yellow-400 to-orange-500"
                    )}>
                      {achievement.icon || '🏆'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {achievement.name}
                      </CardTitle>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeIcon(achievement.type)}
                          <span className="ml-1">{achievement.type}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {achievement.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {achievement.isUnlocked && (
                    <div className="text-green-500">
                      <Trophy className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>

                {/* Progress bar pro PROGRESSIVE achievementy */}
                {achievement.type === 'PROGRESSIVE' && achievement.progress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{achievement.progress.current} / {achievement.progress.target}</span>
                    </div>
                    <Progress value={achievement.progress.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {achievement.progress.percentage}%
                    </p>
                  </div>
                )}

                {/* Odměny */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {achievement.xpReward > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {achievement.xpReward} XP
                    </Badge>
                  )}
                  {achievement.skillpointsReward > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      {achievement.skillpointsReward} SP
                    </Badge>
                  )}
                  {achievement.reputationReward > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Trophy className="h-3 w-3" />
                      {achievement.reputationReward} Rep
                    </Badge>
                  )}
                  {achievement.moneyReward > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Gift className="h-3 w-3" />
                      {achievement.moneyReward} 💰
                    </Badge>
                  )}
                </div>

                {/* Unlock date */}
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <p className="text-xs text-muted-foreground">
                    Odemčeno: {new Date(achievement.unlockedAt).toLocaleDateString('cs-CZ')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredAchievements.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Žádné achievementy v této kategorii</p>
        </Card>
      )}
    </div>
  )
}
