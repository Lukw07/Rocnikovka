"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Activity, Coins, ShoppingBag, ArrowDownCircle, ArrowUpCircle, Sparkles, Shuffle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"

interface ActivityEntry {
  id: string
  type: "money" | "xp" | "purchase" | "trade" | "job" | "badge"
  title: string
  description?: string
  amount?: number
  currency?: "money" | "xp"
  direction?: "in" | "out"
  createdAt: string
  meta?: Record<string, any>
}

const typeMeta: Record<ActivityEntry["type"], { icon: React.ComponentType<any>; color: string; label: string }> = {
  money: { icon: Coins, color: "text-amber-600", label: "Finance" },
  xp: { icon: Sparkles, color: "text-purple-600", label: "XP" },
  purchase: { icon: ShoppingBag, color: "text-blue-600", label: "Nákup" },
  trade: { icon: Shuffle, color: "text-emerald-600", label: "Trade" },
  job: { icon: Activity, color: "text-slate-600", label: "Úkol" },
  badge: { icon: Activity, color: "text-indigo-600", label: "Badge" }
}

export function PlayerActivityPanel() {
  const [data, setData] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>("all")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/me/activity?limit=100")
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      setData(json.data?.activity || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    if (tab === "all") return data
    return data.filter((d) => d.type === tab)
  }, [data, tab])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Moje aktivita</h2>
          <p className="text-muted-foreground">Finance, nákupy, trade a XP změny</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Obnovit
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setTab} value={tab} className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="all">Vše</TabsTrigger>
          <TabsTrigger value="money">Finance</TabsTrigger>
          <TabsTrigger value="purchase">Nákupy</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="xp">XP</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Aktivita</CardTitle>
              <CardDescription>Seřazeno od nejnovější</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Načítám…</div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="text-muted-foreground text-sm">Žádná aktivita.</div>
              )}
              {!loading && filtered.map((item) => {
                const meta = typeMeta[item.type]
                const Icon = meta.icon
                const isIn = item.direction === "in"
                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white/60">
                    <div className={`mt-1 p-2 rounded-md bg-gray-100 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "d.M.yyyy HH:mm", { locale: cs })}</div>
                      </div>
                      {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{meta.label}</Badge>
                        {item.amount !== undefined && item.currency && (
                          <div className={`text-sm font-semibold ${isIn ? "text-green-600" : "text-red-600"}`}>
                            {isIn ? "+" : "-"}{Math.abs(item.amount)} {item.currency === "money" ? "Kč" : "XP"}
                          </div>
                        )}
                        {item.type === "trade" && item.meta?.counterpartName && (
                          <div className="text-xs text-muted-foreground">Protistrana: {item.meta.counterpartName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
