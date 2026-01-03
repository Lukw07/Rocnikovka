"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"

interface VirtualAward {
  id: string
  name: string
  icon: string
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"
  earnedAt: string
}

const rarityColors: Record<string, string> = {
  COMMON: "bg-gray-500",
  UNCOMMON: "bg-green-500",
  RARE: "bg-blue-500",
  EPIC: "bg-purple-500",
  LEGENDARY: "bg-yellow-500",
}

/**
 * Showcase - zobrazí top 6 nejvzácnějších trofejí
 */
export function AwardsShowcase() {
  const [showcase, setShowcase] = useState<VirtualAward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const res = await fetch("/api/virtual-awards/showcase")
        if (!res.ok) throw new Error("Nepodařilo se načíst trofeje")
        const response = await res.json()
        setShowcase(response.showcase || [])
      } catch (error) {
        console.error("Failed to fetch showcase:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchShowcase()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (showcase.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🏆</div>
          <p className="text-sm text-muted-foreground">
            Zatím nemáš žádné trofeje
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span>🏆</span>
        <span>Top Trofeje</span>
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {showcase.map((award, index) => (
          <Card
            key={award.id}
            className={`relative overflow-hidden group hover:shadow-lg transition-all ${
              index === 0 ? "col-span-3 md:col-span-1" : ""
            }`}
          >
            {/* Rarity Glow */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity ${rarityColors[award.rarity]}`}
            ></div>

            <CardContent className="p-4 space-y-2">
              {/* Icon */}
              <div className="text-center">
                <div className={`text-${index === 0 ? "5xl" : "4xl"} mb-2`}>
                  {award.icon}
                </div>

                {/* Name */}
                <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                  {award.name}
                </h4>

                {/* Rarity Badge */}
                <div className="mt-2 flex justify-center">
                  <Badge
                    className={`${rarityColors[award.rarity]} text-white text-xs border-none`}
                  >
                    {award.rarity}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
