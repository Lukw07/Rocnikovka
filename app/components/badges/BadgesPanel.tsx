"use client"

import { useEffect } from "react"
import { useSidebar } from "@/app/components/ui/V2sidebar"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { useApi } from "@/app/hooks/use-api"
import { CreateBadgeDialog } from "./CreateBadgeDialog"
import { ItemType } from "@/app/lib/generated"

type Item = {
  id: string
  name: string
  description: string
  price: number
  rarity: string
  type: string
  imageUrl?: string
  isActive: boolean
}

export default function BadgesPanel({ isOperator = false }: { isOperator?: boolean }) {
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<{ items: Item[] } | null>(null)

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/items')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  const items = data?.items?.filter(item => item.type === ItemType.COLLECTIBLE) || []

  const refresh = () => {
    execute(async () => {
      const res = await fetch('/api/items')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Odznaky</h2>
          <p className="text-muted-foreground text-sm">Sběratelské odznaky, které si můžete zakoupit.</p>
        </div>
        <div className="flex items-center gap-2">
          {isOperator && (
            <CreateBadgeDialog onSuccess={refresh} />
          )}
          <Button variant="ghost" onClick={() => setSelectedPanel('dashboard')}>Zpět</Button>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Načítání odznaků…</div>}
      {error && <div className="text-sm text-destructive">Chyba: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">Žádné odznaky nebyly nalezeny.</div>
          )}

          {items.map(item => (
            <Card key={item.id} className={`h-full ${!item.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {item.imageUrl ? (
                      <AvatarImage src={item.imageUrl} alt={item.name} />
                    ) : (
                      <AvatarFallback className="text-sm">{item.name?.slice(0,2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>

                  <div>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{item.rarity}</Badge>
                  <Badge variant="secondary">{item.price} mincí</Badge>
                  {!item.isActive && <Badge variant="destructive">Neaktivní</Badge>}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
