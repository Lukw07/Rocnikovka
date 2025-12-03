"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { formatXP } from "@/app/lib/utils"
import { 
  Users, 
  Database, 
  Activity, 
  TrendingUp
} from "lucide-react"

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

export function OperatorOverview({ userId }: OperatorOverviewProps) {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await fetch("/api/admin/stats")
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
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
    </div>
  )
}
