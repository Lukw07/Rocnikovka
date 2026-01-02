"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import { useTheme, useCustomColors } from "@/app/hooks/use-theme"
import { useSidebar } from "@/app/components/ui/Sidebar"
import { 
  Settings, 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  ArrowLeft,
  RotateCcw,
  Calendar,
  User
} from "lucide-react"
import { AvatarSelector } from "./AvatarSelector"

const PRESET_COLORS = [
  { name: "Modrá", value: "#3b82f6" },
  { name: "Fialová", value: "#8b5cf6" },
  { name: "Zelená", value: "#10b981" },
  { name: "Červená", value: "#ef4444" },
  { name: "Oranžová", value: "#f97316" },
  { name: "Růžová", value: "#ec4899" },
]

export function SettingsPanel() {
  const { setSelectedPanel } = useSidebar()
  const { theme, toggleTheme, mounted } = useTheme()
  const {
    primaryColor,
    updatePrimaryColor,
    resetColors,
    useSeasonal,
    toggleSeasonal,
    mounted: colorsLoaded
  } = useCustomColors()

  if (!mounted || !colorsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full h-full p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Nastavení
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Přizpůsobte si vzhled aplikace
              </p>
            </div>
            <Button 
              onClick={() => setSelectedPanel('dashboard')}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zpět na dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Vzhled
              </CardTitle>
              <CardDescription>
                Nastavte světlý nebo tmavý režim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-toggle" className="text-base font-medium">
                    Tmavý režim
                  </Label>
                  <Switch
                    id="theme-toggle"
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
                
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Aktuální režim: {theme === "dark" ? "Tmavý" : "Světlý"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="seasonal-toggle" className="text-base font-medium">
                      Sezónní barvy
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Používat barvy podle ročního období na hlavní stránce
                    </p>
                  </div>
                  <Switch
                    id="seasonal-toggle"
                    checked={useSeasonal}
                    onCheckedChange={toggleSeasonal}
                  />
                </div>
                
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {useSeasonal ? "Sezónní barvy jsou zapnuty" : "Používají se vlastní barvy"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Náhled</h4>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="space-y-2">
                    <div className="h-3 bg-primary/20 rounded"></div>
                    <div className="h-2 bg-muted rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Barvy
              </CardTitle>
              <CardDescription>
                Přizpůsobte si barevné schéma aplikace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Color Display */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-white/20 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                <div>
                  <p className="font-medium">Primární barva</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {primaryColor.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Přednastavené barvy</h4>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updatePrimaryColor(preset.value)}
                      className="group relative aspect-square rounded-lg border-2 border-transparent hover:border-white/40 transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    >
                      {primaryColor === preset.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Input */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Vlastní barva</h4>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => updatePrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded border border-input bg-background cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => updatePrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={resetColors}
                  className="gap-2 w-full"
                >
                  <RotateCcw className="h-4 w-4" />
                  Obnovit výchozí barvy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Settings */}
          <AvatarSelector />
        </div>
      </div>
    </div>
  )
}