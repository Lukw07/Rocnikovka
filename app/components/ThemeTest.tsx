"use client"

import { useTheme } from "@/app/hooks/use-theme"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Sun, Moon } from "lucide-react"

export function ThemeTest() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <div className="p-4">
        <div className="animate-pulse bg-muted h-32 rounded"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Theme Test - {theme === "dark" ? "Tmavý" : "Světlý"} režim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background border rounded">
              <p className="text-foreground">bg-background / text-foreground</p>
            </div>
            <div className="p-3 bg-card border rounded">
              <p className="text-card-foreground">bg-card / text-card-foreground</p>
            </div>
            <div className="p-3 bg-muted border rounded">
              <p className="text-muted-foreground">bg-muted / text-muted-foreground</p>
            </div>
            <div className="p-3 bg-secondary border rounded">
              <p className="text-secondary-foreground">bg-secondary / text-secondary-foreground</p>
            </div>
          </div>
          
          <Button onClick={toggleTheme} className="w-full">
            {theme === "dark" ? "Přepnout na světlý" : "Přepnout na tmavý"} režim
          </Button>
          
          <div className="text-sm text-muted-foreground">
            HTML má třídu .dark: {document.documentElement.classList.contains('dark') ? 'Ano' : 'Ne'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}