"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Badge } from "@/app/components/ui/badge"
import { ItemRarity, ItemType } from "@/app/lib/generated"
import { Coins, AlertTriangle } from "lucide-react"
import { RpgButton } from "@/app/components/ui/rpg-button"
import { RpgCard } from "@/app/components/ui/rpg-card"
import { cn } from "@/app/lib/utils"

interface BuyItemDialogProps {
  item: {
    id: string
    name: string
    description: string
    price: number
    rarity: ItemRarity
    type: ItemType
  }
  userBalance: number
  onBuy: (itemId: string) => Promise<void>
  onClose: () => void
  loading: boolean
}

export function BuyItemDialog({ item, userBalance, onBuy, onClose, loading }: BuyItemDialogProps) {
  const [error, setError] = useState<string | null>(null)

  const handleBuy = async () => {
    try {
      setError(null)
      await onBuy(item.id)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to purchase item")
    }
  }

  const canAfford = userBalance >= item.price

  const rarityBadgeClasses: Record<ItemRarity, string> = {
    [ItemRarity.COMMON]: "bg-gray-100 text-gray-800 border-gray-300",
    [ItemRarity.UNCOMMON]: "bg-green-100 text-green-800 border-green-300",
    [ItemRarity.RARE]: "bg-blue-100 text-blue-800 border-blue-300",
    [ItemRarity.EPIC]: "bg-purple-100 text-purple-800 border-purple-300",
    [ItemRarity.LEGENDARY]: "bg-orange-100 text-orange-800 border-orange-300",
  }

  const typeBadgeClasses: Partial<Record<ItemType, string>> = {
    [ItemType.COSMETIC]: "bg-pink-100 text-pink-800 border-pink-300",
    [ItemType.BOOST]: "bg-yellow-100 text-yellow-800 border-yellow-300",
    [ItemType.COLLECTIBLE]: "bg-indigo-100 text-indigo-800 border-indigo-300",
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white bg-opacity-100 bg-gradient-to-b from-[#fffaf0] via-[#f9f1e4] to-[#f3dfc3] border-[#c58a5c]/85 shadow-[0_22px_46px_rgba(0,0,0,0.3)] text-[#2b1a0f] backdrop-blur-none">
        <DialogHeader className="border-none pb-2 mb-0">
          <DialogTitle className="text-2xl font-cinzel text-[#2b1a0f]">Koupit předmět</DialogTitle>
          <DialogDescription className="text-sm text-[#3a2313]">Potvrďte nákup tohoto předmětu</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RpgCard variant="quest" padding="sm" className="relative overflow-hidden border-[#c58a5c]/80 bg-gradient-to-br from-[#fff0d9]/92 via-[#ffdca9]/85 to-[#f7b45e]/80 text-[#2b1a0f]">
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.55),transparent_38%),radial-gradient(circle_at_82%_10%,rgba(255,255,255,0.32),transparent_36%)]" />
            <div className="relative space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-cinzel text-xl font-bold text-[#2b1a0f] leading-tight">{item.name}</h3>
                  <p className="text-sm text-[#3a2313] leading-relaxed">{item.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className={cn("uppercase tracking-wide text-[10px] font-semibold border shadow-sm", rarityBadgeClasses[item.rarity])}>
                    {item.rarity}
                  </Badge>
                  <Badge className={cn(
                    "uppercase tracking-wide text-[10px] font-semibold border shadow-sm",
                    typeBadgeClasses[item.type] || "bg-gray-100 text-gray-800 border-gray-300"
                  )}>
                    {item.type}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#c37528]/80 bg-gradient-to-r from-[#ffeac0] via-[#ffd07c] to-[#f7a64a] px-4 py-2 shadow-inner">
                <div className="flex items-center gap-2 text-[#2b1a0f] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
                  <Coins className="w-5 h-5" />
                  <span className="text-lg font-black leading-none">{item.price}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#45280f]">mincí</span>
                </div>
              </div>
            </div>
          </RpgCard>

          <div className="flex items-center justify-between rounded-lg border border-[#c58a5c]/80 bg-gradient-to-r from-[#fffdf7] via-[#faebcf]/95 to-[#fffdf7] px-4 py-3 shadow-inner">
            <span className="text-[#2b1a0f] font-semibold">Váš zůstatek:</span>
            <div className="flex items-center gap-2 text-[#2b1a0f]">
              <Coins className="w-4 h-4" />
              <span className="font-bold">{userBalance} mincí</span>
            </div>
          </div>

          {!canAfford && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/12 text-destructive shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Nedostatek mincí. Potřebujete ještě {item.price - userBalance} mincí.
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/12 text-destructive shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="border-none pt-2 mt-2 gap-2">
          <RpgButton variant="outline" onClick={onClose} disabled={loading} size="lg">
            Zrušit
          </RpgButton>
          <RpgButton
            variant="quest"
            glow
            size="lg"
            onClick={handleBuy}
            disabled={!canAfford || loading}
            loading={loading}
          >
            {loading ? "Nakupuji..." : "Koupit"}
          </RpgButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
