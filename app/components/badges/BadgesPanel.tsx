"use client"

import { useEffect, useState } from "react"
import { useSidebar } from "@/app/components/ui/V2sidebar"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useApi } from "@/app/hooks/use-api"
import { CreateBadgeDialog } from "./CreateBadgeDialog"
import { BadgeCard } from "./BadgeCard"
import { Badge as BadgeModel, ItemRarity } from "@/app/lib/generated"

type BadgeWithOwnership = BadgeModel & { owned: boolean; isPinned?: boolean }

export default function BadgesPanel({ isOperator = false }: { isOperator?: boolean }) {
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<{ badges: BadgeWithOwnership[] } | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/badges')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  const badges = data?.badges || []

  const filteredBadges = badges.filter(badge => {
    if (activeTab === "all") return true
    if (activeTab === "owned") return badge.owned
    if (activeTab === "unowned") return !badge.owned
    if (activeTab === "common") return badge.rarity === ItemRarity.COMMON
    if (activeTab === "rare") return badge.rarity === ItemRarity.RARE || badge.rarity === ItemRarity.UNCOMMON
    if (activeTab === "epic") return badge.rarity === ItemRarity.EPIC || badge.rarity === ItemRarity.LEGENDARY
    return true
  })

  const refresh = () => {
    execute(async () => {
      const res = await fetch('/api/badges')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
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
            <BadgeCard key={badge.id} badge={badge} onPinToggle={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}
