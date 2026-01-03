"use client"

import React, { useEffect, useState } from "react"

interface Quest {
  id: string
  title: string
  description: string
  category: string
  difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY"
  requiredLevel: number
  xpReward: number
  moneyReward: number
  userProgress?: {
    status: string
    progress: number
    completedAt: string | null
  }
}

const difficultyColors: Record<string, string> = {
  EASY: "text-green-500",
  MEDIUM: "text-yellow-500",
  HARD: "text-orange-500",
  LEGENDARY: "text-red-500"
}

const difficultyIcons: Record<string, string> = {
  EASY: "⭐",
  MEDIUM: "⭐⭐",
  HARD: "⭐⭐⭐",
  LEGENDARY: "⭐⭐⭐⭐"
}

export function QuestsList() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await fetch("/api/quests")
        if (!res.ok) throw new Error("Nepodařilo se načíst questy")
        const response = await res.json()
        setQuests(response.quests || [])
      } catch (error) {
        console.error("Failed to fetch quests:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuests()
  }, [])

  const filteredQuests = quests.filter(q => {
    if (filter === "all") return true
    if (filter === "completed") return q.userProgress?.status === "COMPLETED"
    if (filter === "in-progress") return q.userProgress?.status === "ACCEPTED" || q.userProgress?.status === "IN_PROGRESS"
    if (filter === "available") return !q.userProgress || q.userProgress?.status === "ABANDONED"
    return true
  })

  if (loading) {
    return <div className="p-4">Načítání questů...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {["all", "available", "in-progress", "completed"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "Všechny" : f === "available" ? "Dostupné" : f === "in-progress" ? "V Průběhu" : "Hotové"}
          </button>
        ))}
      </div>

      {/* Quests Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuests.map(quest => (
          <QuestCard key={quest.id} quest={quest} onUpdate={() => {}} />
        ))}
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Žádné questy v tomto filtru
        </div>
      )}
    </div>
  )
}

interface QuestCardProps {
  quest: Quest
  onUpdate?: () => void
}

export function QuestCard({ quest, onUpdate }: QuestCardProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(quest.userProgress?.status || "AVAILABLE")

  const handleAccept = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quests/${quest.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      if (!res.ok) throw new Error("Nepodařilo se přijmout quest")
      setStatus("ACCEPTED")
      onUpdate?.()
    } catch (error) {
      console.error("Failed to accept quest:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quests/${quest.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      if (!res.ok) throw new Error("Nepodařilo se dokončit quest")
      setStatus("COMPLETED")
      onUpdate?.()
    } catch (error) {
      console.error("Failed to complete quest:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAbandon = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quests/${quest.id}/abandon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      if (!res.ok) throw new Error("Nepodařilo se opustit quest")
      setStatus("ABANDONED")
      onUpdate?.()
    } catch (error) {
      console.error("Failed to abandon quest:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-card hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-lg">{quest.title}</h3>
          <p className={`text-sm ${difficultyColors[quest.difficulty]}`}>
            {difficultyIcons[quest.difficulty]} {quest.difficulty}
          </p>
        </div>
        <div className="text-xs bg-muted px-2 py-1 rounded">
          {quest.category}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {quest.description}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div>
          <span className="text-muted-foreground">XP:</span>
          <span className="ml-1 font-semibold text-yellow-500">{quest.xpReward}</span>
        </div>
        {quest.moneyReward > 0 && (
          <div>
            <span className="text-muted-foreground">Peníze:</span>
            <span className="ml-1 font-semibold text-green-500">{quest.moneyReward}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status !== "AVAILABLE" && status !== "ABANDONED" && (
        <div className="mb-3">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition ${
                status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${quest.userProgress?.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {status === "AVAILABLE" && (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50"
          >
            Přijmout
          </button>
        )}
        {status === "ACCEPTED" && (
          <>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm disabled:opacity-50"
            >
              Hotovo
            </button>
            <button
              onClick={handleAbandon}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm disabled:opacity-50"
            >
              Zrušit
            </button>
          </>
        )}
        {status === "COMPLETED" && (
          <div className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm text-center">
            ✓ Hotovo
          </div>
        )}
      </div>
    </div>
  )
}
