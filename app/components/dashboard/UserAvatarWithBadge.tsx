"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { cn } from "@/app/lib/utils"
import { ItemRarity } from "@/app/lib/generated"

interface UserAvatarWithBadgeProps {
  name: string
  className?: string
  avatarUrl?: string | null
  badgeRarity?: ItemRarity | null
  level?: number
}

export function UserAvatarWithBadge({ name, className, avatarUrl: propAvatarUrl, badgeRarity, level }: UserAvatarWithBadgeProps) {
  const [badge, setBadge] = useState<{ imageUrl: string, rarity: ItemRarity } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(propAvatarUrl || null)

  useEffect(() => {
    if (propAvatarUrl !== undefined) {
      setAvatarUrl(propAvatarUrl)
      // If badgeRarity is provided (even if null), we don't need to fetch
      if (badgeRarity !== undefined) {
        return
      }
    }

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
          if (data.avatarUrl) {
            setAvatarUrl(data.avatarUrl)
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

  const rarityStyles = {
    [ItemRarity.COMMON]: {
      border: "border-slate-400",
      gradient: "from-slate-300 via-slate-400 to-slate-500",
      shadow: "shadow-slate-400/50",
      text: "text-slate-100"
    },
    [ItemRarity.UNCOMMON]: {
      border: "border-emerald-500",
      gradient: "from-emerald-400 via-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/50",
      text: "text-emerald-100"
    },
    [ItemRarity.RARE]: {
      border: "border-blue-500",
      gradient: "from-blue-400 via-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/50",
      text: "text-blue-100"
    },
    [ItemRarity.EPIC]: {
      border: "border-purple-500",
      gradient: "from-purple-400 via-purple-500 to-fuchsia-600",
      shadow: "shadow-purple-500/50",
      text: "text-purple-100"
    },
    [ItemRarity.LEGENDARY]: {
      border: "border-amber-500",
      gradient: "from-yellow-300 via-amber-500 to-orange-600",
      shadow: "shadow-amber-500/50",
      text: "text-amber-100"
    },
  }

  const currentRarity = badgeRarity !== undefined ? badgeRarity : badge?.rarity
  const style = currentRarity ? rarityStyles[currentRarity] : null

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Main Avatar Container */}
      <div className={cn(
        "relative rounded-full p-[3px]", // Padding for the gradient border
        style ? `bg-gradient-to-br ${style.gradient}` : ""
      )}>
        <Avatar className="h-full w-full border-2 border-white/10">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} />
          ) : (
            <AvatarFallback>{name[0]}</AvatarFallback>
          )}
        </Avatar>
      </div>

      {/* Decorative Overlay Frame (LoL Style) */}
      {style && (
        <>
          {/* Top Left Level Indicator (Diamond Shape) */}
          {level !== undefined && (
            <div className="absolute -top-1 -left-1 z-10">
              <div className={cn(
                "relative flex items-center justify-center w-6 h-6",
                "bg-gradient-to-br shadow-sm transform rotate-45 rounded-sm border border-white/20",
                style.gradient,
                style.shadow
              )}>
                <span className={cn(
                  "transform -rotate-45 text-[10px] font-bold leading-none",
                  style.text
                )}>
                  {level}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Center Gem/Decoration (Optional, adds to the look) */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-10">
             <div className={cn(
               "w-3 h-3 rotate-45 border border-white/20 shadow-sm",
               `bg-gradient-to-br ${style.gradient}`
             )} />
          </div>
        </>
      )}
    </div>
  )
}
