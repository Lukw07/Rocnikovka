"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"

interface DailyBudget {
  subject: {
    name: string
    code: string
  }
  budget: number
  used: number
  remaining: number
}

export function BudgetPanel() {
  const [budgets, setBudgets] = useState<DailyBudget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await fetch("/api/teacher/budget/today")
        if (response.ok) {
          const data = await response.json()
          setBudgets(data.budgets || [])
        }
      } catch (error) {
        console.error("Error fetching budgets:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgets()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Denní XP rozpočty</CardTitle>
          <CardDescription>
            Detailní přehled rozpočtů pro jednotlivé předměty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <div key={budget.subject.code} className="space-y-2 p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{budget.subject.name}</span>
                  <Badge variant={budget.remaining > 0 ? "default" : "destructive"}>
                    {budget.remaining} XP zbývá
                  </Badge>
                </div>
                <Progress 
                  value={(budget.used / budget.budget) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Použito: {budget.used} XP</span>
                  <span>Celkem: {budget.budget} XP</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
