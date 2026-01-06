"use client"

import { useEffect, useState } from "react"
import { useSidebar } from "@/app/components/ui/Sidebar"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useApi } from "@/app/hooks/use-api"
import { CreateBadgeDialog } from "./CreateBadgeDialog"
import { BadgeCard } from "./BadgeCard"
import type { Badge as BadgeModel } from "@/app/lib/generated"
import { Button as UIButton } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Badge as UiBadge } from "@/app/components/ui/badge"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

type BadgeWithOwnership = BadgeModel & { owned: boolean; isPinned?: boolean }
type BadgeRequest = {
  id: string
  status: string
  createdAt: string
  job: { id: string; title: string }
  badge: { id: string; name: string }
  requester: { id: string; name: string }
}

export default function BadgesPanel({ isOperator = false }: { isOperator?: boolean }) {
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<{ badges: BadgeWithOwnership[] } | null>(null)
  const { data: requestData, loading: requestsLoading, error: requestsError, execute: executeRequests } = useApi<{ data?: { requests: BadgeRequest[] } } | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/badges')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  useEffect(() => {
    if (!isOperator) return
    executeRequests(async () => {
      const res = await fetch('/api/admin/job-badge-requests')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [executeRequests, isOperator])

  const badges = data?.badges || []

  const filteredBadges = badges.filter(badge => {
    if (activeTab === "all") return true
    if (activeTab === "owned") return badge.owned
    if (activeTab === "unowned") return !badge.owned
    if (activeTab === "common") return badge.rarity === "COMMON"
    if (activeTab === "rare") return badge.rarity === "RARE" || badge.rarity === "UNCOMMON"
    if (activeTab === "epic") return badge.rarity === "EPIC" || badge.rarity === "LEGENDARY"
    return true
  })

  const refresh = () => {
    execute(async () => {
      const res = await fetch('/api/badges')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }

  const refreshRequests = () => {
    if (!isOperator) return
    executeRequests(async () => {
      const res = await fetch('/api/admin/job-badge-requests')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }

  const handleRequest = async (requestId: string, action: "approve" | "reject") => {
    const resp = await fetch('/api/admin/job-badge-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action })
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      toast.error('Akce se nezdařila', { description: err.error || 'Zkuste to prosím znovu' })
      return
    }

    toast.success(action === 'approve' ? 'Badge schválen' : 'Badge zamítnut')
    refresh()
    refreshRequests()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Badges</h2>
          <p className="text-muted-foreground">Dekorativní avatar border značící získané milníky</p>
        </div>
        <div className="flex items-center gap-2">
          {isOperator && (
            <CreateBadgeDialog onSuccess={refresh} />
          )}
          <Button variant="ghost" onClick={() => setSelectedPanel('dashboard')}>Zpět</Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 flex-wrap">
          <TabsTrigger value="all" className="rounded-sm px-4 py-2">Všechno</TabsTrigger>
          <TabsTrigger value="owned" className="rounded-sm px-4 py-2">Vlastněné</TabsTrigger>
          <TabsTrigger value="unowned" className="rounded-sm px-4 py-2">Nevlastněné</TabsTrigger>
          <TabsTrigger value="common" className="rounded-sm px-4 py-2">Běžné</TabsTrigger>
          <TabsTrigger value="rare" className="rounded-sm px-4 py-2">Vzácné</TabsTrigger>
          <TabsTrigger value="epic" className="rounded-sm px-4 py-2">Epické+</TabsTrigger>
        </TabsList>
      </Tabs>

      {isOperator && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Žádosti o badge k úkolům</h3>
            <UIButton variant="outline" size="sm" onClick={refreshRequests}>
              <Loader2 className="w-4 h-4 mr-2" />
              Obnovit
            </UIButton>
          </div>
          {requestsLoading && <div className="text-sm text-muted-foreground">Načítám žádosti…</div>}
          {requestsError && <div className="text-sm text-destructive">Chyba: {requestsError}</div>}
          {!requestsLoading && (requestData?.data?.requests?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">Žádné čekající žádosti.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requestData?.data?.requests?.map((req) => (
              <Card key={req.id} className="border-l-4 border-l-amber-400">
                <CardHeader>
                  <CardTitle className="text-base">{req.badge.name}</CardTitle>
                  <CardDescription>{req.job.title}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="space-y-1 text-sm">
                    <div>Žádá: <UiBadge variant="outline">{req.requester.name}</UiBadge></div>
                    <div className="text-muted-foreground">Status: {req.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UIButton size="sm" variant="outline" onClick={() => handleRequest(req.id, 'reject')}>
                      <XCircle className="w-4 h-4 mr-1 text-red-500" /> Zamítnout
                    </UIButton>
                    <UIButton size="sm" onClick={() => handleRequest(req.id, 'approve')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Schválit
                    </UIButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="text-sm text-muted-foreground">Načítání odznaků…</div>}
      {error && <div className="text-sm text-destructive">Chyba: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredBadges.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Žádné odznaky v této kategorii.
            </div>
          )}

          {filteredBadges.map(badge => (
            <BadgeCard key={badge.id} badge={badge} onPinToggle={refresh} isOperator={isOperator} />
          ))}
        </div>
      )}
    </div>
  )
}
