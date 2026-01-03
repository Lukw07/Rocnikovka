"use client"

import React, { useEffect, useState } from "react"

interface QuestStats {
  stats: Array<{ status: string; _count: number }>
  totalXP: number
  totalMoney: number
  completedCount: number
}

export function QuestTracker() {
  const [stats, setStats] = useState<QuestStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/quests/progress")
        if (!res.ok) throw new Error("Nepodařilo se načíst statistiky questů")
        const response = await res.json()
        // Parse progress data to calculate stats
        const completed = response.progress?.filter((p: any) => p.status === "COMPLETED") || []
        setStats({
          stats: response.progress || [],
          totalXP: completed.reduce((sum: number, p: any) => sum + p.quest.xpReward, 0),
          totalMoney: completed.reduce((sum: number, p: any) => sum + p.quest.moneyReward, 0),
          completedCount: completed.length
        })
      } catch (error) {
        console.error("Failed to fetch quest stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="p-4">Načítání statistik...</div>
  }

  if (!stats) {
    return <div className="p-4">Žádné statistiky</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Hotové questy</p>
        <p className="text-3xl font-bold text-blue-600">{stats.completedCount}</p>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Celkově XP</p>
        <p className="text-3xl font-bold text-yellow-600">{stats.totalXP}</p>
      </div>

      <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Celkově peníze</p>
        <p className="text-3xl font-bold text-green-600">{stats.totalMoney}</p>
      </div>
    </div>
  )
}
