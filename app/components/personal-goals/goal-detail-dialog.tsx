"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"
import { Trophy, Clock, Target, TrendingUp, Trash2 } from "lucide-react"

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

interface GoalDetailDialogProps {
  goal: PersonalGoal
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function GoalDetailDialog({ goal, open, onClose, onUpdate }: GoalDetailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [increment, setIncrement] = useState(1)
  const [reflection, setReflection] = useState(goal.reflection || "")

  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100)

  const handleUpdateProgress = async () => {
    if (goal.status !== "ACTIVE") {
      toast.error("Tento cíl již není aktivní")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/personal-goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          increment,
          reflection: reflection || undefined,
        })
      })

      if (!res.ok) throw new Error("Nepodařilo se aktualizovat progres")

      toast.success(`Přidal jsi ${increment} k svému cíli.`)

      onUpdate()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se aktualizovat progres")
    } finally {
      setLoading(false)
    }
  }

  const handleAbandon = async () => {
    if (!confirm("Opravdu chceš opustit tento cíl?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/personal-goals/${goal.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Nepodařilo se opustit cíl")

      toast.success("❌ Cíl opuštěn", {
        description: "Cíl byl označen jako opuštěný",
      })

      onUpdate()
      onClose()
    } catch (error: any) {
      toast.error("❌ Chyba", {
        description: error.message || "Nepodařilo se opustit cíl",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = () => {
    if (!goal.deadline) return null
    const days = Math.ceil(
      (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }

  const daysRemaining = getDaysRemaining()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl">{goal.title}</DialogTitle>
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
                ? "✅ Dokončeno"
                : goal.status === "ACTIVE"
                ? "🔥 Aktivní"
                : goal.status === "EXPIRED"
                ? "⏰ Vypršelo"
                : "❌ Opuštěno"}
            </Badge>
          </div>
          {goal.description && (
            <DialogDescription className="text-base">{goal.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1 text-center p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-sm">Progres</span>
              </div>
              <div className="text-2xl font-bold">
                {goal.currentValue}/{goal.targetValue}
              </div>
            </div>

            <div className="space-y-1 text-center p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Odměna</span>
              </div>
              <div className="text-2xl font-bold text-primary">{goal.reward} XP</div>
            </div>

            <div className="space-y-1 text-center p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Zbývá</span>
              </div>
              <div className="text-2xl font-bold">
                {daysRemaining !== null
                  ? daysRemaining > 0
                    ? `${daysRemaining}d`
                    : "Dnes"
                  : "∞"}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Celkový Progres</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Reflection Display */}
          {goal.reflection && goal.status !== "ACTIVE" && (
            <div className="space-y-2">
              <Label>📝 Sebehodnocení</Label>
              <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                {goal.reflection}
              </div>
            </div>
          )}

          {/* Update Progress (only for active goals) */}
          {goal.status === "ACTIVE" && (
            <div className="space-y-4 p-4 rounded-lg border">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Aktualizovat Progres
              </h3>

              <div className="space-y-2">
                <Label htmlFor="increment">Přidat k progresu</Label>
                <Input
                  id="increment"
                  type="number"
                  min={1}
                  max={goal.targetValue - goal.currentValue}
                  value={increment}
                  onChange={(e) => setIncrement(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reflection">
                  Sebehodnocení (volitelné) - Co se povedlo? Co můžeš zlepšit?
                </Label>
                <Textarea
                  id="reflection"
                  placeholder="Zamysli se nad svým pokrokem..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {reflection.length}/1000 znaků
                </p>
              </div>

              <Button
                onClick={handleUpdateProgress}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Aktualizuji..." : `Přidat +${increment}`}
              </Button>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Vytvořeno: {new Date(goal.createdAt).toLocaleString("cs-CZ")}</div>
            {goal.completedAt && (
              <div>Dokončeno: {new Date(goal.completedAt).toLocaleString("cs-CZ")}</div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {goal.status === "ACTIVE" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleAbandon}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Opustit Cíl
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Zavřít
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
