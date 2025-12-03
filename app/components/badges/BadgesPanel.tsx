"use client"

import { useEffect, useState } from "react"
import { useSidebar } from "@/app/components/ui/V2sidebar"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useApi } from "@/app/hooks/use-api"
import { CreateBadgeDialog } from "./CreateBadgeDialog"
import { ItemType } from "@/app/lib/generated"
import { cn } from "@/app/lib/utils"

type Item = {
  id: string
  name: string
  description: string
  price: number
  rarity: string
  type: string
  imageUrl?: string
  isActive: boolean
  isPurchasable: boolean
}

export default function BadgesPanel({ isOperator = false }: { isOperator?: boolean }) {
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<{ items: Item[] } | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/items')
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return res.json()
    })
  }, [execute])

  const items = data?.items?.filter(item => item.type === ItemType.COLLECTIBLE) || []

  const filteredItems = items.filter(item => {
    if (activeTab === "all") return true
    if (activeTab === "levels") return item.name.toLowerCase().includes("level")
    if (activeTab === "activities") return !item.name.toLowerCase().includes("level") // Simple heuristic
    return true
  })

  const refresh = () => {
    execute(async () => {
      const res = await fetch('/api/items')
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
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
          <TabsTrigger value="all" className="rounded-sm px-4 py-2">Všechno</TabsTrigger>
          <TabsTrigger value="levels" className="rounded-sm px-4 py-2">Levely</TabsTrigger>
          <TabsTrigger value="activities" className="rounded-sm px-4 py-2">Aktivity</TabsTrigger>
          <TabsTrigger value="other" className="rounded-sm px-4 py-2">Ostatní</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && <div className="text-sm text-muted-foreground">Načítání odznaků…</div>}
      {error && <div className="text-sm text-destructive">Chyba: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Žádné odznaky v této kategorii.
            </div>
          )}

          {filteredItems.map(item => (
            <Card key={item.id} className={cn(
              "flex flex-col items-center text-center h-full transition-all hover:shadow-md",
              !item.isActive && "opacity-60 grayscale"
            )}>
              <CardHeader className="pb-2 pt-6 w-full flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                    {item.imageUrl ? (
                      <AvatarImage src={item.imageUrl} alt={item.name} />
                    ) : (
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {item.name?.slice(0,2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {/* Optional: Add a decorative ring or badge indicator if needed */}
                </div>
                <CardTitle className="text-lg font-bold leading-tight">{item.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 pb-2 w-full">
                <CardDescription className="text-sm line-clamp-3">
                  {item.description}
                </CardDescription>
              </CardContent>

              <CardFooter className="pb-6 pt-2 w-full flex flex-col gap-2 justify-center">
                {item.isPurchasable ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                    {item.price} mincí
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Nelze zakoupit
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground italic">
                  - Dev team
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
