"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { toast } from "sonner"
import { Plus } from "lucide-react"

interface CreateAchievementDialogProps {
  onSuccess: () => void
}

export function CreateAchievementDialog({ onSuccess }: CreateAchievementDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [badgeUrl, setBadgeUrl] = useState("")
  const [criteria, setCriteria] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          badgeUrl: badgeUrl || undefined,
          criteria: criteria || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create achievement")
      }

      toast.success("Úspěch vytvořen", {
        description: "Nový úspěch byl úspěšně přidán do systému."
      })
      
      setOpen(false)
      resetForm()
      onSuccess()
    } catch (error) {
      console.error("Error creating achievement:", error)
      toast.error("Chyba", {
        description: error instanceof Error ? error.message : "Nepodařilo se vytvořit úspěch"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setBadgeUrl("")
    setCriteria("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Nový úspěch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vytvořit nový úspěch</DialogTitle>
          <DialogDescription>
            Přidejte nový úspěch, který mohou studenti získat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Název</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Např. První kroky"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Popis úspěchu..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="badgeUrl">URL Odznaku (volitelné)</Label>
            <Input
              id="badgeUrl"
              value={badgeUrl}
              onChange={(e) => setBadgeUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="criteria">Kritéria (volitelné)</Label>
            <Input
              id="criteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Podmínky pro získání..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Vytvářím..." : "Vytvořit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
