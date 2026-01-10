"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Calendar, Users, Trophy, Crown } from "lucide-react"
import { getGuildDetails } from "@/app/actions/admin"
import { toast } from "sonner"

interface GuildDetailModalProps {
  guildId: string | null
  isOpen: boolean
  onClose: () => void
}

interface GuildDetails {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    members: number
    quests: number
  }
  members: Array<{
    id: string
    username: string
    avatar: string | null
    role: string
    joinedAt: Date
  }>
  leader: {
    id: string
    name: string
    avatar: string | null
  } | null
}

export function GuildDetailModal({ guildId, isOpen, onClose }: GuildDetailModalProps) {
  const [guild, setGuild] = useState<GuildDetails | null>(null)
  const [loading, setLoading] = useState(false)

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
      setGuild(data)
    } catch (error) {
      console.error("Error fetching guild details:", error)
      toast.error("Chyba při načítání detailů guildy")
    } finally {
      setLoading(false)
    }
  }

  if (!guild) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {guild.name}
            <Badge variant={guild.isPublic ? "default" : "secondary"}>
              {guild.isPublic ? "Veřejná" : "Soukromá"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Základní informace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Členové:</span>
                  <span>{guild._count.members}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Úkoly:</span>
                  <span>{guild._count.quests}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Vytvořeno:</span>
                  <span>{new Date(guild.createdAt).toLocaleDateString('cs-CZ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Aktualizováno:</span>
                  <span>{new Date(guild.updatedAt).toLocaleDateString('cs-CZ')}</span>
                </div>
              </div>
              {guild.description && (
                <div>
                  <span className="text-sm font-medium">Popis:</span>
                  <p className="mt-1 text-sm text-muted-foreground">{guild.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leader */}
          {guild.leader && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Vůdce guildy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={guild.leader!.avatar || undefined} />
                    <AvatarFallback>{guild.leader!.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{guild.leader!.name}</p>
                    <p className="text-sm text-muted-foreground">Vůdce</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Členové ({guild.members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guild.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback>{member.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Připojil se {new Date(member.joinedAt).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Zavřít
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}