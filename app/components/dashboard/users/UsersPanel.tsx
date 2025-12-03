"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Progress } from "@/app/components/ui/progress"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/app/components/ui/dropdown-menu"
import { Badge } from "@/app/components/ui/badge"
import { Search, MoreHorizontal, Shield, ShieldAlert, Coins, Trophy, Star } from "lucide-react"
import { getUserRoleStats, getAllUsers, toggleOperatorRole } from "@/app/actions/admin"
import { toast } from "sonner"
import { UserRole } from "@/app/lib/generated"
import { formatXP } from "@/app/lib/utils"

interface UserStats {
  total: number
  students: number
  teachers: number
  operators: number
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  stats: {
    level: number
    totalXp: number
    balance: number
    remainingBudget: number
  }
}

export function UsersPanel() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        getUserRoleStats(),
        getAllUsers()
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast.error("Chyba při načítání dat")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      // Only allow toggling between TEACHER and OPERATOR for now, as per existing logic
      if (currentRole !== UserRole.TEACHER && currentRole !== UserRole.OPERATOR) {
        toast.error("Lze měnit roli pouze mezi Učitelem a Operátorem")
        return
      }

      const result = await toggleOperatorRole(userId)
      if (result.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: result.newRole } : u
        ))
        // Refresh stats as well
        const newStats = await getUserRoleStats()
        setStats(newStats)
        
        toast.success("Role aktualizována", {
          description: `Role uživatele byla změněna na ${result.newRole}`,
        })
      }
    } catch (error) {
      toast.error("Chyba", {
        description: error instanceof Error ? error.message : "Nepodařilo se změnit roli",
      })
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case UserRole.OPERATOR: return "destructive"
      case UserRole.TEACHER: return "default"
      case UserRole.STUDENT: return "secondary"
      default: return "outline"
    }
  }

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Správa uživatelů</h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          Obnovit data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Studenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.students || 0}</div>
            <Progress 
              value={calculatePercentage(stats?.students || 0, stats?.total || 1)} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {calculatePercentage(stats?.students || 0, stats?.total || 1)}% ze všech uživatelů
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Učitelé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teachers || 0}</div>
            <Progress 
              value={calculatePercentage(stats?.teachers || 0, stats?.total || 1)} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {calculatePercentage(stats?.teachers || 0, stats?.total || 1)}% ze všech uživatelů
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Operátoři</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.operators || 0}</div>
            <Progress 
              value={calculatePercentage(stats?.operators || 0, stats?.total || 1)} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {calculatePercentage(stats?.operators || 0, stats?.total || 1)}% ze všech uživatelů
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seznam uživatelů</CardTitle>
              <CardDescription>Správa všech uživatelů v systému</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat uživatele..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jméno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Statistiky</TableHead>
                  <TableHead>Registrace</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Načítání uživatelů...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Žádní uživatelé nenalezeni
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === UserRole.STUDENT && (
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                              <Star className="w-3 h-3" /> Level {user.stats.level}
                            </div>
                            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                              <Trophy className="w-3 h-3" /> {formatXP(user.stats.totalXp)} XP
                            </div>
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Coins className="w-3 h-3" /> {user.stats.balance} Kreditů
                            </div>
                          </div>
                        )}
                        {(user.role === UserRole.TEACHER || user.role === UserRole.OPERATOR) && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                            <Trophy className="w-3 h-3" /> Rozpočet: {user.stats.remainingBudget} XP
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Otevřít menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akce</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(user.email)}
                            >
                              Kopírovat email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(user.role === UserRole.TEACHER || user.role === UserRole.OPERATOR) && (
                              <DropdownMenuItem onClick={() => handleToggleRole(user.id, user.role)}>
                                {user.role === UserRole.OPERATOR ? (
                                  <>
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Odebrat operátora
                                  </>
                                ) : (
                                  <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Povýšit na operátora
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {/* Add more actions here like "Edit User" or "Delete User" if needed */}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
