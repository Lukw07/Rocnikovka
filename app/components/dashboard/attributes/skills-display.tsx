"use client"

import React, { useEffect, useState } from "react"
import { AttributeProgressBar, AttributeProgress } from "./attribute-progress-bar"
import { useApi } from "@/app/hooks/use-api"

interface PlayerAttributes {
  attributes: Array<{
    id: string
    skillId: string
    name: string
    description: string
    icon: string
    currentLevel: number
    maxLevel: number
    experience: number
    points: number
    unlockLevel: number
    lastLeveledAt: string | null
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

interface SkillsDisplayProps {
  userId?: string
  className?: string
}

/**
 * Displays all player's core attributes with levels, bonuses, and effects
 */
export function SkillsDisplay({ userId, className = "" }: SkillsDisplayProps) {
  const [data, setData] = useState<PlayerAttributes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/progression/attributes/player")
        if (response.ok) {
          const result = await response.json()
          setData(result.data)
          setError(null)
        } else {
          setError("Failed to load attributes")
        }
      } catch (err) {
        setError("Failed to load attributes")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAttributes()
  }, [userId])

  if (loading) {
    return <div className={`text-center py-8 ${className}`}>Loading attributes...</div>
  }

  if (error) {
    return <div className={`text-red-500 py-8 ${className}`}>{error}</div>
  }

  if (!data) {
    return <div className={`text-muted-foreground py-8 ${className}`}>No attributes data</div>
  }

  // Format bonus effects as percentages
  const effectTexts: Record<string, string> = {
    "Time Management": `+${((data.effects.timeManagementBonus - 1) * 100).toFixed(1)}% XP gain`,
    "Focus": `+${((data.effects.focusBonus - 1) * 100).toFixed(1)}% skill speed`,
    "Leadership": `+${((data.effects.leadershipBonus - 1) * 100).toFixed(1)}% job rewards`,
    "Communication": `+${((data.effects.communicationBonus - 1) * 100).toFixed(1)}% reputation`,
    "Consistency": `+${((data.effects.consistencyBonus - 1) * 100).toFixed(1)}% streak bonus`,
  }

  const attributeDisplays: AttributeProgress[] = data.attributes.map(attr => ({
    name: attr.name,
    icon: attr.icon,
    currentLevel: attr.currentLevel,
    maxLevel: attr.maxLevel,
    description: attr.description,
    bonus: effectTexts[attr.name]
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall power indicator */}
      <div className="bg-linear-to-r from-purple-900 to-blue-900 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Core Attributes</h2>
            <p className="text-gray-300">Master these skills to unlock system-wide bonuses</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-yellow-400">
              {Math.round(data.totalPower)}/100
            </div>
            <p className="text-sm text-gray-300">Total Effect Power</p>
          </div>
        </div>
      </div>

      {/* Attributes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributeDisplays.map((attr) => (
          <div
            key={attr.name}
            className="bg-card border border-border rounded-lg p-4"
          >
            <AttributeProgressBar
              attribute={attr}
              showDetails={true}
            />
          </div>
        ))}
      </div>

      {/* Active effects summary */}
      <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-200 mb-3">Active Effects</h3>
        <ul className="space-y-2 text-sm text-blue-100">
          <li>⏰ Time Management: {effectTexts["Time Management"]}</li>
          <li>🎯 Focus: {effectTexts["Focus"]}</li>
          <li>👑 Leadership: {effectTexts["Leadership"]}</li>
          <li>💬 Communication: {effectTexts["Communication"]}</li>
          <li>🔄 Consistency: {effectTexts["Consistency"]}</li>
        </ul>
      </div>

      {/* Tips */}
      <div className="bg-amber-950 border border-amber-800 rounded-lg p-4">
        <h3 className="font-semibold text-amber-200 mb-2">💡 Tips</h3>
        <ul className="text-sm text-amber-100 space-y-1">
          <li>• Increase Time Management to earn more XP from every activity</li>
          <li>• Focus improves how quickly you learn new skills</li>
          <li>• Leadership magnifies job and quest rewards</li>
          <li>• Communication helps you gain reputation faster</li>
          <li>• Consistency gives you bigger streak bonuses</li>
        </ul>
      </div>
    </div>
  )
}
