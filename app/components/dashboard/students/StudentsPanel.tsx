"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Users } from "lucide-react"

export function StudentsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Správa studentů</CardTitle>
        <CardDescription>Přehled a správa studentů ve vašich třídách</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Modul správy studentů je ve vývoji.</p>
        </div>
      </CardContent>
    </Card>
  )
}
