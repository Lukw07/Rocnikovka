"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { formatXP } from "@/app/lib/utils"
import { 
  Users, 
  Database, 
  Activity, 
  TrendingUp,
  Shield,
  ShieldAlert
} from "lucide-react"
import { getTeachersAndOperators, toggleOperatorRole } from "@/app/actions/admin"
import { toast } from "sonner"

interface OperatorOverviewProps {
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

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export function OperatorOverview({ userId }: OperatorOverviewProps) {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [activity, setActivity] = useState<RecentActivity[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse, usersData] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
        getTeachersAndOperators()
      ])
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setActivity(activityData.activity || [])
      }

      setUsers(usersData as UserData[])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = async (targetUserId: string) => {
    try {
      const result = await toggleOperatorRole(targetUserId)
      if (result.success) {
        setUsers(users.map(u => 
          u.id === targetUserId ? { ...u, role: result.newRole } : u
        ))
        toast.success("Role aktualizována", {
          description: `Role uživatele byla změněna na ${result.newRole}`,
        })
      }
    } catch (error) {
      toast.error("Chyba", {
        description: "Nepodařilo se změnit roli",
      })
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

      {/* Operator Management */}
      <Card>
        <CardHeader>
          <CardTitle>Správa operátorů</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'OPERATOR' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {user.role === 'OPERATOR' ? 'Operátor' : 'Učitel'}
                  </div>
                  <Button
                    variant={user.role === 'OPERATOR' ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleRole(user.id)}
                    disabled={user.id === userId} // Prevent removing own operator role
                  >
                    {user.role === 'OPERATOR' ? (
                      <>
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Odebrat operátora
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Přidat operátora
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
