"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Save } from "lucide-react"

interface SystemStats {
  systemHealth: {
    lastBackup: string
  }
}

export function BackupsPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const triggerBackup = async () => {
    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST"
      })
      
      if (response.ok) {
        console.log("Backup triggered successfully")
        // Refresh stats
        const statsResponse = await fetch("/api/admin/stats")
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStats(data)
        }
      }
    } catch (error) {
      console.error("Error triggering backup:", error)
    }
  }

  if (loading) {
    return <div>Načítání...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Zálohy a Obnova</h2>
      <Card>
        <CardHeader>
          <CardTitle>Správa záloh</CardTitle>
          <CardDescription>
            Historie a správa databázových záloh
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Poslední záloha</h3>
              <p className="text-sm text-muted-foreground">
                {stats?.systemHealth.lastBackup || "Nikdy"}
              </p>
            </div>
            <Button onClick={triggerBackup}>
              <Save className="w-4 h-4 mr-2" />
              Vytvořit novou zálohu
            </Button>
          </div>
          {/* Backup list would go here */}
        </CardContent>
      </Card>
    </div>
  )
}
