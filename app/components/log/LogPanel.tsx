"use client"

import { useState, useEffect } from "react"
import { useSidebar } from "@/app/components/ui/Sidebar"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Search, RefreshCw, AlertTriangle, Info, AlertCircle, Bug, Activity, ArrowLeft, Loader2, FileText, Bell, Briefcase, CalendarClock, Sparkles } from "lucide-react"
import { getSystemLogs } from "@/app/actions/admin"
import { toast } from "sonner"

type DashboardRole = "STUDENT" | "TEACHER" | "OPERATOR" | "ADMIN" | string | undefined

interface LogPanelProps {
  userRole?: DashboardRole
}

interface SystemLog {
  id: string
  level: string
  message: string
  createdAt: Date
  user?: {
    name: string
    email: string
  } | null
  metadata?: any
}

export default function LogPanel({ userRole }: LogPanelProps) {
  const { setSelectedPanel } = useSidebar()
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("ALL")

  const important = (() => {
    const lower = (s: string) => s.toLowerCase()
    const summary = {
      jobs: 0,
      events: 0,
      rewards: 0
    }
    for (const log of logs) {
      const msg = lower(log.message)
      if (msg.includes("job") || msg.includes("úkol")) summary.jobs++
      if (msg.includes("event") || msg.includes("akce")) summary.events++
      if (msg.includes("badge") || msg.includes("odznak") || msg.includes("reward") || msg.includes("odměn")) summary.rewards++
    }
    return summary
  })()

  useEffect(() => {
    if (userRole === "OPERATOR") {
      fetchLogs()
    }
  }, [userRole])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await getSystemLogs()
      setLogs(data)
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast.error("Nepodařilo se načíst logy")
    } finally {
      setLoading(false)
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR": return <Badge variant="destructive" className="flex w-fit items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</Badge>
      case "WARN": return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200 flex w-fit items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARN</Badge>
      case "INFO": return <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200 flex w-fit items-center gap-1"><Info className="w-3 h-3" /> INFO</Badge>
      case "DEBUG": return <Badge variant="outline" className="flex w-fit items-center gap-1"><Bug className="w-3 h-3" /> DEBUG</Badge>
      default: return <Badge variant="outline">{level}</Badge>
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter

    return matchesSearch && matchesLevel
  })

  if (userRole !== "OPERATOR") {
    const [playerLogs, setPlayerLogs] = useState<any[]>([])
    const [playerLoading, setPlayerLoading] = useState(true)

    useEffect(() => {
      const fetchPlayerLogs = async () => {
        try {
          const res = await fetch('/api/me/activity?limit=100')
          if (res.ok) {
            const json = await res.json()
            setPlayerLogs(json.data?.activity || [])
          }
        } catch (e) {
          console.error(e)
        } finally {
          setPlayerLoading(false)
        }
      }
      fetchPlayerLogs()
    }, [])

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Záznam aktivit
                </h2>
                <p className="text-muted-foreground">Historie vašich finančních operací a aktivit</p>
              </div>
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2">
            <CardContent className="p-6">
              <div className="space-y-3">
                {playerLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Načítám…</div>}
                {!playerLoading && playerLogs.length === 0 && <div className="text-muted-foreground text-sm">Žádná aktivita</div>}
                {!playerLoading && playerLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white/60">
                    <div className="text-sm font-medium">{log.title}</div>
                    {log.description && <div className="text-xs text-muted-foreground">{log.description}</div>}
                    {log.amount && <div className="text-xs font-semibold" style={{color: log.direction === 'in' ? '#16a34a' : '#dc2626'}}>{
                      log.direction === 'in' ? '+' : '-'
                    }{Math.abs(log.amount)} {log.currency === 'money' ? 'Kč' : 'XP'}</div>}
                    {log.createdAt && <div className="text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleString('cs-CZ')}</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Důležité notifikace
              </h2>
              <p className="text-muted-foreground">Nové joby, eventy, odměny a systémové logy</p>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {important.jobs} jobů</Badge>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {important.events} eventů</Badge>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {important.rewards} odměn/badge</Badge>
              </div>
            </div>
          </div>
          <Button 
            onClick={fetchLogs} 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="hover:bg-white/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Obnovit
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
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
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="w-[120px] font-semibold">Úroveň</TableHead>
                    <TableHead className="font-semibold">Zpráva</TableHead>
                    <TableHead className="font-semibold">Uživatel</TableHead>
                    <TableHead className="text-right font-semibold">Čas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                        <span className="text-muted-foreground">Načítání logů...</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <span className="text-muted-foreground">Žádné záznamy nenalezeny</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell>{getLevelBadge(log.level)}</TableCell>
                        <TableCell className="font-medium text-gray-800">{log.message}</TableCell>
                        <TableCell>
                          {log.user ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800">{log.user.name}</span>
                              <span className="text-xs text-muted-foreground">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {new Date(log.createdAt).toLocaleString('cs-CZ')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
