"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { useApi } from "@/app/hooks/use-api"
import { Zap } from "lucide-react"

interface PlayerAttributes {
  attributes: Array<{
    id: string
    skillId: string
    name: string
    description: string
    icon: string
    currentLevel: number
    maxLevel: number
  }>
  effects: {
    timeManagementBonus: number
    focusBonus: number
    leadershipBonus: number
    communicationBonus: number
    consistencyBonus: number
    totalEffectPower: number
  }
  attributeCount: number
  totalPower: number
}

interface CoreAttributesCardProps {
  userId?: string
}

/**
 * Compact attributes card for dashboard showing core attributes summary
 * Shows top attributes and active effect bonuses
 */
export function CoreAttributesCard({ userId }: CoreAttributesCardProps) {
  const [data, setData] = useState<PlayerAttributes | null>(null)
  const { loading, error } = useApi()

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await fetch("/api/progression/attributes/player")
        if (response.ok) {
          const result = await response.json()
          setData(result.data)
        }
      } catch (err) {
        console.error("Failed to load attributes:", err)
      }
    }

    fetchAttributes()
  }, [userId])

  if (loading) {
    return (
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950 to-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-100">
            <Zap className="w-5 h-5" />
            Core Attributes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950 to-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-100">
            <Zap className="w-5 h-5" />
            Core Attributes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No attributes data</p>
        </CardContent>
      </Card>
    )
  }

  // Get top 3 attributes by level
  const topAttributes = [...data.attributes]
    .sort((a, b) => b.currentLevel - a.currentLevel)
    .slice(0, 3)

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950 to-purple-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-100">
          <Zap className="w-5 h-5" />
          Core Attributes
        </CardTitle>
        <CardDescription className="text-purple-300">
          <span className="font-semibold text-yellow-400">{Math.round(data.totalPower)}</span>
          <span> effect power / 100</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top attributes */}
        <div className="space-y-3">
          {topAttributes.map((attr) => (
            <div key={attr.id} className="flex items-center justify-between p-2 bg-purple-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">{attr.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-purple-100">{attr.name}</p>
                  <p className="text-xs text-purple-300">
                    Level {attr.currentLevel}/{attr.maxLevel}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400 font-semibold">
                  +{((attr.currentLevel / attr.maxLevel) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick effects display */}
        <div className="text-xs space-y-1 pt-2 border-t border-purple-800">
          <div className="flex justify-between text-purple-300">
            <span>⏰ XP Gain:</span>
            <span className="text-green-400 font-semibold">
              +{((data.effects.timeManagementBonus - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-purple-300">
            <span>👑 Job Rewards:</span>
            <span className="text-green-400 font-semibold">
              +{((data.effects.leadershipBonus - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-purple-300">
            <span>💬 Reputation:</span>
            <span className="text-green-400 font-semibold">
              +{((data.effects.communicationBonus - 1) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Link to full view */}
        <div className="text-center pt-2">
          <a
            href="/dashboard/attributes"
            className="text-xs text-purple-300 hover:text-purple-100 transition-colors"
          >
            View all attributes →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
