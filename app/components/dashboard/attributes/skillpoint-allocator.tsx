"use client"

import React, { useEffect, useState } from "react"
import { useApi } from "@/app/hooks/use-api"
import { Button } from "@/app/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"

interface Skill {
  id: string
  name: string
  description: string
  icon: string
  maxLevel: number
  unlockLevel: number
  isActive: boolean
}

interface SkillPointAllocatorProps {
  onSkillPurchased?: (skillId: string, skillName: string, newLevel: number) => void
  className?: string
}

/**
 * UI component for allocating skillpoints to attributes
 * Shows available skillpoints and allows player to purchase skill levels
 */
export function SkillPointAllocator({
  onSkillPurchased,
  className = ""
}: SkillPointAllocatorProps) {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [playerSkills, setPlayerSkills] = useState<Record<string, any>>({})
  const [skillpoints, setSkillpoints] = useState({
    available: 0,
    spent: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [allocating, setAllocating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch all core attributes
        const skillsRes = await fetch("/api/progression/attributes")
        if (skillsRes.ok) {
          const data = await skillsRes.json()
          setAllSkills(data.attributes)
        }
        
        // Fetch player's attribute data
        const playerRes = await fetch("/api/progression/attributes/player")
        if (playerRes.ok) {
          const data = await playerRes.json()
          setSkillpoints(data.skillPoints)
          
          // Map player skills
          const skillMap: Record<string, any> = {}
          data.attributes.forEach((attr: any) => {
            skillMap[attr.skillId] = attr
          })
          setPlayerSkills(skillMap)
        }
      } catch (error) {
        console.error("Failed to load skillpoint allocator data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAllocateSkill = async () => {
    if (!selectedSkill || skillpoints.available <= 0) return
    
    try {
      setAllocating(true)
      const response = await fetch("/api/progression/skillpoints/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: selectedSkill.id,
          points: 1
        })
      })
      
      if (response.ok) {
        // Update skillpoints
        setSkillpoints(prev => ({
          ...prev,
          available: prev.available - 1,
          spent: prev.spent + 1
        }))
        
        // Update player skill
        const playerSkill = playerSkills[selectedSkill.id]
        const newLevel = (playerSkill?.currentLevel || 0) + 1
        setPlayerSkills(prev => ({
          ...prev,
          [selectedSkill.id]: {
          ...(prev[selectedSkill.id] || {}),
          currentLevel: newLevel
        }
      }))
      
      onSkillPurchased?.(selectedSkill.id, selectedSkill.name, newLevel)
      setShowDialog(false)
    } else {
      const error = await response.json()
      alert(error.error || "Failed to allocate skillpoint")
    }
    } catch (error) {
      console.error("Failed to allocate skillpoint:", error)
      alert("Failed to allocate skillpoint")
    } finally {
      setAllocating(false)
    }
  }

  if (loading) {
    return <div className={`text-center py-8 ${className}`}>Loading...</div>
  }

  const canAllocate = skillpoints.available > 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Skillpoints summary */}
      <div className="bg-linear-to-r from-green-900 to-emerald-900 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-100 mb-4">Skillpoints Pool</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-white">{skillpoints.available}</div>
            <p className="text-sm text-green-200">Available</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-400">{skillpoints.spent}</div>
            <p className="text-sm text-green-200">Spent</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">{skillpoints.total}</div>
            <p className="text-sm text-green-200">Total Earned</p>
          </div>
        </div>
      </div>

      {/* Core Attributes to allocate */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Core Attributes</h3>
        {allSkills.length === 0 ? (
          <p className="text-muted-foreground">No attributes available yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allSkills.map((skill) => {
              const playerSkill = playerSkills[skill.id]
              const level = playerSkill?.currentLevel || 0
              const canLevel = level < skill.maxLevel
              
              return (
                <div
                  key={skill.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{skill.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{skill.name}</h4>
                        <p className="text-xs text-muted-foreground">{skill.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">Lvl {level}</div>
                      <div className="text-xs text-muted-foreground">/{skill.maxLevel}</div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedSkill(skill)
                      setShowDialog(true)
                    }}
                    disabled={!canAllocate || !canLevel}
                    className="w-full"
                    variant={canAllocate && canLevel ? "default" : "secondary"}
                  >
                    {level >= skill.maxLevel ? "Maxed Out" : "Allocate Point"}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Skillpoint</DialogTitle>
            <DialogDescription>
              Spend 1 skillpoint on {selectedSkill?.name}?
            </DialogDescription>
          </DialogHeader>
          
          {selectedSkill && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">{selectedSkill.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedSkill.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedSkill.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-3 bg-blue-950/20">
                <p className="text-sm text-blue-200">
                  Current Level: <span className="font-semibold">{playerSkills[selectedSkill.id]?.currentLevel || 0}/{selectedSkill.maxLevel}</span>
                </p>
                <p className="text-sm text-blue-200">
                  After Allocation: <span className="font-semibold text-green-400">{(playerSkills[selectedSkill.id]?.currentLevel || 0) + 1}/{selectedSkill.maxLevel}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDialog(false)}
                  disabled={allocating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAllocateSkill}
                  disabled={allocating || !canAllocate}
                >
                  {allocating ? "Allocating..." : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
