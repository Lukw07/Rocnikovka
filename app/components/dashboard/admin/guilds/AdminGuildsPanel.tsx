"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
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
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Search, MoreHorizontal, Shield, Users, Edit, Trash2, Eye } from "lucide-react"
import { getAllGuilds, deleteGuild, updateGuild, getGuildStats } from "@/app/actions/admin"
import { toast } from "sonner"
import { GuildWithMembers } from "@/app/lib/types"
import { GuildDetailModal } from "./GuildDetailModal"
import { GuildEditModal } from "./GuildEditModal"

interface GuildStats {
  total: number
  public: number
  private: number
}

export function AdminGuildsPanel() {
  const [stats, setStats] = useState<GuildStats | null>(null)
  const [guilds, setGuilds] = useState<GuildWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [guildsData] = await Promise.all([
        getAllGuilds()
      ])
      setGuilds(guildsData)
      
      // Calculate stats from guilds data
      const total = guildsData.length
      const publicCount = guildsData.filter(g => g.isPublic).length
      const privateCount = total - publicCount
      setStats({ total, public: publicCount, private: privateCount })
    } catch (error) {
      console.error("Error fetching guild data:", error)
      toast.error("Chyba při načítání dat")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGuild = async (guildId: string, guildName: string) => {
    if (!confirm(`Opravdu chcete smazat klan "${guildName}"? Tato akce je nevratná.`)) {
      return
    }

    try {
      await deleteGuild(guildId)
      setGuilds(guilds.filter(g => g.id !== guildId))
      toast.success("Klan smazán", {
        description: `Klan "${guildName}" byl úspěšně smazán.`,
      })
    } catch (error) {
      toast.error("Chyba", {
        description: error instanceof Error ? error.message : "Nepodařilo se smazat klan",
      })
    }
  }

  const handleToggleVisibility = async (guildId: string, currentIsPublic: boolean) => {
    try {
      await updateGuild(guildId, { isPublic: !currentIsPublic })
      setGuilds(guilds.map(g => 
        g.id === guildId ? { ...g, isPublic: !currentIsPublic } : g
      ))
      toast.success("Viditelnost klanu změněna", {
        description: `Klan je nyní ${!currentIsPublic ? "veřejný" : "soukromý"}.`,
      })
    } catch (error) {
      toast.error("Chyba", {
        description: error instanceof Error ? error.message : "Nepodařilo se změnit viditelnost klanu",
      })
    }
  }

  const handleViewGuild = (guildId: string) => {
    setSelectedGuildId(guildId)
    setDetailModalOpen(true)
  }

  const handleEditGuild = (guildId: string) => {
    setSelectedGuildId(guildId)
    setEditModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false)
    setSelectedGuildId(null)
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setSelectedGuildId(null)
  }

  const handleEditSuccess = () => {
    fetchData() // Refresh the data after successful edit
  }

  const filteredGuilds = guilds.filter(guild =>
    guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guild.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guild.leader.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Správa klanů</h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          Obnovit data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Celkem klanů</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Veřejné klany</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.public || 0}</div>
            <Progress
              value={calculatePercentage(stats?.public || 0, stats?.total || 1)}
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {calculatePercentage(stats?.public || 0, stats?.total || 1)}% ze všech klanů
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Soukromé klany</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.private || 0}</div>
            <Progress
              value={calculatePercentage(stats?.private || 0, stats?.total || 1)}
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {calculatePercentage(stats?.private || 0, stats?.total || 1)}% ze všech klanů
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Guilds Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seznam klanů</CardTitle>
              <CardDescription>Správa všech klanů v systému</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat klany..."
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
                  <TableHead>Název</TableHead>
                  <TableHead>Vůdce</TableHead>
                  <TableHead>Členové</TableHead>
                  <TableHead>Viditelnost</TableHead>
                  <TableHead>Vytvořen</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Načítání klanů...
                    </TableCell>
                  </TableRow>
                ) : filteredGuilds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Žádné klany nenalezeny
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuilds.map((guild) => (
                    <TableRow key={guild.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{guild.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {guild.description || "Bez popisu"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{guild.leader.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {guild._count.members}/{guild.maxMembers || "∞"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={guild.isPublic ? "default" : "secondary"}>
                          {guild.isPublic ? "Veřejný" : "Soukromý"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(guild.createdAt).toLocaleDateString('cs-CZ')}
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
                            <DropdownMenuItem onClick={() => handleViewGuild(guild.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Zobrazit detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditGuild(guild.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Upravit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleVisibility(guild.id, guild.isPublic)}
                            >
                              {guild.isPublic ? "Nastavit soukromý" : "Nastavit veřejný"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteGuild(guild.id, guild.name)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Smazat klan
                            </DropdownMenuItem>
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

      <GuildDetailModal
        guildId={selectedGuildId}
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
      />

      <GuildEditModal
        guildId={selectedGuildId}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}