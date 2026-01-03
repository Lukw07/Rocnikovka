"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { toast } from "sonner"
import { Sword, Heart, Users, Trophy, Zap, Shield, TrendingUp } from "lucide-react"

interface BossStats {
  dungeonRun: {
    id: string
    bossId: string
    status: string
    currentHp: number
    totalDamage: number
    participantIds: string[]
    boss: {
      id: string
      name: string
      description: string | null
      maxHp: number
      level: number
      xpReward: number
      moneyReward: number
    }
  }
  totalDamage: number
  remainingHp: number
  progress: number
  participantCount: number
  damageByUser: Record<string, number>
  topDamageDealer?: [string, number]
}

interface BossBattleUIProps {
  eventId: string
  onVictory?: () => void
}

export function BossBattleUI({ eventId, onVictory }: BossBattleUIProps) {
  const [dungeonRunId, setDungeonRunId] = useState<string | null>(null)
  const [stats, setStats] = useState<BossStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [attacking, setAttacking] = useState(false)
  const [damage, setDamage] = useState("100")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (dungeonRunId) {
      fetchStats()
      // Auto-refresh každých 5 sekund
      const interval = setInterval(fetchStats, 5000)
      return () => clearInterval(interval)
    }
    // Cleanup when dungeonRunId is not present
    return undefined
  }, [dungeonRunId])

  const startBossFight = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/events/v2/boss/${eventId}/start`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to start boss fight")
      }
      
      setDungeonRunId(data.dungeonRun.id)
      await fetchStats()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!dungeonRunId) return
    
    try {
      const response = await fetch(`/api/events/v2/boss/dungeon/${dungeonRunId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch stats")
      }
      
      setStats(data.stats)
      
      // Check if boss is defeated
      if (data.stats.remainingHp === 0 && data.stats.dungeonRun.status === "COMPLETED") {
        onVictory?.()
      }
    } catch (err: any) {
      console.error("Failed to fetch stats:", err)
    }
  }

  const handleAttack = async () => {
    if (!dungeonRunId) return
    
    try {
      setAttacking(true)
      const response = await fetch(`/api/events/v2/boss/dungeon/${dungeonRunId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ damage: parseInt(damage) })
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Attack failed")
      }
      
      if (data.isDefeated) {
        // Trigger stats update on victory
        fetch('/api/progression/stats').catch(() => {})
        toast.success('Boss poražen!', {
          description: 'Získali jste odměny za vítězství!'
        })
        onVictory?.()
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
      
      await fetchStats()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAttacking(false)
    }
  }

  if (!dungeonRunId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Boss Fight</CardTitle>
          <CardDescription>
            Připrav se na epický souboj!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive mb-4">{error}</p>
          )}
          <Button 
            onClick={startBossFight} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Načítání...' : '⚔️ Zahájit Boss Fight'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const boss = stats.dungeonRun.boss
  const isDefeated = stats.dungeonRun.status === "COMPLETED"
  const hpPercentage = (stats.remainingHp / boss.maxHp) * 100

  return (
    <div className="space-y-6">
      {/* Boss Card */}
      <Card className={`border-2 ${isDefeated ? 'border-green-500' : 'border-red-500'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl">🐉 {boss.name}</CardTitle>
                <Badge variant="destructive">Level {boss.level}</Badge>
              </div>
              {boss.description && (
                <CardDescription className="text-base">
                  {boss.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* HP Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart className={`w-5 h-5 ${isDefeated ? 'text-gray-400' : 'text-red-500'}`} />
                <span className="font-bold">HP</span>
              </div>
              <span className="text-sm font-medium">
                {stats.remainingHp.toLocaleString()} / {boss.maxHp.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={hpPercentage} 
              className={`h-6 ${isDefeated ? 'bg-gray-200' : ''}`}
            />
            <p className="text-xs text-center text-muted-foreground">
              {stats.progress}% poškození
            </p>
          </div>

          {isDefeated ? (
            <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg text-center space-y-3">
              <h3 className="text-2xl font-bold text-green-600">🎉 Boss poražen!</h3>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">+{boss.xpReward} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">+{boss.moneyReward} mincí</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  min="1"
                  max="10000"
                  placeholder="Damage"
                  className="flex-1"
                />
                <Button 
                  onClick={handleAttack} 
                  disabled={attacking}
                  size="lg"
                  className="min-w-[120px]"
                >
                  <Sword className="w-4 h-4 mr-2" />
                  {attacking ? 'Útočím...' : 'Útok!'}
                </Button>
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDamage("100")}
                >
                  100
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDamage("500")}
                >
                  500
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDamage("1000")}
                >
                  1000
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Celkové poškození
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalDamage.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Účastníci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.participantCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Nejvyšší damage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.topDamageDealer ? stats.topDamageDealer[1].toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Damage Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Žebříček poškození
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.damageByUser)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([userId, dmg], index) => (
                <div 
                  key={userId} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium truncate">
                      Player {userId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(dmg / stats.totalDamage) * 100} 
                      className="w-20 h-2"
                    />
                    <span className="font-bold min-w-[80px] text-right">
                      {dmg.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
