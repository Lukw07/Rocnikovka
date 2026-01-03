"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Trophy, Award, Star } from "lucide-react"

interface VirtualAward {
  id: string
  name: string
  icon: string
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"
  earnedAt: string
}

interface AwardsData {
  all: VirtualAward[]
  grouped: Record<string, VirtualAward[]>
  total: number
}

const rarityColors: Record<string, string> = {
  COMMON: "bg-gray-500",
  UNCOMMON: "bg-green-500",
  RARE: "bg-blue-500",
  EPIC: "bg-purple-500",
  LEGENDARY: "bg-yellow-500",
}

const rarityLabels: Record<string, string> = {
  COMMON: "Běžný",
  UNCOMMON: "Neobvyklý",
  RARE: "Vzácný",
  EPIC: "Epický",
  LEGENDARY: "Legendární",
}

export function VirtualAwardsGallery({ userId }: { userId?: string }) {
  const [awards, setAwards] = useState<AwardsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const url = userId
          ? `/api/virtual-awards?userId=${userId}`
          : "/api/virtual-awards"

        const res = await fetch(url)
        if (!res.ok) throw new Error("Nepodařilo se načíst trofeje")
        const response = await res.json()
        setAwards(response.awards)
      } catch (error) {
        console.error("Failed to fetch awards:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAwards()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!awards || awards.total === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="text-6xl">🏆</div>
          <h3 className="text-xl font-semibold">Žádné trofeje</h3>
          <p className="text-muted-foreground">
            Zatím nemáš žádné virtuální trofeje. Získej je za významné milníky!
          </p>
        </div>
      </Card>
    )
  }

  const displayAwards =
    filter === "all" ? awards.all : awards.grouped[filter] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          Virtuální Trofeje
        </h2>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold">{awards.total}</span>
        </div>
      </div>

      {/* Rarity Stats */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(rarityLabels).map(([key, label]) => {
          const count = awards.grouped[key]?.length || 0
          return (
            <div
              key={key}
              className="text-center p-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition"
              onClick={() => setFilter(key)}
            >
              <div className={`text-2xl font-bold ${filter === key ? "scale-110" : ""}`}>
                {count}
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "all" ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Všechny
        </button>
        {Object.entries(rarityLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              filter === key ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${rarityColors[key]}`}></div>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Awards Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {displayAwards.map((award) => (
          <Card
            key={award.id}
            className="hover:shadow-lg transition-shadow group relative overflow-hidden"
          >
            {/* Rarity Glow Effect */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${rarityColors[award.rarity]}`}
            ></div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{award.icon}</div>
                <Badge
                  className={`${rarityColors[award.rarity]} text-white border-none`}
                >
                  {rarityLabels[award.rarity]}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              <h3 className="font-bold text-lg leading-tight">{award.name}</h3>
              <div className="text-xs text-muted-foreground">
                Získáno: {new Date(award.earnedAt).toLocaleDateString("cs-CZ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayAwards.length === 0 && filter !== "all" && (
        <div className="text-center py-8 text-muted-foreground">
          Žádné trofeje v této kategorii
        </div>
      )}
    </div>
  )
}
