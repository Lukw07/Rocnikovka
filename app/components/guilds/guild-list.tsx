"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Checkbox } from "@/app/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/app/components/ui/select"
import { Progress } from "@/app/components/ui/progress"
import {
  Users,
  Trophy,
  Coins,
  TrendingUp,
  Lock,
  LockOpen,
  UserPlus,
  ArrowRight,
  Scroll
} from "lucide-react"
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
  createdAt?: string
}

export function GuildList() {
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [publicOnly, setPublicOnly] = useState(false)
  const [withSpaceOnly, setWithSpaceOnly] = useState(false)
  const [sortBy, setSortBy] = useState("xp")
  const [actioningGuildId, setActioningGuildId] = useState<string | null>(null)
  const [requestedGuilds, setRequestedGuilds] = useState<Record<string, boolean>>({})
  const [joinedGuilds, setJoinedGuilds] = useState<Record<string, boolean>>({})

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

  const filteredGuilds = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    const base = guilds
      .filter((guild) => {
        const matchesName = guild.name.toLowerCase().includes(term)
        const matchesDescription = (guild.description || "").toLowerCase().includes(term)
        return term === "" || matchesName || matchesDescription
      })
      .filter((guild) => !publicOnly || guild.isPublic)
      .filter((guild) => !withSpaceOnly || guild.memberCount < guild.maxMembers)

    return base.sort((a, b) => {
      if (sortBy === "xp") return b.xp - a.xp
      if (sortBy === "members") return b.memberCount - a.memberCount
      if (sortBy === "level") return b.level - a.level
      if (sortBy === "recent") {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bDate - aDate
      }
      return 0
    })
  }, [guilds, publicOnly, searchTerm, sortBy, withSpaceOnly])

  const handleJoin = async (guildId: string) => {
    setActioningGuildId(guildId)
    try {
      const res = await fetch(`/api/guilds/${guildId}/join`, {
        method: "POST"
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Nepodařilo se připojit ke guildě")
      }

      setJoinedGuilds((prev) => ({ ...prev, [guildId]: true }))
    } catch (error) {
      console.error("Join guild failed", error)
      alert((error as Error).message)
    } finally {
      setActioningGuildId(null)
    }
  }

  const handleRequestJoin = async (guildId: string) => {
    setActioningGuildId(guildId)
    try {
      const res = await fetch(`/api/guilds/${guildId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Nepodařilo se odeslat žádost")
      }

      setRequestedGuilds((prev) => ({ ...prev, [guildId]: true }))
    } catch (error) {
      console.error("Request join failed", error)
      alert((error as Error).message)
    } finally {
      setActioningGuildId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Načítání guild...</div>
  }

  const renderStatus = (isPublic: boolean) => {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {isPublic ? (
          <>
            <LockOpen className="h-4 w-4 text-emerald-600" />
            <span>Veřejná</span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 text-amber-700" />
            <span>Soukromá</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-dashed bg-gradient-to-r from-amber-50/70 via-white to-stone-50">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border bg-amber-100/60 text-amber-800 text-lg">
                🧭
              </div>
              <div>
                <p className="text-sm font-medium">Najdi si guildu</p>
                <p className="text-xs text-muted-foreground">Hledej podle názvu, filtruj veřejné a seřaď podle výkonu.</p>
              </div>
            </div>
            <div className="grid flex-1 gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Hledat podle názvu nebo popisu"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="public-only"
                  checked={publicOnly}
                  onCheckedChange={(checked) => setPublicOnly(Boolean(checked))}
                />
                <label htmlFor="public-only" className="text-sm text-muted-foreground">
                  Pouze veřejné
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="with-space"
                  checked={withSpaceOnly}
                  onCheckedChange={(checked) => setWithSpaceOnly(Boolean(checked))}
                />
                <label htmlFor="with-space" className="text-sm text-muted-foreground">
                  Se volným místem
                </label>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[220px]" aria-label="Řadit podle">
                <SelectValue placeholder="Řadit podle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xp">Nejvíce XP</SelectItem>
                <SelectItem value="members">Nejvíce členů</SelectItem>
                <SelectItem value="level">Nejvyšší level</SelectItem>
                <SelectItem value="recent">Nejnovější</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Tip: Piš bohaté popisy – lákavé guildy se zobrazí výše ve vyhledávání.
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredGuilds.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Zatím neexistují žádné guildy. Buď první a založ novou!
          </CardContent>
        </Card>
      ) : (
        filteredGuilds.map((guild) => {
          const memberProgress = Math.min((guild.memberCount / guild.maxMembers) * 100, 100)
          const crestContent = guild.logoUrl ? (
            <img
              src={guild.logoUrl}
              alt={guild.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">🎖️</div>
          )

          const memberFull = guild.memberCount >= guild.maxMembers
          const joinDisabled = memberFull || !guild.isPublic || actioningGuildId === guild.id || joinedGuilds[guild.id]
          const requestDisabled = memberFull || actioningGuildId === guild.id || requestedGuilds[guild.id]

          return (
            <Card
              key={guild.id}
              className="group overflow-hidden border-amber-100/80 bg-gradient-to-r from-amber-50/60 via-white to-stone-50 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="flex flex-1 gap-4">
                    <div className="relative">
                      <div className="h-20 w-20 overflow-hidden rounded-xl border border-amber-100 bg-amber-100/70 shadow-sm">
                        {crestContent}
                      </div>
                      <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] shadow-sm">
                        Erb
                      </Badge>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-2xl leading-tight">{guild.name}</CardTitle>
                            <Badge className="bg-amber-500 text-amber-50 shadow-sm">Level {guild.level}</Badge>
                          </div>
                          {guild.motto && (
                            <CardDescription className="italic text-amber-900/70">
                              &quot;{guild.motto}&quot;
                            </CardDescription>
                          )}
                        </div>
                        <div className="shrink-0">
                          {renderStatus(guild.isPublic)}
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {guild.description || "Žádný popis..."}
                      </p>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border bg-white/70 p-3 shadow-sm">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4 text-blue-600" />
                            Členové
                          </div>
                          <p className="text-lg font-semibold">
                            {guild.memberCount}/{guild.maxMembers}
                          </p>
                        </div>

                        <div className="rounded-xl border bg-white/70 p-3 shadow-sm">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            XP
                          </div>
                          <p className="flex items-center gap-2 text-lg font-semibold">
                            {guild.xp.toLocaleString()}
                            <Scroll className="h-4 w-4 text-amber-600" />
                          </p>
                        </div>

                        <div className="rounded-xl border bg-white/70 p-3 shadow-sm">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Coins className="h-4 w-4 text-amber-600" />
                            Pokladna
                          </div>
                          <p className="text-lg font-semibold">{guild.treasury} 💰</p>
                        </div>

                        <div className="rounded-xl border bg-white/70 p-3 shadow-sm">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Level
                          </div>
                          <p className="text-lg font-semibold">{guild.level}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Kapacita členů</span>
                          <span>{guild.memberCount}/{guild.maxMembers}</span>
                        </div>
                        <Progress value={memberProgress} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-white/70 p-3 shadow-sm lg:w-64 lg:flex-col lg:items-end lg:justify-start lg:gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Link href={`/dashboard/guilds/${guild.id}`} className="flex items-center gap-1 text-sm">
                        Více informací
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>

                    {guild.isPublic ? (
                      <Button
                        onClick={() => handleJoin(guild.id)}
                        disabled={joinDisabled}
                        className="w-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {joinedGuilds[guild.id]
                          ? "Připojeno"
                          : joinDisabled
                            ? "Nelze se připojit"
                            : "Připojit se"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRequestJoin(guild.id)}
                        disabled={requestDisabled}
                        className="w-full bg-amber-500 text-white shadow-md hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {requestedGuilds[guild.id]
                          ? "Žádost odeslána"
                          : requestDisabled
                            ? "Nelze požádat"
                            : "Požádat o vstup"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
