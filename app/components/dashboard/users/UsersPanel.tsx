"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Progress } from "@/app/components/ui/progress"

export function UsersPanel() {
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
}
