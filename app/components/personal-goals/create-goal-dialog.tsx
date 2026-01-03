"use client"

import React, { useState } from "react"
import { toast } from "sonner"
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

interface CreateGoalDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateGoalDialog({ open, onClose, onSuccess }: CreateGoalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetValue: 10,
    reward: 100,
    deadline: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/personal-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline || undefined,
        })
      })

      if (!response.ok) {
        throw new Error("Nepodařilo se vytvořit cíl")
      }

      toast.success(`✅ Cíl "${formData.title}" byl úspěšně vytvořen.`)

      // Reset form
      setFormData({
        title: "",
        description: "",
        targetValue: 10,
        reward: 100,
        deadline: "",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se vytvořit cíl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>🎯 Vytvořit Osobní Cíl</DialogTitle>
          <DialogDescription>
            Nastav si vlastní cíl a sleduj svůj progres!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Název Cíle *</Label>
            <Input
              id="title"
              placeholder="např. Dokončit 10 úkolů z matematiky"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis (volitelné)</Label>
            <Textarea
              id="description"
              placeholder="Detailní popis tvého cíle..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Cílová Hodnota *</Label>
              <Input
                id="targetValue"
                type="number"
                min={1}
                max={1000}
                value={formData.targetValue}
                onChange={(e) =>
                  setFormData({ ...formData, targetValue: parseInt(e.target.value) })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Kolik kroků/úkolů chceš splnit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward">XP Odměna *</Label>
              <Input
                id="reward"
                type="number"
                min={10}
                max={1000}
                value={formData.reward}
                onChange={(e) =>
                  setFormData({ ...formData, reward: parseInt(e.target.value) })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                XP za dokončení cíle
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (volitelné)</Label>
            <Input
              id="deadline"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Můžeš si nastavit datum dokončení
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Zrušit
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Vytváření..." : "Vytvořit Cíl"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
