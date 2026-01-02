"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useApi } from "@/app/hooks/use-api"
import { useSidebar } from "@/app/components/ui/Sidebar"
import { CreateAchievementDialog } from "./CreateAchievementDialog"
import { Trophy, Check } from "lucide-react"
import { cn } from "@/app/lib/utils"

type Achievement = {
  id: string
  name: string
  description: string
  badgeUrl?: string
  isActive: boolean
  awardsCount?: number
  target?: number
}

export default function AchievementsPanel({ canManage = false, isOperator = false }: { canManage?: boolean, isOperator?: boolean }) {
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<Achievement[] | { achievements: Achievement[] } | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/achievements')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  const achievements: Achievement[] = Array.isArray(data) ? data as Achievement[] : (data && 'achievements' in data ? data.achievements : [])

  const filteredAchievements = achievements.filter(a => {
    if (activeTab === "all") return true
    // Add more filters if needed
    return true
  })

  const getAchievementColor = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("bronze")) return "bg-orange-100 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900"
    if (lowerName.includes("silver")) return "bg-slate-100 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800"
    if (lowerName.includes("gold")) return "bg-yellow-100 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900"
    if (lowerName.includes("emerald")) return "bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
    return "bg-card"
  }

  const getIconColor = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("bronze")) return "text-orange-600"
    if (lowerName.includes("silver")) return "text-slate-600"
    if (lowerName.includes("gold")) return "text-yellow-600"
    if (lowerName.includes("emerald")) return "text-emerald-600"
    return "text-muted-foreground"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Achievements</h2>
          <p className="text-muted-foreground">Označují dosažené cíle, ocenění nebo milníky, kterých jste dosáhli</p>
        </div>
        <div className="flex items-center gap-2">
          {isOperator && (
            <CreateAchievementDialog onSuccess={() => {
              execute(async () => {
                const res = await fetch('/api/achievements')
                if (!res.ok) throw new Error(`API error ${res.status}`)
                return res.json()
              })
            }} />
          )}
          <Button variant="ghost" onClick={() => setSelectedPanel('dashboard')}>Zpět</Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
          <TabsTrigger value="all" className="rounded-sm px-4 py-2">Level</TabsTrigger>
          <TabsTrigger value="activities" className="rounded-sm px-4 py-2">Aktivity</TabsTrigger>
          <TabsTrigger value="other" className="rounded-sm px-4 py-2">Ostatní</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && <div className="text-sm text-muted-foreground">Načítání úspěchů…</div>}
      {error && <div className="text-sm text-destructive">Chyba: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAchievements.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Žádné úspěchy nebyly nalezeny.
            </div>
          )}

          {filteredAchievements.map(a => (
            <Card key={a.id} className={cn(
              "transition-all hover:shadow-md border",
              getAchievementColor(a.name),
              !a.isActive && "opacity-60 grayscale"
            )}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-background/50",
                  getIconColor(a.name)
                )}>
                  {a.badgeUrl ? (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={a.badgeUrl} alt={a.name} />
                      <AvatarFallback><Trophy className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <Trophy className="h-8 w-8" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-none tracking-tight truncate pr-2" title={a.name}>
                      {a.name}
                    </h3>
                    {/* Placeholder for completion check - logic needs user data */}
                    {/* <Check className="h-4 w-4 text-green-600 shrink-0" /> */}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {a.description}
                  </p>

                  {a.target ? (
                    <div className="pt-2 space-y-1">
                      <Progress value={0} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progres</span>
                        <span>0/{a.target}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 h-7"></div> // Spacer to keep cards aligned
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
