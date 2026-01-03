"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Progress } from "@/app/components/ui/progress"
import { 
  Trophy, Award, TrendingUp, Star, Medal, Crown, 
  Target, Zap, Users, BookOpen, Calendar, Flame
} from "lucide-react"

interface TeacherStats {
  totalJobsCreated: number
  totalJobsCompleted: number
  totalXPAwarded: number
  totalMoneyAwarded: number
  totalQuestsCreated: number
  totalQuestsCompleted: number
  totalEventsCreated: number
  totalEventParticipants: number
  totalStudentsHelped: number
  activeDaysCount: number
  motivationPoints: number
  totalBadgesEarned: number
  totalAwardsReceived: number
  monthlyJobsCreated: number
  weeklyJobsCreated: number
  badges: TeacherBadge[]
  achievements: TeacherAchievement[]
}

interface TeacherBadge {
  id: string
  badgeType: string
  title: string
  description: string
  icon: string
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"
  earnedAt: string
}

interface TeacherAchievement {
  id: string
  achievementKey: string
  name: string
  description: string
  progress: number
  maxProgress: number
  isCompleted: boolean
  rewardPoints: number
  completedAt?: string
}

interface LeaderboardEntry {
  teacherId: string
  motivationPoints: number
  totalJobsCreated: number
  totalXPAwarded: number
  totalMoneyAwarded: number
  badges: TeacherBadge[]
}

