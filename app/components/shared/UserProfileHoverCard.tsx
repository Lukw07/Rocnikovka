"use client"

import { useEffect, useState } from "react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/app/components/ui/hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { ItemRarity } from "@/app/lib/generated"
import { cn } from "@/app/lib/utils"

interface UserProfileHoverCardProps {
  userId: string
  name: string
  children: React.ReactNode
  className?: string
}

interface UserProfile {
  id: string
  name: string
  role: string
  avatarUrl: string | null
  badges: {
    badge: {
      id: string
      name: string
      imageUrl: string
      rarity: ItemRarity
    }
  }[]
}

export function UserProfileHoverCard({ userId, name, children, className }: UserProfileHoverCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && !profile && !loading) {
      setLoading(true)
      fetch(`/api/user/${userId}/profile`)
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile)
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [open, userId, profile, loading])

  const rarityStyles = {
    [ItemRarity.COMMON]: "from-slate-300 via-slate-400 to-slate-500",
    [ItemRarity.UNCOMMON]: "from-emerald-400 via-emerald-500 to-teal-600",
    [ItemRarity.RARE]: "from-blue-400 via-blue-500 to-indigo-600",
    [ItemRarity.EPIC]: "from-purple-400 via-purple-500 to-fuchsia-600",
    [ItemRarity.LEGENDARY]: "from-yellow-300 via-amber-500 to-orange-600",
  }

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <div className={cn("cursor-pointer inline-block", className)}>
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0 overflow-hidden border-2 border-primary/20 shadow-xl">
        <div className="bg-linear-to-b from-primary/10 to-background p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-md">
              {profile?.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={name} />
              ) : (
                <AvatarFallback className="text-lg">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{name}</h4>
              {profile ? (
                <Badge variant="outline" className="text-xs">
                  {profile.role}
                </Badge>
              ) : (
                <Skeleton className="h-5 w-16" />
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-background">
          <h5 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Odznaky
          </h5>
          
          {loading ? (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ) : profile?.badges && profile.badges.length > 0 ? (
            <div className="flex gap-3">
              {profile.badges.map(({ badge }) => (
                <div key={badge.id} className="group relative">
                  <div className={cn(
                    "relative h-12 w-12 rounded-full p-[3px] transition-transform hover:scale-110 bg-linear-to-br",
                    rarityStyles[badge.rarity]
                  )}>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/25 border border-white/30 shadow-sm"></div>
                    <img 
                      src={badge.imageUrl} 
                      alt={badge.name} 
                      className="h-full w-full rounded-full object-cover border border-white/20 shadow-inner"
                    />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap pointer-events-none z-50">
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Žádné připnuté odznaky
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
