"use client"

import { useSidebar } from "@/app/components/ui/V2sidebar"
import { Button } from "@/app/components/ui/button"

export default function LogPanel() {
  const { setSelectedPanel } = useSidebar()

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Záznam</h2>
      <p className="text-muted-foreground mb-4">Toto je placeholder komponenta pro Záznam.</p>
      <Button onClick={() => setSelectedPanel('dashboard')}>Zpět na přehled</Button>
    </div>
  )
}
