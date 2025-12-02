"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import { BookOpen, Users, Award, TrendingUp, Shield } from "lucide-react"
import { OperatorOverview } from "./OperatorOverview"

interface TeacherOverviewProps {
  userId: string
  isOperator?: boolean
}

interface Job {
  id: string
  title: string
  description: string
  xpReward: number
  moneyReward: number
  status: string
  subject: {
    name: string
  }
  assignments: Array<{
    id: string
    status: string
    student: {
      name: string
      email: string
    }
  }>
}

interface DailyBudget {
  subject: {
    name: string
    code: string
  }
  budget: number
  used: number
  remaining: number
}

export function TeacherOverview({ userId, isOperator = false }: TeacherOverviewProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [budgets, setBudgets] = useState<DailyBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [isOperatorMode, setIsOperatorMode] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [jobsResponse, budgetsResponse] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/teacher/budget/today")
      ])
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        setJobs(jobsData.data?.jobs || [])
      }
      
      if (budgetsResponse.ok) {
        const budgetsData = await budgetsResponse.json()
        setBudgets(budgetsData.budgets || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isOperatorMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">Režim operátora</span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="operator-mode"
              checked={isOperatorMode}
              onCheckedChange={setIsOperatorMode}
            />
            <Label htmlFor="operator-mode">Aktivní</Label>
          </div>
        </div>
        <OperatorOverview userId={userId} />
      </div>
    )
  }

  const totalJobs = jobs.length
  const activeJobs = jobs.filter(job => job.status === "OPEN").length
  const pendingAssignments = jobs.reduce((total, job) => 
    total + job.assignments.filter(a => a.status === "APPLIED").length, 0
  )

  // Default Dashboard View
  return (
    <div className="space-y-6">
      {isOperator && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border">
            <Label htmlFor="operator-mode-toggle" className="text-sm text-muted-foreground">Režim operátora</Label>
            <Switch
              id="operator-mode-toggle"
              checked={isOperatorMode}
              onCheckedChange={setIsOperatorMode}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Celkem úkolů
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalJobs}</div>
            <p className="text-xs text-blue-600">Vytvořené mise</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Aktivní úkoly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{activeJobs}</div>
            <p className="text-xs text-green-600">Otevřené pro přihlášení</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Čekající přihlášky
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{pendingAssignments}</div>
            <p className="text-xs text-yellow-600">K schválení</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Dnešní XP rozpočet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {budgets.reduce((total, budget) => total + budget.remaining, 0)}
            </div>
            <p className="text-xs text-purple-600">Zbývá k rozdání</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Budgets Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Denní XP rozpočty</CardTitle>
          <CardDescription>
            Zbývající XP pro dnešní den podle předmětů
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <div key={budget.subject.code} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{budget.subject.name}</span>
                  <Badge variant="outline">
                    {budget.remaining}/{budget.budget}
                  </Badge>
                </div>
                <Progress 
                  value={(budget.used / budget.budget) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  Použito: {budget.used} XP
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
