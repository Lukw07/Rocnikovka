"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { UserRole, ItemRarity, ItemType } from "@/app/lib/generated"
import { Coins, Package, ShoppingCart } from "lucide-react"
import { BuyItemDialog } from "./BuyItemDialog"
import { ItemManagement } from "./ItemManagement"
import { toast } from "sonner"
import { RpgCard } from "@/app/components/ui/rpg-card"
import { RpgButton } from "@/app/components/ui/rpg-button"
import { cn } from "@/app/lib/utils"

interface ShopInterfaceProps {
  userId: string
  userRole: UserRole
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
}

interface ShopData {
  items: Item[]
  userBalance?: number
  userPurchases?: any[]
}

const MAX_PER_ITEM = 10
const REFRESH_INTERVAL_LABEL = "Obchod se obnovuje každých 24 hodin"

const rarityBadgeClasses: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]: "bg-gray-100 text-gray-800 border-gray-300",
  [ItemRarity.UNCOMMON]: "bg-green-100 text-green-800 border-green-300",
  [ItemRarity.RARE]: "bg-blue-100 text-blue-800 border-blue-300",
  [ItemRarity.EPIC]: "bg-purple-100 text-purple-800 border-purple-300",
  [ItemRarity.LEGENDARY]: "bg-orange-100 text-orange-800 border-orange-300",
}

// Helper funkce pro získání nákupní konfigurace
const getPurchaseConfig = (item: Item) => {
  const config = (item as any).purchaseConfig as { maxPerUser?: number; isSinglePurchase?: boolean } | null
  
  // Výchozí chování
  const isCosmetic = item.type === ItemType.COSMETIC
  const defaultMaxPerUser = isCosmetic ? 1 : MAX_PER_ITEM
  const defaultIsSinglePurchase = isCosmetic
  
  return {
    maxPerUser: config?.maxPerUser ?? defaultMaxPerUser,
    isSinglePurchase: config?.isSinglePurchase ?? defaultIsSinglePurchase,
  }
}

