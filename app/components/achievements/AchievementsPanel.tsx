"use client"

import * as React from "react"
import { useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { useApi } from "@/app/hooks/use-api"
import { useSidebar } from "@/app/components/ui/V2sidebar"

type Achievement = {
  id: string
  name: string
  description: string
  badgeUrl?: string
  isActive: boolean
  awardsCount?: number
}

export default function AchievementsPanel({ canManage = false }: { canManage?: boolean }) {
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<Achievement[] | { achievements: Achievement[] } | null>(null)

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/achievements')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  const achievements: Achievement[] = Array.isArray(data) ? data as Achievement[] : (data && 'achievements' in data ? data.achievements : [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Úspěchy</h2>
          <p className="text-muted-foreground text-sm">Seznam všech dostupných úspěchů a jejich statistik.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setSelectedPanel('dashboard')}>Zpět</Button>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Načítání úspěchů…</div>}
      {error && <div className="text-sm text-destructive">Chyba: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.length === 0 && (
            <div className="text-sm text-muted-foreground">Žádné úspěchy nebyly nalezeny.</div>
          )}

          {achievements.map(a => (
            <Card key={a.id} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {a.badgeUrl ? (
                      <AvatarImage src={a.badgeUrl} alt={a.name} />
                    ) : (
                      <AvatarFallback className="text-sm">{a.name?.slice(0,2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>

                  <div>
                    <CardTitle>{a.name}</CardTitle>
                    <CardDescription className="text-sm">{a.description}</CardDescription>
                  </div>
                </div>
                <div data-slot="card-action">
                  <Badge variant={a.isActive ? "default" : "outline"} className="ml-2">
                    {a.isActive ? 'Aktivní' : 'Neaktivní'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Udílení: {a.awardsCount ?? 0}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(`/achievements/${a.id}`, '_blank')}>Detail</Button>
                    {canManage && (
                      <Button size="sm" variant="ghost" onClick={async () => {
                        try {
                          const res = await fetch(`/api/achievements/${a.id}/toggle`, { method: 'POST' })
                          if (!res.ok) throw new Error('Nezdařilo se změnit stav')
                          // refresh list
                          execute(async () => {
                            const r = await fetch('/api/achievements')
                            if (!r.ok) throw new Error(`API error ${r.status}`)
                            return r.json()
                          })
                        } catch (err) {
                          // noop - useApi will set error if thrown from execute
                          console.error(err)
                        }
                      }}>Přepnout</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
