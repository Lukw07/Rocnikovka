"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Crown, Shield, User, UserX, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"

interface Member {
  id: string
  userId: string
  role: "LEADER" | "OFFICER" | "MEMBER"
  contributedXP: number
  contributedMoney: number
  joinedAt: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
    reputation?: {
      totalReputation: number
    } | null
  }
}

interface GuildMembersProps {
  guildId: string
  currentUserId?: string
  isLeader?: boolean
  isOfficer?: boolean
}

export function GuildMembers({ guildId, currentUserId, isLeader, isOfficer }: GuildMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [kickingUserId, setKickingUserId] = useState<string | null>(null)
  const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [guildId])

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/members`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setLoading(false)
    }
  }

  const kickMember = async (targetUserId: string, targetUserName: string) => {
    if (!confirm(`Opravdu chcete vyhodit ${targetUserName} z guildy?`)) {
      return
    }

    setKickingUserId(targetUserId)
    try {
      const response = await fetch(`/api/guilds/${guildId}/members/${targetUserId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to kick member")
      }

      // Remove member from local state
      setMembers(prev => prev.filter(member => member.userId !== targetUserId))
    } catch (error: any) {
      alert(`Chyba při vyhazování člena: ${error.message}`)
    } finally {
      setKickingUserId(null)
    }
  }

  const changeMemberRole = async (targetUserId: string, targetUserName: string, newRole: string) => {
    if (!confirm(`Opravdu chcete změnit roli ${targetUserName} na ${newRole === 'OFFICER' ? 'důstojník' : 'člen'}?`)) {
      return
    }

    setChangingRoleUserId(targetUserId)
    try {
      const response = await fetch(`/api/guilds/${guildId}/members/${targetUserId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to change member role")
      }

      // Update member role in local state
      setMembers(prev => prev.map(member =>
        member.userId === targetUserId
          ? { ...member, role: newRole as "LEADER" | "OFFICER" | "MEMBER" }
          : member
      ))
    } catch (error: any) {
      alert(`Chyba při změně role: ${error.message}`)
    } finally {
      setChangingRoleUserId(null)
    }
  }

  const handleKickMember = async (targetUserId: string, userName: string) => {
    if (!confirm(`Opravdu chceš vyhodit ${userName} z guildy?`)) {
      return
    }

    try {
      const res = await fetch(`/api/guilds/${guildId}/members/${targetUserId}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to kick member")
      }

      // Refresh members list
      fetchMembers()
      alert(`${userName} byl úspěšně vyhozen z guildy`)
    } catch (error: any) {
      console.error("Failed to kick member:", error)
      alert(`Chyba při vyhazování člena: ${error.message}`)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "LEADER":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "OFFICER":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "LEADER":
        return <Badge variant="default">Vůdce</Badge>
      case "OFFICER":
        return <Badge variant="secondary">Důstojník</Badge>
      default:
        return <Badge variant="outline">Člen</Badge>
    }
  }

  if (loading) {
    return <div className="text-center py-8">Načítání členů...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Členové guildy ({members.length})</CardTitle>
        <CardDescription>
          Seznam všech členů a jejich příspěvky
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.user.avatarUrl || undefined} />
                  <AvatarFallback>
                    {member.user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className="font-medium">{member.user.name}</span>
                    <div className="flex items-center gap-1">
                      {getRoleBadge(member.role)}
                      {/* Role management dropdown for leaders and officers */}
                      {(isLeader || isOfficer) &&
                       member.userId !== currentUserId &&
                       member.role !== "LEADER" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              disabled={changingRoleUserId === member.userId}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role !== "OFFICER" && (
                              <DropdownMenuItem
                                onClick={() => changeMemberRole(member.userId, member.user.name, "OFFICER")}
                                disabled={changingRoleUserId === member.userId}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Povýšit na důstojníka
                              </DropdownMenuItem>
                            )}
                            {member.role !== "MEMBER" && (
                              <DropdownMenuItem
                                onClick={() => changeMemberRole(member.userId, member.user.name, "MEMBER")}
                                disabled={changingRoleUserId === member.userId}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Degradovat na člena
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Člen od {new Date(member.joinedAt).toLocaleDateString("cs-CZ")}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm">
                  <span className="text-muted-foreground">XP:</span>{" "}
                  <span className="font-medium">{member.contributedXP}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">💰:</span>{" "}
                  <span className="font-medium">{member.contributedMoney}</span>
                </div>
                {member.user.reputation && (
                  <div className="text-xs text-muted-foreground">
                    Rep: {member.user.reputation.totalReputation}
                  </div>
                )}
                {/* Kick button for leaders and officers (cannot kick themselves or leaders) */}
                {(isLeader || isOfficer) &&
                 member.userId !== currentUserId &&
                 member.role !== "LEADER" &&
                 (isLeader || member.role !== "OFFICER") && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => kickMember(member.userId, member.user.name)}
                    disabled={kickingUserId === member.userId}
                  >
                    <UserX className="h-3 w-3 mr-1" />
                    {kickingUserId === member.userId ? "Vyhazování..." : "Vyhodit"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
