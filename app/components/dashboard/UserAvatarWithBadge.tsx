"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { cn } from "@/app/lib/utils"
import { ItemRarity } from "@/app/lib/generated"

interface UserAvatarWithBadgeProps {
  name: string
  className?: string
}

export function UserAvatarWithBadge({ name, className }: UserAvatarWithBadgeProps) {
  const [badge, setBadge] = useState<{ imageUrl: string, rarity: ItemRarity } | null>(null)

  useEffect(() => {
    const fetchPinnedBadge = async () => {
      try {
        const res = await fetch('/api/badges/pinned')
        if (res.ok) {
          const data = await res.json()
          if (data.badge) {
            setBadge(data.badge)
          } else {
            setBadge(null)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    // Listen for badge updates
    window.addEventListener('badge-update', fetchPinnedBadge)
    fetchPinnedBadge()
    
    return () => window.removeEventListener('badge-update', fetchPinnedBadge)
  }, [])

  const rarityColors = {
    [ItemRarity.COMMON]: "border-slate-400",
    [ItemRarity.UNCOMMON]: "border-green-500",
    [ItemRarity.RARE]: "border-blue-500",
    [ItemRarity.EPIC]: "border-purple-500",
    [ItemRarity.LEGENDARY]: "border-amber-500",
  }

  return (
    <div className="relative inline-block">
      <Avatar className={cn("border-2 transition-all", badge ? rarityColors[badge.rarity] : "border-transparent", className)}>
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      {badge && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-background bg-background overflow-hidden shadow-sm" title="Pinned Badge">
            <img src={badge.imageUrl} alt="Badge" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}