export function TeacherMotivationDashboard({ teacherId }: { teacherId: string }) {
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [rank, setRank] = useState<{ rank: number; total: number; percentile: number } | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [teacherId])

  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/teacher-stats/dashboard")
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data.dashboard.stats)
        setRank(data.data.dashboard.rank)
        setLeaderboard(data.data.dashboard.topTeachers)
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON": return "bg-gray-100 text-gray-700 border-gray-300"
      case "UNCOMMON": return "bg-green-50 text-green-700 border-green-300"
      case "RARE": return "bg-blue-50 text-blue-700 border-blue-300"
      case "EPIC": return "bg-purple-50 text-purple-700 border-purple-300"
      case "LEGENDARY": return "bg-yellow-50 text-yellow-700 border-yellow-300"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: "🥇", color: "bg-yellow-500", label: "1. místo" }
    if (rank === 2) return { icon: "🥈", color: "bg-gray-400", label: "2. místo" }
    if (rank === 3) return { icon: "🥉", color: "bg-orange-400", label: "3. místo" }
    if (rank <= 10) return { icon: "🏆", color: "bg-purple-500", label: `${rank}. místo` }
    return { icon: "⭐", color: "bg-blue-500", label: `${rank}. místo` }
  }

  if (loading || !stats) {
    return <div className="flex items-center justify-center p-8">Načítání...</div>
  }

  const rankBadge = rank ? getRankBadge(rank.rank) : null

  return (
    <div className="space-y-6">
      {/* Header with Rank */}
      <Card className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <Trophy className="w-10 h-10" />
                Motivační Dashboard
              </CardTitle>
              <CardDescription className="text-white/90 text-lg mt-2">
                Tvoje výkonnost a úspěchy
              </CardDescription>
            </div>
            {rankBadge && (
              <div className={`${rankBadge.color} rounded-full px-6 py-4 flex flex-col items-center`}>
                <span className="text-4xl mb-1">{rankBadge.icon}</span>
                <span className="text-sm font-bold text-white">{rankBadge.label}</span>
                <span className="text-xs text-white/80">z {rank?.total}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
              <Zap className="w-6 h-6 mb-2" />
              <p className="text-3xl font-bold">{stats.motivationPoints}</p>
              <p className="text-sm opacity-90">Motivační body</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
              <Award className="w-6 h-6 mb-2" />
              <p className="text-3xl font-bold">{stats.totalBadgesEarned}</p>
              <p className="text-sm opacity-90">Odznaky</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
              <Target className="w-6 h-6 mb-2" />
              <p className="text-3xl font-bold">{stats.achievements.filter(a => a.isCompleted).length}</p>
              <p className="text-sm opacity-90">Dokončené výzvy</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
              <TrendingUp className="w-6 h-6 mb-2" />
              <p className="text-3xl font-bold">{rank?.percentile.toFixed(0)}%</p>
              <p className="text-sm opacity-90">Percentil</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BookOpen className="w-4 h-4 mr-2" />
            Přehled
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Medal className="w-4 h-4 mr-2" />
            Odznaky
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Star className="w-4 h-4 mr-2" />
            Výzvy
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Crown className="w-4 h-4 mr-2" />
            Žebříček
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              label="Vytvořené joby"
              value={stats.totalJobsCreated}
              subtitle={`${stats.monthlyJobsCreated} tento měsíc`}
              color="blue"
            />
            <StatCard
              icon={<Target className="w-6 h-6" />}
              label="Dokončené joby"
              value={stats.totalJobsCompleted}
              subtitle={`${((stats.totalJobsCompleted / Math.max(stats.totalJobsCreated, 1)) * 100).toFixed(0)}% úspěšnost`}
              color="green"
            />
            <StatCard
              icon={<Zap className="w-6 h-6" />}
              label="Udělené XP"
              value={stats.totalXPAwarded.toLocaleString()}
              subtitle="Celkem všem studentům"
              color="purple"
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Pomoženo studentům"
              value={stats.totalStudentsHelped}
              subtitle="Unikátních studentů"
              color="orange"
            />
            <StatCard
              icon={<Flame className="w-6 h-6" />}
              label="Aktivní dny"
              value={stats.activeDaysCount}
              subtitle="Dní s aktivitou"
              color="red"
            />
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              label="Vytvořené eventy"
              value={stats.totalEventsCreated}
              subtitle={`${stats.totalEventParticipants} účastníků`}
              color="indigo"
            />
          </div>

          {/* Progress to Next Badge */}
          <Card>
            <CardHeader>
              <CardTitle>Tvůj pokrok</CardTitle>
              <CardDescription>Blížíš se k dalším milníkům</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressItem
                label="Job Master (100 jobů)"
                current={stats.totalJobsCreated}
                max={100}
                icon="🏆"
              />
              <ProgressItem
                label="Quest Architect (50 questů)"
                current={stats.totalQuestsCreated}
                max={50}
                icon="🎯"
              />
              <ProgressItem
                label="Event Organizer (20 eventů)"
                current={stats.totalEventsCreated}
                max={20}
                icon="🎉"
              />
              <ProgressItem
                label="Consistency Master (30 aktivních dní)"
                current={stats.activeDaysCount}
                max={30}
                icon="🔥"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.badges.length > 0 ? (
              stats.badges.map(badge => (
                <Card key={badge.id} className={`border-2 ${getRarityColor(badge.rarity)}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{badge.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{badge.title}</CardTitle>
                        <Badge variant="outline" className={getRarityColor(badge.rarity)}>
                          {badge.rarity}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Získáno {new Date(badge.earnedAt).toLocaleDateString("cs-CZ")}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-3 p-8 text-center">
                <Medal className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Zatím jsi nezískal žádné odznaky</p>
                <p className="text-sm text-gray-500">Pokračuj v tvorbě kvalitního obsahu!</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {stats.achievements.length > 0 ? (
            stats.achievements.map(achievement => (
              <Card key={achievement.id} className={achievement.isCompleted ? "bg-green-50 border-green-200" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {achievement.isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {achievement.name}
                      </CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </div>
                    <Badge variant={achievement.isCompleted ? "default" : "outline"}>
                      +{achievement.rewardPoints} bodů
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{achievement.progress} / {achievement.maxProgress}</span>
                      <span>{Math.floor((achievement.progress / achievement.maxProgress) * 100)}%</span>
                    </div>
                    <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                    {achievement.completedAt && (
                      <p className="text-xs text-gray-500">
                        Dokončeno {new Date(achievement.completedAt).toLocaleDateString("cs-CZ")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Star className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Žádné aktivní výzvy</p>
            </Card>
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Top 5 Učitelů
              </CardTitle>
              <CardDescription>Nejlepší pedagogové podle motivačních bodů</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry, index) => {
                  const badge = getRankBadge(index + 1)
                  return (
                    <div
                      key={entry.teacherId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.teacherId === teacherId ? "bg-purple-50 border-2 border-purple-300" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${badge.color} rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg`}>
                          {badge.icon}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {entry.teacherId === teacherId ? "TY" : `Učitel #${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {entry.totalJobsCreated} jobů • {entry.totalXPAwarded.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">{entry.motivationPoints}</p>
                        <p className="text-xs text-gray-500">bodů</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Motivational Quote */}
          <Card className="bg-linear-to-r from-purple-100 to-pink-100 border-purple-200">
            <CardContent className="p-6">
              <p className="text-lg italic text-center text-purple-900">
                "Nejlepší učitelé učí ze srdce, ne z knih."
              </p>
              <p className="text-sm text-center text-purple-600 mt-2">
                Pokračuj ve své skvělé práci! 🌟
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper Components
function StatCard({ icon, label, value, subtitle, color }: { icon: React.ReactNode; label: string; value: string | number; subtitle: string; color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200"
  }

  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-xs opacity-70 mt-1">{subtitle}</p>
          </div>
          <div className="opacity-50">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressItem({ label, current, max, icon }: any) {
  const percentage = Math.min((current / max) * 100, 100)
  const isComplete = current >= max

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <span>{icon}</span>
          {label}
        </span>
        <span className="text-sm text-gray-600">
          {current} / {max}
        </span>
      </div>
      <Progress value={percentage} className={isComplete ? "bg-green-200" : ""} />
      {isComplete && (
        <p className="text-xs text-green-600 font-medium">✨ Dokončeno!</p>
      )}
    </div>
  )
}

// Missing import
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
