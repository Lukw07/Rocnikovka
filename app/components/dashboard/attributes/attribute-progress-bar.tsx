"use client"

import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"

export interface AttributeProgress {
  name: string
  icon: string
  currentLevel: number
  maxLevel: number
  description: string
  bonus?: string // Display the bonus effect (e.g., "+4% XP gain")
}

interface AttributeProgressBarProps {
  attribute: AttributeProgress
  showDetails?: boolean
  onClick?: () => void
}

/**
 * Displays a single core attribute with progress bar and effects
 * Shows current level, max level, and the bonus effect
 */
export function AttributeProgressBar({
  attribute,
  showDetails = true,
  onClick
}: AttributeProgressBarProps) {
  const progressPercentage = (attribute.currentLevel / attribute.maxLevel) * 100
  const isMaxed = attribute.currentLevel >= attribute.maxLevel

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="cursor-pointer transition-all hover:scale-105"
            onClick={onClick}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{attribute.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {attribute.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {attribute.currentLevel}/{attribute.maxLevel}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isMaxed
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                {/* Bonus display */}
                {attribute.bonus && showDetails && (
                  <p className="text-xs text-green-600 mt-1">{attribute.bonus}</p>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{attribute.name}</p>
            <p className="text-sm text-gray-200">{attribute.description}</p>
            {attribute.bonus && (
              <div className="text-sm bg-green-950 text-green-200 p-2 rounded">
                Effect: {attribute.bonus}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
