import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { 
  Users, 
  Trophy, 
  Coins, 
  TrendingUp, 
  ArrowLeft,
  UserPlus,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { GuildMembers } from "@/app/components/guilds/guild-members"
import { GuildChat } from "@/app/components/guilds/guild-chat"
import { GuildBenefits } from "@/app/components/guilds/guild-benefits"
import { GuildJoinRequests } from "@/app/components/guilds/guild-join-requests"
import { TransferLeadershipWrapper } from "@/app/components/guilds/transfer-leadership-wrapper"
import { LeaveGuildButton } from "@/app/components/guilds/leave-guild-button"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const guild = await prisma.guild.findUnique({
    where: { id },
    select: { name: true }
  })

  return {
    title: guild ? `${guild.name} | Guildy` : "Guilda",
    description: "Detail guildy"
  }
}

export default async function GuildDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const guild = await prisma.guild.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      },
      activities: {
        take: 10,
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!guild) {
    notFound()
  }

  const currentMember = guild.members.find(m => m.userId === session.user.id)
  const isLeader = currentMember?.role === "LEADER"
  const isOfficer = currentMember?.role === "OFFICER"
  const isMember = !!currentMember

  // Calculate level progress
  const xpForNextLevel = (guild.level * 1000)
  const currentLevelXP = guild.xp % 1000
  const levelProgress = (currentLevelXP / 1000) * 100

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/guilds">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na guildy
        </Link>
      </Button>

      {/* Guild Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {guild.logoUrl && (
                <img
                  src={guild.logoUrl}
                  alt={guild.name}
                  className="w-16 h-16 rounded-lg"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-2xl">{guild.name}</CardTitle>
                  <Badge variant="outline">Level {guild.level}</Badge>
                  {guild.isPublic ? (
                    <Badge variant="secondary">Veřejná</Badge>
                  ) : (
                    <Badge variant="destructive">Soukromá</Badge>
                  )}
                </div>
                {guild.motto && (
                  <p className="text-muted-foreground italic">
                    &quot;{guild.motto}&quot;
                  </p>
                )}
                {guild.description && (
                  <p className="text-sm mt-2">{guild.description}</p>
                )}
              </div>
            </div>

            {/* Join/Leave buttons */}
            <div className="flex gap-2">
              {isLeader && (
                <TransferLeadershipWrapper
                  guildId={guild.id}
                  members={guild.members}
                  currentUserId={session.user.id}
                />
              )}
              {!isMember && guild.memberCount < guild.maxMembers && (
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Připojit se
                </Button>
              )}
              {isMember && (
                <LeaveGuildButton guildId={guild.id} guildName={guild.name} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Členové</span>
                </div>
                <p className="text-2xl font-bold">
                  {guild.memberCount}/{guild.maxMembers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">XP</span>
                </div>
                <p className="text-2xl font-bold">{guild.xp.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Pokladna</span>
                </div>
                <p className="text-2xl font-bold">{guild.treasury} 💰</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Level</span>
                </div>
                <p className="text-2xl font-bold">{guild.level}</p>
              </CardContent>
            </Card>
          </div>

          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progres k dalšímu levelu</span>
              <span className="font-medium">
                {currentLevelXP}/{1000} XP
              </span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs with content */}
      {isMember ? (
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Členové</TabsTrigger>
            {(isLeader || isOfficer) && (
              <TabsTrigger value="requests">Žádosti o vstup</TabsTrigger>
            )}
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="benefits">Výhody</TabsTrigger>
            <TabsTrigger value="activities">Aktivity</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <GuildMembers 
              guildId={guild.id} 
              currentUserId={session.user.id}
              isLeader={isLeader}
              isOfficer={isOfficer}
            />
          </TabsContent>

          {(isLeader || isOfficer) && (
            <TabsContent value="requests">
              <GuildJoinRequests
                guildId={guild.id}
                isLeader={isLeader}
                isOfficer={isOfficer}
              />
            </TabsContent>
          )}

          <TabsContent value="chat">
            <GuildChat 
              guildId={guild.id}
              currentUserId={session.user.id}
            />
          </TabsContent>

          <TabsContent value="benefits">
            <GuildBenefits 
              guildId={guild.id}
              guildLevel={guild.level}
            />
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Nedávné aktivity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {guild.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground">
                            {activity.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString("cs-CZ")}
                      </span>
                    </div>
                  ))}
                  {guild.activities.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím žádné aktivity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Připojte se k této guildě pro přístup k dalším funkcím
            </p>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Připojit se
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
