"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { formatXP } from "@/app/lib/utils"
import { 
  Users, 
  Settings, 
  Database, 
  Activity, 
  Shield, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Server,
  Save,
  FileText
} from "lucide-react"
import { useSidebar } from "@/app/components/ui/V2sidebar"

interface OperatorDashboardProps {
  userId: string
}

interface SystemStats {
  totalUsers: number
  totalJobs: number
  activeJobs: number
  totalXP: number
  systemHealth: {
    database: boolean
    lastBackup: string
  }
}

interface RecentActivity {
  id: string
  type: string
  message: string
  timestamp: string
  level: string
}

export function OperatorDashboard({ userId }: OperatorDashboardProps) {
  const { selectedPanel } = useSidebar()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [activity, setActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity")
      ])
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setActivity(activityData.activity || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async () => {
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST"
      })
      
      if (response.ok) {
        console.log("Sync triggered successfully")
        // Refresh stats
        fetchDashboardData()
      }
    } catch (error) {
      console.error("Error triggering sync:", error)
    }
  }

  const triggerBackup = async () => {
    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST"
      })
      
      if (response.ok) {
        console.log("Backup triggered successfully")
        fetchDashboardData()
      }
    } catch (error) {
      console.error("Error triggering backup:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render content based on active panel
  const renderContent = () => {
    switch (selectedPanel) {
      case 'users':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Správa uživatelů</h2>
            <Card>
              <CardHeader>
                <CardTitle>Distribuce uživatelů</CardTitle>
                <CardDescription>Přehled rolí v systému</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Studenti</span>
                    <div className="flex items-center space-x-2 w-1/2">
                      <Progress value={75} className="h-2" />
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Učitelé</span>
                    <div className="flex items-center space-x-2 w-1/2">
                      <Progress value={20} className="h-2" />
                      <span className="text-sm text-muted-foreground">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Operátoři</span>
                    <div className="flex items-center space-x-2 w-1/2">
                      <Progress value={5} className="h-2" />
                      <span className="text-sm text-muted-foreground">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Add user list table here later */}
          </div>
        )

      case 'system':
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

      case 'activity':
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

      case 'backups':
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

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Systémová nastavení</h2>
            <Card>
              <CardHeader>
                <CardTitle>Konfigurace EduRPG platformy</CardTitle>
                <CardDescription>
                  Globální nastavení systému
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Výchozí XP rozpočet</label>
                    <input 
                      type="number" 
                      defaultValue="1000"
                      className="w-full p-2 border rounded-md bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interval synchronizace (min)</label>
                    <input 
                      type="number" 
                      defaultValue="15"
                      className="w-full p-2 border rounded-md bg-background"
                    />
                  </div>
                </div>
                <Button className="w-full md:w-auto">
                  Uložit nastavení
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      default: // 'overview'
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Přehled systému</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Celkem uživatelů
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {stats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Registrovaní hráči</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Aktivní úkoly
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {stats?.activeJobs || 0}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">Probíhající mise</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Celkové XP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatXP(stats?.totalXP || 0)}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Rozdané zkušenosti</p>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-br ${
                stats?.systemHealth.database 
                  ? "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800" 
                  : "from-red-50 to-red-100 border-red-200 dark:from-red-950 dark:to-red-900 dark:border-red-800"
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium flex items-center ${
                    stats?.systemHealth.database ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                  }`}>
                    <Database className="w-4 h-4 mr-2" />
                    Databáze
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    stats?.systemHealth.database ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"
                  }`}>
                    {stats?.systemHealth.database ? "Online" : "Offline"}
                  </div>
                  <p className={`text-xs ${
                    stats?.systemHealth.database ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}>
                    {stats?.systemHealth.database ? "Systém funkční" : "Problém s připojením"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Poslední události</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activity.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.level === "ERROR" ? "bg-red-500" :
                          item.level === "WARN" ? "bg-yellow-500" :
                          "bg-green-500"
                        }`} />
                        <span className="text-sm">{item.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  )
}
