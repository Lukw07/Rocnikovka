"use client"

import { useState, useEffect } from "react"
import { useSidebar } from "@/app/components/ui/Sidebar"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Search, RefreshCw, AlertTriangle, Info, AlertCircle, Bug } from "lucide-react"
import { getSystemLogs } from "@/app/actions/admin"
import { UserRole } from "@/app/lib/generated"
import { toast } from "sonner"

interface LogPanelProps {
  userRole?: UserRole
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

  useEffect(() => {
    if (userRole === UserRole.OPERATOR) {
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

  if (userRole !== UserRole.OPERATOR) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Záznam</h2>
        <p className="text-muted-foreground mb-4">Zde uvidíte historii vašich aktivit (XP, nákupy, atd.).</p>
        <p className="text-sm text-muted-foreground">Tato sekce je pro studenty zatím ve vývoji.</p>
        <Button onClick={() => setSelectedPanel('dashboard')} className="mt-4">Zpět na přehled</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Systémové logy</h2>
          <p className="text-muted-foreground">Přehled aktivit a událostí v systému</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Obnovit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat v logu..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
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
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Úroveň</TableHead>
                  <TableHead>Zpráva</TableHead>
                  <TableHead>Uživatel</TableHead>
                  <TableHead className="text-right">Čas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Načítání logů...</TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Žádné záznamy nenalezeny</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell className="font-medium">{log.message}</TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{log.user.name}</span>
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
  )
}
