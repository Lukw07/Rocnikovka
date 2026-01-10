"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import { Switch } from "@/app/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { updateGuild, getGuildDetails } from "@/app/actions/admin"
import { toast } from "sonner"

interface GuildEditModalProps {
  guildId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface GuildData {
  id: string
  name: string
  description: string | null
  isPublic: boolean
}

export function GuildEditModal({ guildId, isOpen, onClose, onSuccess }: GuildEditModalProps) {
  const [guild, setGuild] = useState<GuildData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (guildId && isOpen) {
      fetchGuildDetails()
    }
  }, [guildId, isOpen])

  const fetchGuildDetails = async () => {
    if (!guildId) return

    setLoading(true)
    try {
      const data = await getGuildDetails(guildId)
      setGuild({
        id: data.id,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic
      })
    } catch (error) {
      console.error("Error fetching guild details:", error)
      toast.error("Chyba při načítání detailů guildy")
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!guild) return

    setSaving(true)
    try {
      await updateGuild(guild.id, {
        name: guild.name,
        description: guild.description || undefined,
        isPublic: guild.isPublic
      })
      toast.success("Guilda byla úspěšně aktualizována")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating guild:", error)
      toast.error("Chyba při aktualizaci guildy")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof GuildData, value: string | boolean) => {
    if (!guild) return
    setGuild({ ...guild, [field]: value })
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Načítání...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!guild) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upravit guildu</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nastavení guildy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Název guildy</Label>
                <Input
                  id="name"
                  value={guild.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Zadejte název guildy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis guildy</Label>
                <Textarea
                  id="description"
                  value={guild.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Zadejte popis guildy (volitelné)"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={guild.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
                <Label htmlFor="isPublic">Veřejná guilda</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Veřejné guildy mohou být nalezeny a připojit se k nim mohou všichni uživatelé.
                Soukromé guildy vyžadují pozvání.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Ukládání..." : "Uložit změny"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}