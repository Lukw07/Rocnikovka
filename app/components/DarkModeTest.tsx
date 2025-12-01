"use client"

import { useTheme } from "@/app/hooks/use-theme"

export function DarkModeTest() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-lg border-2 bg-card text-card-foreground shadow-xl">
      <div className="space-y-2">
        <div className="font-bold">Dark Mode Test</div>
        <div>HTML class: {document.documentElement.classList.contains('dark') ? '✅ .dark' : '❌ no .dark'}</div>
        <div>Theme state: {theme}</div>
        <div className="bg-background text-foreground p-2 rounded border">
          bg-background / text-foreground
        </div>
        <div className="bg-card text-card-foreground p-2 rounded border">
          bg-card / text-card-foreground
        </div>
        <div className="bg-muted text-muted-foreground p-2 rounded border">
          bg-muted / text-muted-foreground
        </div>
        <button
          onClick={toggleTheme}
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Toggle ({theme})
        </button>
      </div>
    </div>
  )
}
