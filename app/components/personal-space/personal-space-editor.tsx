"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { toast } from "sonner"
import { Home, Settings, Trash2, Plus } from "lucide-react"

interface Furniture {
  id: string
  name: string
  type: string
  positionX: number
  positionY: number
  rotation: number
}

interface PersonalSpace {
  id: string
  userId: string
  theme: string
  layout: string | null
  furniture: Furniture[]
}

const themes = [
  { id: "default", name: "Výchozí", icon: "🏠", color: "bg-blue-100" },
  { id: "dark", name: "Temná", icon: "🌙", color: "bg-gray-800" },
  { id: "forest", name: "Les", icon: "🌲", color: "bg-green-100" },
  { id: "ocean", name: "Oceán", icon: "🌊", color: "bg-cyan-100" },
  { id: "space", name: "Vesmír", icon: "🚀", color: "bg-purple-900" },
  { id: "castle", name: "Hrad", icon: "🏰", color: "bg-stone-200" },
  { id: "cyberpunk", name: "Cyberpunk", icon: "🌃", color: "bg-pink-900" },
  { id: "fantasy", name: "Fantasy", icon: "✨", color: "bg-purple-200" },
]

const availableFurniture = [
  { id: "desk", name: "Stůl", icon: "🪑" },
  { id: "chair", name: "Židle", icon: "💺" },
  { id: "bookshelf", name: "Knihovna", icon: "📚" },
  { id: "plant", name: "Rostlina", icon: "🪴" },
  { id: "lamp", name: "Lampa", icon: "💡" },
  { id: "painting", name: "Obraz", icon: "🖼️" },
  { id: "trophy", name: "Trofej", icon: "🏆" },
  { id: "rug", name: "Koberec", icon: "🧶" },
  { id: "window", name: "Okno", icon: "🪟" },
  { id: "clock", name: "Hodiny", icon: "🕰️" },
]

