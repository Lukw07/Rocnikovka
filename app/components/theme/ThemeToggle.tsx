"use client"

import { useTheme } from "@/app/hooks/use-theme"
import { Button } from "@/app/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <Sun className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 transition-transform hover:rotate-12" />
      ) : (
        <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
      )}
    </Button>
  )
}
