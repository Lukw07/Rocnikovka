"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { toast } from "sonner"
import { Check, User } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface AvatarItem {
  id: string
  name: string
  imageUrl: string
}

export function AvatarSelector() {
  const [avatars, setAvatars] = useState<AvatarItem[]>([])
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch user profile to get current avatar
      // We can use a simple endpoint or assume we have it in session, but let's fetch fresh
      // Actually, let's fetch purchased items first
      const shopRes = await fetch("/api/shop?purchased=true")
      const shopData = await shopRes.json()
      
      // Filter for cosmetic items with images (avatars)
      const purchasedAvatars = (shopData.userPurchases || [])
        .map((p: any) => p.item)
        .filter((item: any) => item.type === "COSMETIC" && item.imageUrl)

      setAvatars(purchasedAvatars)

      // Get current user info for current avatar
      // We might need a dedicated endpoint or parse it from somewhere.
      // Let's assume we can get it from /api/user/me or similar, or just use the one from session if available.
      // For now, let's try to fetch profile of current user.
      // Since we don't have userId easily here without session prop, let's assume we can get it via a new endpoint /api/user/me/avatar
      // Or just use the profile endpoint if we knew the ID.
      // Let's create a simple endpoint to get current user's avatar url.
      
      const meRes = await fetch("/api/user/me/avatar")
      if (meRes.ok) {
        const meData = await meRes.json()
        setCurrentAvatar(meData.avatarUrl)
      }

    } catch (error) {
      console.error("Error fetching avatars:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEquip = async (itemId: string, imageUrl: string) => {
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      })

      if (!res.ok) throw new Error("Failed to equip avatar")

      setCurrentAvatar(imageUrl)
      toast.success("Profilový obrázek změněn")
      // Force refresh of other components if needed
      window.location.reload() 
    } catch (error) {
      toast.error("Chyba při změně obrázku")
    }
  }

  if (loading) return <div>Načítání avatarů...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profilový obrázek
        </CardTitle>
        <CardDescription>
          Vyberte si profilový obrázek z vašich zakoupených předmětů.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Default Avatar Option (if we want to allow resetting) */}
          
          {avatars.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-4">
              Nemáte žádné zakoupené profilové obrázky. Navštivte obchod!
            </div>
          )}

          {avatars.map((avatar) => (
            <div 
              key={avatar.id}
              className={cn(
                "relative group cursor-pointer rounded-lg border-2 p-2 transition-all hover:border-primary/50",
                currentAvatar === avatar.imageUrl ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"
              )}
              onClick={() => handleEquip(avatar.id, avatar.imageUrl)}
            >
              <div className="aspect-square relative mb-2">
                <Avatar className="h-full w-full">
                  <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
                  <AvatarFallback>{avatar.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-xs font-medium text-center truncate">
                {avatar.name}
              </div>
              {currentAvatar === avatar.imageUrl && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
