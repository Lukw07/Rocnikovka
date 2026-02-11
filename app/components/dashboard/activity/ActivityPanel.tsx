"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Activity, AlertTriangle, CheckCircle2, Info, Clock, Loader2, Search } from "lucide-react"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("ALL")

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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-muted-foreground">Načítání aktivit…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Systémové logy
        </h2>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Poslední aktivita
            </CardTitle>
            <CardDescription>
              Logy systémových událostí a chyb
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat v logu..."
                className="pl-10 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-white">
                <SelectValue placeholder="Filtrovat dle úrovně" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Všechny úrovně</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {(() => {
              const filteredActivity = activity.filter(item => {
                const matchesSearch =
                  item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.id.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesLevel = levelFilter === "ALL" || item.level === levelFilter
                return matchesSearch && matchesLevel
              })
              return filteredActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-muted-foreground">{activity.length === 0 ? 'Žádná aktivita' : 'Žádné záznamy odpovídající filtru'}</p>
              </div>
            ) : (
              filteredActivity.map((item) => (
                <div key={item.id} className="group flex items-start space-x-4 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
                  <div className={`mt-1 p-2.5 rounded-xl shadow-sm transition-all duration-300 ${
                    item.level === "ERROR" ? "bg-gradient-to-br from-red-500 to-red-600 text-white" :
                    item.level === "WARN" ? "bg-gradient-to-br from-yellow-500 to-amber-600 text-white" :
                    "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                  }`}>
                    {item.level === "ERROR" ? <AlertTriangle className="w-5 h-5" /> :
                     item.level === "WARN" ? <AlertTriangle className="w-5 h-5" /> :
                     <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{item.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs bg-white">
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        ID: {item.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