export function PersonalSpaceEditor() {
  
  const [space, setSpace] = useState<PersonalSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<Furniture | null>(null)
  const [showFurnitureMenu, setShowFurnitureMenu] = useState(false)

  useEffect(() => {
    fetchSpace()
  }, [])

  const fetchSpace = async () => {
    try {
      const res = await fetch("/api/personal-space")
      if (!res.ok) throw new Error("Failed to load space")
      const response = await res.json()
      setSpace(response.space)
    } catch (error) {
      console.error("Failed to fetch space:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = async (newTheme: string) => {
    try {
      const res = await fetch("/api/personal-space", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme })
      })
      if (!res.ok) throw new Error("Nepodařilo se změnit theme")
      setSpace((prev) => (prev ? { ...prev, theme: newTheme } : null))
      toast.success(`Tvůj prostor má nyní theme: ${newTheme}`)
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se změnit theme")
    }
  }

  const handleAddFurniture = async (furnitureType: string) => {
    try {
      const furnitureData = availableFurniture.find((f) => f.id === furnitureType)
      if (!furnitureData) return

      const res = await fetch("/api/personal-space/furniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        name: furnitureData.name,
        type: furnitureType,
        positionX: 50 + Math.random() * 100,
        positionY: 50 + Math.random() * 100,
        rotation: 0,
        })
      })

      if (!res.ok) throw new Error("Nepodařilo se přidat nábytek")
      const response = await res.json()

      setSpace((prev) =>
        prev
          ? {
              ...prev,
              furniture: [...prev.furniture, response.furniture],
            }
          : null
      )

      toast.success(`${furnitureData.name} byl přidán do tvého prostoru.`)

      setShowFurnitureMenu(false)
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se přidat nábytek")
    }
  }

  const handleDragStart = (furniture: Furniture, e: React.MouseEvent) => {
    setDragging(furniture)
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!dragging || !space) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setSpace({
      ...space,
      furniture: space.furniture.map((f) =>
        f.id === dragging.id
          ? { ...f, positionX: Math.max(0, Math.min(100, x)), positionY: Math.max(0, Math.min(100, y)) }
          : f
      ),
    })
  }

  const handleDragEnd = async () => {
    if (!dragging) return

    const furniture = space?.furniture.find((f) => f.id === dragging.id)
    if (!furniture) return

    try {
      await fetch(`/api/personal-space/furniture/${furniture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionX: furniture.positionX,
          positionY: furniture.positionY,
        })
      })
    } catch (error) {
      console.error("Failed to update furniture position:", error)
    }

    setDragging(null)
  }

  const handleRemoveFurniture = async (furnitureId: string) => {
    if (!confirm("Opravdu chceš odstranit tento nábytek?")) return

    try {
      const res = await fetch(`/api/personal-space/furniture/${furnitureId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Nepodařilo se odstranit nábytek")

      setSpace((prev) =>
        prev
          ? {
              ...prev,
              furniture: prev.furniture.filter((f) => f.id !== furnitureId),
            }
          : null
      )

      toast.success("Nábytek odstraněn!")
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se odstranit nábytek")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!space) {
    return <div>Nepodařilo se načíst prostor</div>
  }

  const currentTheme = themes.find((t) => t.id === space.theme) ?? themes[0]!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Home className="h-8 w-8 text-primary" />
          Osobní Prostor
        </h2>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {currentTheme.icon} {currentTheme.name}
        </Badge>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                <Settings className="inline h-4 w-4 mr-1" />
                Theme Prostoru
              </label>
              <Select value={space.theme} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.icon} {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Furniture Button */}
            <div>
              <label className="text-sm font-medium mb-2 block">Přidat Nábytek</label>
              <Button onClick={() => setShowFurnitureMenu(!showFurnitureMenu)}>
                <Plus className="h-4 w-4 mr-2" />
                Přidat
              </Button>
            </div>
          </div>

          {/* Furniture Menu */}
          {showFurnitureMenu && (
            <div className="mt-4 p-4 border rounded-lg bg-muted">
              <div className="grid grid-cols-5 gap-2">
                {availableFurniture.map((furniture) => (
                  <button
                    key={furniture.id}
                    onClick={() => handleAddFurniture(furniture.id)}
                    className="p-3 rounded-lg bg-background hover:bg-accent transition text-center"
                  >
                    <div className="text-3xl mb-1">{furniture.icon}</div>
                    <div className="text-xs">{furniture.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Canvas */}
      <Card>
        <CardContent className="p-0">
          <div
            className={`relative w-full aspect-video ${currentTheme.color} rounded-lg overflow-hidden cursor-move`}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0,0,0,0.1) 49px, rgba(0,0,0,0.1) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(0,0,0,0.1) 49px, rgba(0,0,0,0.1) 50px)'
              }}></div>
            </div>

            {/* Furniture */}
            {space.furniture.map((furniture) => {
              const furnitureData = availableFurniture.find((f) => f.id === furniture.type)
              return (
                <div
                  key={furniture.id}
                  className="absolute group cursor-move"
                  style={{
                    left: `${furniture.positionX}%`,
                    top: `${furniture.positionY}%`,
                    transform: `translate(-50%, -50%) rotate(${furniture.rotation}deg)`,
                  }}
                  onMouseDown={(e) => handleDragStart(furniture, e)}
                >
                  <div className="relative">
                    <div className="text-5xl select-none">{furnitureData?.icon || "❓"}</div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFurniture(furniture.id)
                      }}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-xs text-center mt-1 bg-black/50 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {furniture.name}
                  </div>
                </div>
              )
            })}

            {/* Empty State */}
            {space.furniture.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2 text-black/50">
                  <div className="text-6xl">{currentTheme.icon}</div>
                  <p className="text-lg font-semibold">Tvůj prostor je prázdný</p>
                  <p className="text-sm">Přidej nábytek a dekorace!</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="text-sm text-muted-foreground">
        💡 <strong>Tip:</strong> Klikni a táhni nábytek pro změnu pozice. Použij tlačítko "Přidat" pro nový nábytek.
      </div>
    </div>
  )
}