export function ShopInterface({ userId, userRole }: ShopInterfaceProps) {
  const [shopData, setShopData] = useState<ShopData>({ items: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [buyingItem, setBuyingItem] = useState<string | null>(null)

  useEffect(() => {
    fetchShopData()
  }, [])

  const fetchShopData = async () => {
    try {
      setError(null)
      const response = await fetch("/api/shop?active=true")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shop data: ${response.statusText}`)
      }
      
      const data = await response.json()
      setShopData(data.data || data)
    } catch (error) {
      console.error("Error fetching shop data:", error)
      setError(error instanceof Error ? error.message : "Failed to load shop data")
    } finally {
      setLoading(false)
    }
  }

  const handleBuyItem = async (itemId: string) => {
    try {
      setBuyingItem(itemId)
      setError(null)
      
      const response = await fetch("/api/shop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ itemId })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to purchase item")
      }
      
      // Trigger stats update
      fetch('/api/progression/stats').catch(() => {})
      
      // Refresh shop data to update balance and purchases
      await fetchShopData()
      setSelectedItem(null)
      toast.success("Předmět zakoupen", {
        description: "Předmět byl úspěšně přidán do vašeho inventáře."
      })
      
      // Trigger page reload to update inventory and balance
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Error buying item:", error)
      const message = error instanceof Error ? error.message : "Failed to purchase item"
      setError(message)
      toast.error("Chyba při nákupu", {
        description: message
      })
    } finally {
      setBuyingItem(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Načítání obchodu...</div>
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">Chyba: {error}</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/backgrounds/shop_bc.jpg)", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/75" />

      <div className="relative px-3 sm:px-4 lg:px-6 py-6 max-w-[1280px] mx-auto">
        <div className="rounded-2xl bg-[#1c120b] border border-[#c58a5c]/45 shadow-[0_18px_40px_rgba(0,0,0,0.55)] p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[#f7e7d2]">
            <div className="text-lg font-semibold">{REFRESH_INTERVAL_LABEL}</div>
            <div className="text-sm text-[#e8d7c0]/80">Limit na položku: {MAX_PER_ITEM} ks</div>
          </div>
        <Tabs defaultValue="shop" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shop" className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Obchod</span>
          </TabsTrigger>
          {(userRole === UserRole.OPERATOR || userRole === UserRole.TEACHER) && (
            <TabsTrigger value="management" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Správa předmětů</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="shop" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 xl:gap-5">
            {shopData.items.map((item) => {
              const purchasedCount = shopData.userPurchases?.filter(p => p.itemId === item.id).length ?? 0
              const config = getPurchaseConfig(item)
              const remaining = Math.max(config.maxPerUser - purchasedCount, 0)
              const isPurchased = purchasedCount > 0
              const canPurchase = remaining > 0 && !isPurchased
              
              return (
                <RpgCard
                  key={item.id}
                  variant="quest"
                  padding="sm"
                  className="relative overflow-hidden border-[#5c3b1d]/85 bg-gradient-to-br from-[#5a3921] via-[#4a2f1a] to-[#3a2414] shadow-[0_12px_28px_rgba(0,0,0,0.55)] flex flex-col"
                >
                  <div className="relative space-y-4 flex-1 flex flex-col">
                    {/* Header s ikonou a názvem */}
                    <div className="flex items-start gap-3">
                      <div className="relative h-20 w-20 shrink-0 rounded-xl bg-gradient-to-br from-[#8c5a2d] via-[#704722] to-[#5a3619] border-2 border-[#d1a671]/70 shadow-[0_10px_22px_rgba(0,0,0,0.35)] overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white text-xl font-black">
                            {item.name.slice(0, 1)}
                          </div>
                        )}
                        <div className="absolute inset-x-1 -bottom-2 h-2 rounded-full bg-black/15 blur-md" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="rounded-lg bg-gradient-to-r from-[#6b4526]/85 via-[#805330]/85 to-[#6b4526]/85 px-3 py-2 border border-[#d1a671]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                          <div className="font-cinzel text-sm font-bold text-[#f7e7d2] leading-tight drop-shadow-[0_1px_0_rgba(0,0,0,0.45)]">
                            {item.name}
                          </div>
                        </div>

                        <Badge
                          className={cn(
                            "uppercase tracking-wide text-[10px] font-semibold border shadow-sm bg-[#f7e7d2] text-[#3b240e] w-fit",
                            rarityBadgeClasses[item.rarity] || "bg-gray-100 text-gray-800 border-gray-300"
                          )}
                        >
                          {item.rarity}
                        </Badge>
                      </div>
                    </div>

                    {/* Popis */}
                    <p className="text-xs text-[#e8d7c0]/80 leading-relaxed px-1 flex-1">{item.description}</p>

                    {/* Limit info */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f7e7d2] px-3 py-1 text-xs font-semibold text-[#2f1a0c] border border-[#d1862e]/60 shadow-sm w-fit">
                      <ShoppingCart className="w-3 h-3" />
                      {config.isSinglePurchase 
                        ? isPurchased 
                          ? "Již vlastníte" 
                          : "Koupit jen jednou"
                        : `Zbývá: ${remaining} / ${config.maxPerUser}`
                      }
                    </div>
                  </div>

                  {/* Cena a tlačítko - vždycky dole */}
                  <div className="flex items-center justify-between rounded-lg border border-[#d1862e]/70 bg-gradient-to-r from-[#f7d27a] via-[#f3b74e] to-[#e98c2f] px-4 py-2 shadow-inner mt-auto">
                    <div className="flex items-center gap-2 text-[#3b240e]">
                      <Coins className="w-5 h-5" />
                      <span className="text-lg font-black leading-none">{item.price}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5c3614]">mincí</span>
                    </div>

                    {userRole === UserRole.STUDENT && (
                      <RpgButton
                        variant="quest"
                        size="sm"
                        glow
                        className="min-w-[90px]"
                        onClick={() => setSelectedItem(item)}
                        disabled={buyingItem === item.id || !canPurchase}
                      >
                        {buyingItem === item.id
                          ? "Nakupuji..."
                          : !canPurchase
                            ? isPurchased && config.isSinglePurchase
                              ? "Vlastníte"
                              : "Vyprodáno"
                            : "Koupit"}
                      </RpgButton>
                    )}
                  </div>
                </RpgCard>
              )
            })}
          </div>
        </TabsContent>

        {(userRole === UserRole.OPERATOR || userRole === UserRole.TEACHER) && (
          <TabsContent value="management">
            <ItemManagement onItemUpdated={fetchShopData} />
          </TabsContent>
        )}
      </Tabs>

      {/* Buy Item Dialog */}
      {selectedItem && (
        <BuyItemDialog
          item={selectedItem}
          userBalance={shopData.userBalance || 0}
          onBuy={handleBuyItem}
          onClose={() => setSelectedItem(null)}
          loading={buyingItem === selectedItem.id}
        />
      )}
    </div>
    </div>
    </div>
  )
}
