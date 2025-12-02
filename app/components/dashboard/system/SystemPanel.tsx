"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Server, Settings, RefreshCw, Save, Shield } from "lucide-react"
import { toast } from "sonner"

interface SystemStats {
  systemHealth: {
    database: boolean
    lastBackup: string
  }
}

export function SystemPanel() {
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

  const triggerSync = async () => {
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST"
      })
      
      if (response.ok) {
        console.log("Sync triggered successfully")
        toast.success("Synchronizace spuštěna", {
          description: "Proces synchronizace byl zahájen na pozadí."
        })
      } else {
        throw new Error("Sync failed")
      }
    } catch (error) {
      console.error("Error triggering sync:", error)
      toast.error("Chyba", {
        description: "Nepodařilo se spustit synchronizaci."
      })
    }
  }

  const triggerBackup = async () => {
    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST"
      })
      
      if (response.ok) {
        console.log("Backup triggered successfully")
        toast.success("Záloha spuštěna", {
          description: "Vytváření zálohy bylo zahájeno."
        })
      } else {
        throw new Error("Backup failed")
      }
    } catch (error) {
      console.error("Error triggering backup:", error)
      toast.error("Chyba", {
        description: "Nepodařilo se spustit zálohování."
      })
    }
  }

  if (loading) {
    return <div>Načítání...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Stav systému</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="w-4 h-4 mr-2" />
              Infrastruktura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Databáze</span>
              <Badge variant={stats?.systemHealth.database ? "default" : "destructive"}>
                {stats?.systemHealth.database ? "Online" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">API Status</span>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Bakaláři Sync</span>
              <Badge variant="outline">Připraveno</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Rychlé akce
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={triggerSync}
              className="w-full justify-start"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Spustit synchronizaci
            </Button>
            <Button 
              onClick={triggerBackup}
              className="w-full justify-start"
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Vytvořit zálohu
            </Button>
            <Button 
              className="w-full justify-start"
              variant="outline"
            >
              <Shield className="w-4 h-4 mr-2" />
              Bezpečnostní audit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
