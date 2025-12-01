"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Activity, AlertTriangle } from "lucide-react"

interface RecentActivity {
  id: string
  type: string
  message: string
  timestamp: string
  level: string
}

export function ActivityPanel() {
  const [activity, setActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch("/api/admin/activity")
        if (response.ok) {
          const data = await response.json()
          setActivity(data.activity || [])
        }
      } catch (error) {
        console.error("Error fetching activity:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [])

  if (loading) {
    return <div>Načítání...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Systémové logy</h2>
      <Card>
        <CardHeader>
          <CardTitle>Poslední aktivita</CardTitle>
          <CardDescription>
            Logy systémových událostí a chyb
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`mt-1 p-2 rounded-full ${
                  item.level === "ERROR" ? "bg-red-100 text-red-600" :
                  item.level === "WARN" ? "bg-yellow-100 text-yellow-600" :
                  "bg-green-100 text-green-600"
                }`}>
                  {item.level === "ERROR" ? <AlertTriangle className="w-4 h-4" /> :
                   item.level === "WARN" ? <AlertTriangle className="w-4 h-4" /> :
                   <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.message}</p>
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">ID: {item.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
