"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, Trash2, Edit } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { ItemRarity, ItemType } from "@/app/lib/generated"
import { CreateItemDialog } from "./CreateItemDialog"

interface Item {
  id: string
  name: string
  description: string
  price: number
  rarity: ItemRarity
  type: ItemType
  imageUrl?: string
  isActive: boolean
  isPurchasable: boolean
}

export function AdminShopPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items")
      if (!response.ok) throw new Error("Failed to fetch items")
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error(error)
      toast.error("Chyba při načítání předmětů")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleItem = async (itemId: string) => {
    try {
      setTogglingItem(itemId)
      const response = await fetch(`/api/items/${itemId}/toggle`, {
        method: "POST"
      })
      
      if (!response.ok) throw new Error("Failed to toggle item")
      
      await fetchItems()
      toast.success("Stav předmětu změněn")
    } catch (error) {
      toast.error("Chyba při změně stavu")
    } finally {
      setTogglingItem(null)
    }
  }

  const activeItems = items.filter(i => i.isActive)
  const inactiveItems = items.filter(i => !i.isActive)

  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case ItemRarity.COMMON: return "bg-slate-100 text-slate-800 border-slate-200"
      case ItemRarity.UNCOMMON: return "bg-green-100 text-green-800 border-green-200"
      case ItemRarity.RARE: return "bg-blue-100 text-blue-800 border-blue-200"
      case ItemRarity.EPIC: return "bg-purple-100 text-purple-800 border-purple-200"
      case ItemRarity.LEGENDARY: return "bg-amber-100 text-amber-800 border-amber-200"
      default: return "bg-slate-100 text-slate-800"
    }
  }

  const ItemCard = ({ item }: { item: Item }) => (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
        <Badge variant="outline" className={getRarityColor(item.rarity)}>
          {item.rarity}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-md object-cover bg-muted" />
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
              No img
            </div>
          )}
          <div>
            <CardTitle className="text-base">{item.name}</CardTitle>
            <CardDescription className="text-xs line-clamp-1">{item.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="font-medium">{item.price} mincí</span>
          <span className="text-muted-foreground">{item.type}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={item.isActive ? "destructive" : "default"} 
            size="sm" 
            className="w-full"
            onClick={() => handleToggleItem(item.id)}
            disabled={togglingItem === item.id}
          >
            {togglingItem === item.id ? (
              <span className="animate-pulse">...</span>
            ) : item.isActive ? (
              <>
                <EyeOff className="mr-2 h-3 w-3" />
                Skrýt
              </>
            ) : (
              <>
                <Eye className="mr-2 h-3 w-3" />
                Zobrazit
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Správa obchodu</h2>
          <p className="text-muted-foreground">Spravujte předměty a jejich dostupnost v obchodě.</p>
        </div>
        <CreateItemDialog onSuccess={fetchItems} />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-green-500" />
          Aktivní nabídka (Rotující předměty)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeItems.length === 0 ? (
            <div className="col-span-full p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
              Žádné aktivní předměty. Přidejte je ze seznamu níže.
            </div>
          ) : (
            activeItems.map(item => <ItemCard key={item.id} item={item} />)
          )}
        </div>
      </div>

      <div className="space-y-4 pt-8 border-t">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <EyeOff className="h-5 w-5 text-muted-foreground" />
          Všechny předměty (Inventář)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {inactiveItems.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              Žádné neaktivní předměty.
            </div>
          ) : (
            inactiveItems.map(item => <ItemCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  )
}
