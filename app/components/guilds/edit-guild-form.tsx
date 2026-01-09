"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Switch } from "@/app/components/ui/switch"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Loader2, Save, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog"

interface Guild {
  id: string
  name: string
  description: string | null
  motto: string | null
  logoUrl: string | null
  isPublic: boolean
  maxMembers: number
}

interface EditGuildFormProps {
  guild: Guild
  isLeader: boolean
  isOfficer: boolean
}

export function EditGuildForm({ guild, isLeader, isOfficer }: EditGuildFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: guild.name,
    description: guild.description || "",
    motto: guild.motto || "",
    logoUrl: guild.logoUrl || "",
    isPublic: guild.isPublic,
    maxMembers: guild.maxMembers
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/guilds/${guild.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update guild")
      }

      setSuccess("Guilda byla úspěšně aktualizována")
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/guilds/${guild.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete guild")
      }

      router.push("/dashboard/guilds")
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upravit guildu</CardTitle>
          <CardDescription>
            Změňte nastavení vaší guildy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLeader && (
              <div className="space-y-2">
                <Label htmlFor="name">Název guildy</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Zadejte název guildy"
                  maxLength={50}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Popis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Popište vaši guildu..."
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motto">Motto</Label>
              <Input
                id="motto"
                value={formData.motto}
                onChange={(e) => handleInputChange("motto", e.target.value)}
                placeholder="Motto vaší guildy"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL loga</Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
              />
              <Label htmlFor="isPublic">Veřejná guilda</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">Maximum členů (5-10)</Label>
              <Input
                id="maxMembers"
                type="number"
                min={5}
                max={10}
                value={formData.maxMembers}
                onChange={(e) => handleInputChange("maxMembers", parseInt(e.target.value) || 10)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Uložit změny
              </Button>

              {isLeader && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={loading}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Smazat guildu
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Opravdu chcete smazat guildu?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tato akce je nevratná. Guilda "{guild.name}" bude trvale odstraněna
                        spolu se všemi členy, chat zprávami a aktivitami.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Zrušit</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Smazat guildu
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}