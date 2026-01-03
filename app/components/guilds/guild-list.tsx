"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Users, Trophy, Coins, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Guild {
  id: string
  name: string
  description: string | null
  motto: string | null
  logoUrl: string | null
  level: number
  xp: number
  treasury: number
  memberCount: number
  maxMembers: number
  isPublic: boolean
}

export function GuildList() {
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuilds()
  }, [])

  const fetchGuilds = async () => {
    try {
      const res = await fetch("/api/guilds")
      const data = await res.json()
      setGuilds(data.guilds || [])
    } catch (error) {
      console.error("Failed to fetch guilds:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Načítání guild...</div>
  }

  return (
    <div className="space-y-4">
      {guilds.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Zatím neexistují žádné guildy. Buď první a založ novou!
          </CardContent>
        </Card>
      ) : (
        guilds.map((guild) => (
          <Card key={guild.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {guild.logoUrl && (
                    <img
                      src={guild.logoUrl}
                      alt={guild.name}
                      className="w-12 h-12 rounded-lg"
                    />
                  )}
                  <div>
                    <CardTitle className="text-xl">{guild.name}</CardTitle>
                    {guild.motto && (
                      <CardDescription className="italic">
                        &quot;{guild.motto}&quot;
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">
                    Level {guild.level}
                  </Badge>
                  {guild.isPublic ? (
                    <Badge variant="secondary" className="text-xs">Veřejná</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Soukromá</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {guild.description || "Žádný popis..."}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    {guild.memberCount}/{guild.maxMembers}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{guild.xp} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">{guild.treasury} 💰</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Lvl {guild.level}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="default" className="flex-1">
                  <Link href={`/dashboard/guilds/${guild.id}`}>
                    Detail
                  </Link>
                </Button>
                {guild.memberCount < guild.maxMembers && guild.isPublic && (
                  <Button variant="outline">
                    Připojit se
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
