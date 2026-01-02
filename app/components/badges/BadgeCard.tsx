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
import { AssignBadgeToClassDialog } from "./AssignBadgeToClassDialog"

interface BadgeCardProps {
  badge: BadgeModel & { owned: boolean; isPinned?: boolean }
  onPinToggle?: () => void
  isOperator?: boolean
}

export function BadgeCard({ badge, onPinToggle, isOperator }: BadgeCardProps) {
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

  const rarityStyles = {
    [ItemRarity.COMMON]: {
      chipBg: "bg-slate-100",
      chipText: "text-slate-500",
      frame: "from-slate-300 via-slate-400 to-slate-500",
      frameBorder: "border-slate-400",
    },
    [ItemRarity.UNCOMMON]: {
      chipBg: "bg-green-50",
      chipText: "text-green-600",
      frame: "from-emerald-400 via-emerald-500 to-teal-600",
      frameBorder: "border-emerald-500",
    },
    [ItemRarity.RARE]: {
      chipBg: "bg-blue-50",
      chipText: "text-blue-600",
      frame: "from-blue-400 via-blue-500 to-indigo-600",
      frameBorder: "border-blue-500",
    },
    [ItemRarity.EPIC]: {
      chipBg: "bg-purple-50",
      chipText: "text-purple-600",
      frame: "from-purple-400 via-purple-500 to-fuchsia-600",
      frameBorder: "border-purple-500",
    },
    [ItemRarity.LEGENDARY]: {
      chipBg: "bg-amber-50",
      chipText: "text-amber-600",
      frame: "from-yellow-300 via-amber-500 to-orange-600",
      frameBorder: "border-amber-500",
    },
  }

  const style = rarityStyles[badge.rarity]

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
                className={cn(
                  "absolute top-2 right-2 h-6 w-6 transition-opacity z-10",
                  badge.isPinned ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={handlePin}
              >
                {badge.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            )}
            <CardHeader className="pb-2 pt-6 w-full flex flex-col items-center">
              <div className="relative mb-4">
                <div className={cn(
                  "relative rounded-full p-[4px] shadow-md",
                  "bg-gradient-to-br",
                  style.frame
                )}>
                  <Avatar className="h-24 w-24 border-2 border-white/20 shadow-inner">
                    <AvatarImage src={badge.imageUrl} alt={badge.name} />
                    <AvatarFallback>{badge.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border border-white/30 bg-white/20 shadow-sm"></div>
                </div>
              </div>
              <h3 className="font-semibold text-lg leading-none">{badge.name}</h3>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-2", style.chipBg, style.chipText)}>
                {badge.rarity}
              </span>
              {isOperator && (
                <div onClick={(e) => e.stopPropagation()} className="w-full mt-2 z-20 relative">
                  <AssignBadgeToClassDialog badge={badge} />
                </div>
              )}
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
