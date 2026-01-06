"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
type ItemRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | string
type ItemType = "COSMETIC" | "BOOST" | "COLLECTIBLE" | "CONSUMABLE" | "EQUIPMENT" | string
import { Eye, EyeOff, Settings } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Switch } from "@/app/components/ui/switch"

interface ItemManagementProps {
  onItemUpdated: () => void
}

interface Item {
  id: string
  name: string
  description: string
  price: number
  rarity: ItemRarity
  type: ItemType
  imageUrl?: string
  isActive: boolean
  purchaseConfig?: { maxPerUser?: number; isSinglePurchase?: boolean } | null
}

export function ItemManagement({ onItemUpdated }: ItemManagementProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editConfig, setEditConfig] = useState({ maxPerUser: 10, isSinglePurchase: false })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setError(null)
      const response = await fetch("/api/items")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.statusText}`)
      }
      
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error fetching items:", error)
      setError(error instanceof Error ? error.message : "Failed to load items")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleItem = async (itemId: string) => {
    try {
      setTogglingItem(itemId)
      setError(null)
      
      const response = await fetch(`/api/items/${itemId}/toggle`, {
        method: "POST"
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to toggle item")
      }
      
      await fetchItems()
      onItemUpdated()
      toast.success("Stav předmětu změněn", {
        description: "Viditelnost předmětu byla aktualizována."
      })
    } catch (error) {
      console.error("Error toggling item:", error)
      const message = error instanceof Error ? error.message : "Failed to toggle item"
      setError(message)
      toast.error("Chyba", {
        description: message
      })
    } finally {
      setTogglingItem(null)
    }
  }

  const handleSaveConfig = async (itemId: string) => {
    try {
      const response = await fetch("/api/items/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          maxPerUser: editConfig.maxPerUser,
          isSinglePurchase: editConfig.isSinglePurchase,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save config")
      }

      await fetchItems()
      setEditingItemId(null)
      toast.success("Konfigurace uložena", {
        description: "Limity nákupu byly aktualizovány."
      })
    } catch (error) {
      console.error("Error saving config:", error)
      const message = error instanceof Error ? error.message : "Failed to save config"
      toast.error("Chyba", { description: message })
    }
  }

  const openEditDialog = (item: Item) => {
    const config = (item.purchaseConfig as any) || { maxPerUser: 10, isSinglePurchase: false }
    setEditConfig({
      maxPerUser: config.maxPerUser || 10,
      isSinglePurchase: config.isSinglePurchase || false,
    })
    setEditingItemId(item.id)
  }

  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case "COMMON": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "UNCOMMON": return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
      case "RARE": return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
      case "EPIC": return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200"
      case "LEGENDARY": return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case "COSMETIC": return "bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200"
      case "BOOST": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
      case "COLLECTIBLE": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Načítání předmětů...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Správa předmětů</h2>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className={!item.isActive ? "opacity-60" : ""}>
            {item.imageUrl && (
              <div className="w-full h-32 bg-muted/50 flex items-center justify-center p-4 border-b">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge className={getRarityColor(item.rarity)}>
                    {item.rarity}
                  </Badge>
                  <Badge className={getTypeColor(item.type)}>
                    {item.type}
                  </Badge>
                </div>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.price} mincí</span>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Limity
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nastavit nákupní limity - {item.name}</DialogTitle>
                        <DialogDescription>
                          Konfiguruj kolik může hráč koupit tohoto předmětu
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="maxPerUser" className="text-base">
                            Max počet na hráče
                          </Label>
                          <Input
                            id="maxPerUser"
                            type="number"
                            min="1"
                            value={editConfig.maxPerUser}
                            onChange={(e) => setEditConfig(prev => ({
                              ...prev,
                              maxPerUser: parseInt(e.target.value) || 1
                            }))}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Kolikrát mohou hráči koupit tento předmět
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="singlePurchase" className="text-base cursor-pointer">
                              Koupit jen jednou
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Pokud zapnuto, hráč může koupit jen 1x
                            </p>
                          </div>
                          <Switch
                            id="singlePurchase"
                            checked={editConfig.isSinglePurchase}
                            onCheckedChange={(checked) => setEditConfig(prev => ({
                              ...prev,
                              isSinglePurchase: checked
                            }))}
                          />
                        </div>

                        <Button
                          onClick={() => handleSaveConfig(item.id)}
                          className="w-full"
                        >
                          Uložit
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleItem(item.id)}
                    disabled={togglingItem === item.id}
                  >
                    {togglingItem === item.id ? (
                      "Načítání..."
                    ) : item.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Deaktivovat
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Aktivovat
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
