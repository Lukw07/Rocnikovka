"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Plus, Target, Trophy, Clock, TrendingUp } from "lucide-react"
import { CreateGoalDialog } from "./create-goal-dialog"
import { GoalDetailDialog } from "./goal-detail-dialog"

interface PersonalGoal {
  id: string
  title: string
  description: string | null
  targetValue: number
  currentValue: number
  reward: number
  status: "ACTIVE" | "COMPLETED" | "ABANDONED" | "EXPIRED"
  deadline: string | null
  reflection: string | null
  createdAt: string
  completedAt: string | null
}

interface GoalStats {
  total: number
  completed: number
  active: number
  abandoned: number
  expired: number
  completionRate: number
}

export function PersonalGoalsList() {
  const [goals, setGoals] = useState<PersonalGoal[]>([])
  const [stats, setStats] = useState<GoalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("ACTIVE")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<PersonalGoal | null>(null)

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const [goalsRes, statsRes] = await Promise.all([
        fetch(`/api/personal-goals?status=${filter}`),
        fetch("/api/personal-goals/stats"),
      ])

      if (!goalsRes.ok || !statsRes.ok) {
        throw new Error("Nepodařilo se načíst osobní cíle")
      }

      const goalsData = await goalsRes.json()
      const statsData = await statsRes.json()

      setGoals(goalsData.goals || [])
      setStats(statsData.stats || null)
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [filter])

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null
    const days = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkem Cílů</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dokončeno</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktivní</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Úspěšnost</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">🎯 Osobní Cíle</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nový Cíl
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "ACTIVE", label: "Aktivní", icon: "🔥" },
          { key: "COMPLETED", label: "Dokončené", icon: "✅" },
          { key: "EXPIRED", label: "Vypršené", icon: "⏰" },
          { key: "ABANDONED", label: "Opuštěné", icon: "❌" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = getProgressPercentage(goal.currentValue, goal.targetValue)
          const daysRemaining = getDaysRemaining(goal.deadline)

          return (
            <Card
              key={goal.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedGoal(goal)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{goal.title}</CardTitle>
                  <Badge
                    variant={
                      goal.status === "COMPLETED"
                        ? "default"
                        : goal.status === "ACTIVE"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {goal.status === "COMPLETED"
                      ? "✅"
                      : goal.status === "ACTIVE"
                      ? "🔥"
                      : goal.status === "EXPIRED"
                      ? "⏰"
                      : "❌"}
                  </Badge>
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {goal.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progres</span>
                    <span className="font-medium">
                      {goal.currentValue} / {goal.targetValue}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Deadline & Reward */}
                <div className="flex items-center justify-between text-sm">
                  {goal.deadline && daysRemaining !== null && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {daysRemaining > 0
                          ? `${daysRemaining} dní`
                          : daysRemaining === 0
                          ? "Dnes"
                          : "Vypršelo"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 font-medium text-primary">
                    <Trophy className="h-3 w-3" />
                    <span>{goal.reward} XP</span>
                  </div>
                </div>

                {/* Reflection indicator */}
                {goal.reflection && (
                  <div className="text-xs text-muted-foreground">
                    📝 Obsahuje sebehodnocení
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {goals.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎯</div>
            <h3 className="text-xl font-semibold">Žádné cíle</h3>
            <p className="text-muted-foreground">
              {filter === "ACTIVE"
                ? "Vytvoř si svůj první osobní cíl!"
                : `Nemáš žádné ${filter.toLowerCase()} cíle.`}
            </p>
            {filter === "ACTIVE" && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Vytvořit První Cíl
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <CreateGoalDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchGoals}
      />

      {selectedGoal && (
        <GoalDetailDialog
          goal={selectedGoal}
          open={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onUpdate={fetchGoals}
        />
      )}
    </div>
  )
}
