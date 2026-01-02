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

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar className="h-full w-full border border-transparent shadow-sm">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} />
        ) : (
          <AvatarFallback>{name[0]}</AvatarFallback>
        )}
      </Avatar>
    </div>
  )
}
