"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { TrendingUp, Zap, Coins, Gift, ShoppingBag } from "lucide-react"

interface Benefit {
  id: string
  name: string
  description: string
  benefitType: string
  value: number
  requiredLevel: number
  isActive: boolean
}

interface GuildBenefitsProps {
  guildId: string
  guildLevel: number
}

export function GuildBenefits({ guildId, guildLevel }: GuildBenefitsProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [allBenefits, setAllBenefits] = useState<Benefit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBenefits()
  }, [guildId])

  const fetchBenefits = async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/benefits`)
      const data = await res.json()
      
      // Filter active benefits
      const active = data.benefits?.filter((b: Benefit) => b.requiredLevel <= guildLevel) || []
      const all = data.benefits || []
      
      setBenefits(active)
      setAllBenefits(all)
    } catch (error) {
      console.error("Failed to fetch benefits:", error)
    } finally {
      setLoading(false)
    }
  }

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case "XP_BOOST":
        return <Zap className="h-5 w-5 text-yellow-500" />
      case "MONEY_BOOST":
        return <Coins className="h-5 w-5 text-amber-500" />
      case "QUEST_BONUS":
        return <Gift className="h-5 w-5 text-purple-500" />
      case "SHOP_DISCOUNT":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />
      default:
        return <TrendingUp className="h-5 w-5 text-green-500" />
    }
  }

  if (loading) {
    return <div className="text-center py-8">Načítání výhod...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guildové výhody</CardTitle>
        <CardDescription>
          Zvyšujte level guildy pro odemknutí nových bonusů
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Benefits */}
        <div>
          <h3 className="text-sm font-medium mb-3">Aktivní výhody</h3>
          <div className="space-y-2">
            {benefits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Zatím žádné aktivní výhody
              </p>
            ) : (
              benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-accent/50"
                >
                  {getBenefitIcon(benefit.benefitType)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{benefit.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        +{benefit.value}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Benefits */}
        <div>
          <h3 className="text-sm font-medium mb-3">Nadcházející výhody</h3>
          <div className="space-y-3">
            {allBenefits
              .filter((b) => b.requiredLevel > guildLevel)
              .sort((a, b) => a.requiredLevel - b.requiredLevel)
              .slice(0, 3)
              .map((benefit) => (
                <div
                  key={benefit.id}
                  className="p-3 rounded-lg border opacity-60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getBenefitIcon(benefit.benefitType)}
                      <span className="font-medium text-sm">{benefit.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Level {benefit.requiredLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {benefit.description}
                  </p>
                  <Progress 
                    value={(guildLevel / benefit.requiredLevel) * 100} 
                    className="h-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {benefit.requiredLevel - guildLevel} levelů do odemknutí
                  </p>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
