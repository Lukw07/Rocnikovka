"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import {
  Users,
  Trophy,
  Coins,
  Crown,
  Shield,
  User,
  Calendar,
  Settings,
  LogOut,
  Scroll
} from "lucide-react"
import Link from "next/link"

interface GuildMember {
  user: {
    id: string
    name: string
    avatarUrl: string | null
    role: string
  } | null
  role: string
  joinedAt: string
}

interface GuildActivity {
  id: string
  action: string
  details: string | null
  createdAt: string
  user: {
    id: string
    name: string
  } | null
}

interface MyGuild {
  id: string
  name: string
  description: string | null
  motto: string | null
  logoUrl: string | null
  level: number
  xp: number
  treasury: number
  memberCount: number
  maxMembers: number
  isPublic: boolean
  myRole: string
  myJoinedAt: string
  myPermissions: string[]
  members: GuildMember[]
  activities: GuildActivity[]
}

export function MyGuildDisplay() {
  const [guild, setGuild] = useState<MyGuild | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyGuild()
  }, [])

  const fetchMyGuild = async () => {
    try {
      const response = await fetch('/api/guilds/my')
      if (response.ok) {
        const data = await response.json()
        setGuild(data.guild)
      }
    } catch (error) {
      console.error('Error fetching my guild:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'LEADER':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'OFFICER':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'LEADER':
        return <Badge variant="default" className="bg-yellow-500">Vůdce</Badge>
      case 'OFFICER':
        return <Badge variant="secondary" className="bg-blue-500">Důstojník</Badge>
      default:
        return <Badge variant="outline">Člen</Badge>
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Načítám guildu...</p>
      </div>
    )
  }

  if (!guild) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Nejste členem žádné guildy</h3>
        <p className="mb-4">Připojte se k existující guildě nebo si vytvořte vlastní!</p>
        <Button asChild>
          <Link href="/dashboard/guilds">Procházet guildy</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Guild Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={guild.logoUrl || undefined} />
              <AvatarFallback className="text-lg">
                {guild.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{guild.name}</h2>
                {getRoleBadge(guild.myRole)}
              </div>

              {guild.motto && (
                <p className="text-muted-foreground italic">"{guild.motto}"</p>
              )}

              {guild.description && (
                <p className="text-sm text-muted-foreground">{guild.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {guild.memberCount}/{guild.maxMembers} členů
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Úroveň {guild.level}
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  {guild.treasury} zlata
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {(guild.myRole === 'LEADER' || guild.myRole === 'OFFICER') && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/guilds/${guild.id}/manage`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Spravovat
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/guilds/${guild.id}`}>
                  <Scroll className="h-4 w-4 mr-2" />
                  Zobrazit
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Členové ({guild.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guild.members.map((member) => (
                <div key={member.user?.id || member.joinedAt} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {member.user?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.user?.name || 'Neznámý uživatel'}</span>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Člen od {new Date(member.joinedAt).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>

                  {getRoleBadge(member.role)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scroll className="h-5 w-5" />
              Nedávná aktivita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {guild.activities.length > 0 ? (
              <div className="space-y-3">
                {guild.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activity.user?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user?.name || 'Neznámý uživatel'}</span>
                        {' '}
                        {activity.action === 'join_request' && 'požádal o připojení'}
                        {activity.action === 'joined' && 'se připojil'}
                        {activity.action === 'left' && 'opustil guildu'}
                        {activity.action === 'promoted' && 'byl povýšen'}
                        {activity.action === 'demoted' && 'byl degradován'}
                        {activity.action === 'kicked' && 'byl vyhozen'}
                        {activity.action === 'quest_completed' && 'dokončil quest'}
                        {activity.action === 'level_up' && 'guilda postoupila level'}
                        {!['join_request', 'joined', 'left', 'promoted', 'demoted', 'kicked', 'quest_completed', 'level_up'].includes(activity.action) && activity.action}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-muted-foreground">{activity.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString('cs-CZ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádná nedávná aktivita
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}