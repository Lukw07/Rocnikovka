"use client"

import { useState } from "react"
import { Badge as BadgeModel, ItemRarity } from "@/app/lib/generated"
import { Card, CardHeader } from "@/app/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Button } from "@/app/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { cn } from "@/app/lib/utils"
import { Pin, PinOff } from "lucide-react"
import { toast } from "sonner"

interface BadgeCardProps {
  badge: BadgeModel & { owned: boolean; isPinned?: boolean }
  onPinToggle?: () => void
}

export function BadgeCard({ badge, onPinToggle }: BadgeCardProps) {
  const [stats, setStats] = useState<{ percentage: number } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const fetchStats = async () => {
    if (stats || loadingStats) return
    setLoadingStats(true)
    try {
      const res = await fetch(`/api/badges/${badge.id}/stats`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
    }
  }

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/badges/${badge.id}/pin`, { method: 'POST' })
      if (res.ok) {
        toast.success(badge.isPinned ? "Odznak odepnut" : "Odznak připnut")
        window.dispatchEvent(new Event('badge-update'))
        onPinToggle?.()
      } else {
        toast.error("Chyba při změně stavu odznaku")
      }
    } catch (e) {
      toast.error("Chyba připojení")
    }
  }

  const rarityColors = {
    [ItemRarity.COMMON]: "border-slate-400 text-slate-500",
    [ItemRarity.UNCOMMON]: "border-green-500 text-green-600",
    [ItemRarity.RARE]: "border-blue-500 text-blue-600",
    [ItemRarity.EPIC]: "border-purple-500 text-purple-600",
    [ItemRarity.LEGENDARY]: "border-amber-500 text-amber-600",
  }

  const rarityBg = {
    [ItemRarity.COMMON]: "bg-slate-100",
    [ItemRarity.UNCOMMON]: "bg-green-50",
    [ItemRarity.RARE]: "bg-blue-50",
    [ItemRarity.EPIC]: "bg-purple-50",
    [ItemRarity.LEGENDARY]: "bg-amber-50",
  }

  return (
    <TooltipProvider>
      <Tooltip onOpenChange={(open) => open && fetchStats()}>
        <TooltipTrigger asChild>
          <Card className={cn(
            "relative flex flex-col items-center text-center h-full transition-all hover:shadow-md cursor-pointer group",
            !badge.owned && "opacity-60 grayscale"
          )}>
            {badge.owned && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={handlePin}
              >
                {badge.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            )}
            <CardHeader className="pb-2 pt-6 w-full flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className={cn("h-24 w-24 border-4 shadow-sm", rarityColors[badge.rarity])}>
                  <AvatarImage src={badge.imageUrl} alt={badge.name} />
                  <AvatarFallback>{badge.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-semibold text-lg leading-none">{badge.name}</h3>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-2", rarityBg[badge.rarity], rarityColors[badge.rarity])}>
                {badge.rarity}
              </span>
            </CardHeader>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-80 p-0 border-none bg-transparent shadow-none z-50">
          <div className="bg-[#0f1923] text-[#f0f0f0] border border-[#c8aa6e] p-4 rounded-sm shadow-xl relative">
             <div className="flex items-start gap-4">
                <Avatar className={cn("h-16 w-16 border-2", rarityColors[badge.rarity])}>
                  <AvatarImage src={badge.imageUrl} />
                  <AvatarFallback>{badge.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h4 className="text-[#f0e6d2] font-bold text-lg uppercase tracking-wider">{badge.name}</h4>
                    <p className="text-[#a09b8c] text-xs uppercase mb-2">{badge.category || "General"}</p>
                    <p className="text-[#c8aa6e] text-sm mb-3">{badge.description}</p>
                    
                    <div className="border-t border-[#3c3c41] pt-3 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[#a09b8c] text-xs uppercase">Vzácnost</span>
                            <span className={cn("text-xs font-bold", rarityColors[badge.rarity])}>{badge.rarity}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[#a09b8c] text-xs uppercase">Vlastní</span>
                            <span className="text-[#f0e6d2] text-xs font-bold">
                                {loadingStats ? "..." : stats ? `${stats.percentage.toFixed(1)}%` : "0%"}
                            </span>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
