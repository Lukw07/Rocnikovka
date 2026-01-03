"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Label } from "@/app/components/ui/label"
import { useApi, useApiMutation } from "@/app/hooks/use-api"
import { toast } from "sonner"
import { Trophy, Coins, Zap, Star, Users, Calendar } from "lucide-react"
import { QuizMiniGame } from "./mini-games/QuizMiniGame"
import { MemoryMiniGame } from "./mini-games/MemoryMiniGame"
import { MathMiniGame } from "./mini-games/MathMiniGame"

interface Quest {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  questType: string
  requiredLevel: number
  xpReward: number
  moneyReward: number
  skillpointsReward: number
  reputationReward: number
  isRepeatable: boolean
  expiresAt?: string
  guildId?: string
  miniGameType?: string
  miniGameData?: any
  guild?: { name: string; level: number }
  userProgress?: {
    id: string
    status: string
    progress: number
    completedAt: string | null
    miniGameScore?: number
  }
}

const DIFFICULTY_CONFIG = {
  EASY: { color: '#10B981', icon: '⭐', label: 'Snadný' },
  MEDIUM: { color: '#F59E0B', icon: '⭐⭐', label: 'Střední' },
  HARD: { color: '#EF4444', icon: '⭐⭐⭐', label: 'Těžký' },
  LEGENDARY: { color: '#8B5CF6', icon: '⭐⭐⭐⭐', label: 'Legendární' }
}

const QUEST_TYPE_CONFIG = {
  STANDARD: { icon: '📋', label: 'Standardní' },
  MINI_GAME: { icon: '🎮', label: 'Mini hra' },
  GUILD: { icon: '🛡️', label: 'Guildový' },
  DAILY: { icon: '📅', label: 'Denní' },
  WEEKLY: { icon: '📆', label: 'Týdenní' },
  EVENT: { icon: '🎉', label: 'Event' }
}

export function QuestsListEnhanced() {
  const { data: session } = useSession()
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null)
  const [playingMiniGame, setPlayingMiniGame] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('available')

  const { data, loading, error, execute } = useApi<{ quests: Quest[] }>()

  const loadQuests = async () => {
    const params = new URLSearchParams()
    if (filterCategory !== 'all') params.append('category', filterCategory)
    if (filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)
    if (filterType !== 'all') params.append('questType', filterType)

    const res = await fetch(`/api/quests?${params.toString()}`)
    if (!res.ok) throw new Error('Nepodařilo se načíst questy')
    const json = await res.json()
    return { quests: json.data?.quests || [] }
  }

  useEffect(() => {
    execute(loadQuests)
  }, [filterCategory, filterDifficulty, filterType])

  const { mutate: acceptQuest, loading: accepting } = useApiMutation(
    async ({ questId }: { questId: string }) => {
      const resp = await fetch(`/api/quests/${questId}/accept`, { method: 'POST' })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.error?.message || 'Nepodařilo se přijmout quest')
      }
      return await resp.json()
    },
    {
      onSuccess: () => {
        toast.success("Quest přijat", { description: "Quest byl úspěšně přijat." })
        execute(loadQuests)
      },
      onError: (err) => {
        toast.error("Chyba", { description: err.message })
      }
    }
  )

  const { mutate: completeQuest } = useApiMutation(
    async ({ questId }: { questId: string }) => {
      const resp = await fetch(`/api/quests/${questId}/complete`, { method: 'POST' })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.error?.message || 'Nepodařilo se dokončit quest')
      }
      return await resp.json()
    },
    {
      onSuccess: () => {
        toast.success("Quest dokončen! 🎉", { description: "Získali jste odměnu!" })
        execute(loadQuests)
        setPlayingMiniGame(null)
      },
      onError: (err) => {
        toast.error("Chyba", { description: err.message })
      }
    }
  )

  const handleMiniGameComplete = async (questId: string, score: number) => {
    try {
      const resp = await fetch(`/api/quests/${questId}/minigame/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, gameData: { completedAt: new Date() } })
      })

      if (resp.ok) {
        toast.success("Mini hra dokončena!", { description: `Skóre: ${score}%` })
        execute(loadQuests)
        setPlayingMiniGame(null)
      }
    } catch (error) {
      toast.error("Chyba při ukládání výsledku")
    }
  }

  const getFilteredQuests = () => {
    const quests = data?.quests || []
    
    switch (filterStatus) {
      case 'available':
        return quests.filter(q => !q.userProgress || q.userProgress.status === 'ABANDONED')
      case 'in-progress':
        return quests.filter(q => q.userProgress && ['ACCEPTED', 'IN_PROGRESS'].includes(q.userProgress.status))
      case 'completed':
        return quests.filter(q => q.userProgress?.status === 'COMPLETED')
      default:
        return quests
    }
  }

  const filteredQuests = getFilteredQuests()

  if (loading) {
    return <div className="text-center p-8">Načítání questů...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny</SelectItem>
                  <SelectItem value="available">Dostupné</SelectItem>
                  <SelectItem value="in-progress">V průběhu</SelectItem>
                  <SelectItem value="completed">Dokončené</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Obtížnost</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny</SelectItem>
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Typ</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny</SelectItem>
                  {Object.entries(QUEST_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kategorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny</SelectItem>
                  <SelectItem value="Math">Matematika</SelectItem>
                  <SelectItem value="Science">Přírodověda</SelectItem>
                  <SelectItem value="Social">Společenské vědy</SelectItem>
                  <SelectItem value="Challenge">Výzva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredQuests.map((quest) => {
          const diffConfig = DIFFICULTY_CONFIG[quest.difficulty as keyof typeof DIFFICULTY_CONFIG]
          const typeConfig = QUEST_TYPE_CONFIG[quest.questType as keyof typeof QUEST_TYPE_CONFIG]
          const isExpanded = expandedQuest === quest.id
          const isPlayingGame = playingMiniGame === quest.id
          const hasProgress = quest.userProgress != null
          const progressValue = quest.userProgress?.progress ?? 0
          const isCompleted = quest.userProgress?.status === 'COMPLETED'

          // Render mini game if playing
          if (isPlayingGame && quest.miniGameType) {
            return (
              <div key={quest.id} className="lg:col-span-2">
                {quest.miniGameType === 'quiz' && quest.miniGameData?.questions && (
                  <QuizMiniGame
                    questId={quest.id}
                    questions={quest.miniGameData.questions}
                    onComplete={(score) => handleMiniGameComplete(quest.id, score)}
                  />
                )}
                {quest.miniGameType === 'memory' && quest.miniGameData?.pairs && (
                  <MemoryMiniGame
                    questId={quest.id}
                    pairs={quest.miniGameData.pairs}
                    onComplete={(score) => handleMiniGameComplete(quest.id, score)}
                  />
                )}
                {quest.miniGameType === 'math' && (
                  <MathMiniGame
                    questId={quest.id}
                    difficulty={quest.miniGameData?.difficulty || 'medium'}
                    problemCount={quest.miniGameData?.problemCount || 10}
                    onComplete={(score) => handleMiniGameComplete(quest.id, score)}
                  />
                )}
                <Button
                  variant="outline"
                  onClick={() => setPlayingMiniGame(null)}
                  className="mt-4"
                >
                  Zavřít hru
                </Button>
              </div>
            )
          }

          return (
            <Card key={quest.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge style={{ backgroundColor: diffConfig.color }}>
                      {diffConfig.icon} {diffConfig.label}
                    </Badge>
                    <Badge variant="outline">
                      {typeConfig.icon} {typeConfig.label}
                    </Badge>
                    {quest.guild && (
                      <Badge variant="secondary">
                        <Users className="w-3 h-3 mr-1" />
                        {quest.guild.name}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-600">
                        ✓ Dokončeno
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle>{quest.title}</CardTitle>
                <CardDescription>{quest.category}</CardDescription>
              </CardHeader>

              <CardContent>
                {hasProgress && progressValue < 100 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progres</span>
                      <span>{progressValue}%</span>
                    </div>
                    <Progress value={progressValue} />
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-4">
                    <p className="text-sm">{quest.description}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>{quest.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="w-4 h-4 text-green-500" />
                        <span>{quest.moneyReward} peněz</span>
                      </div>
                      {quest.skillpointsReward > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-purple-500" />
                          <span>{quest.skillpointsReward} SP</span>
                        </div>
                      )}
                      {quest.reputationReward !== 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-blue-500" />
                          <span>{quest.reputationReward} reputace</span>
                        </div>
                      )}
                    </div>

                    {quest.expiresAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Vyprší: {new Date(quest.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                >
                  {isExpanded ? 'Skrýt detail' : 'Zobrazit detail'}
                </Button>

                {!hasProgress && (
                  <Button
                    onClick={() => acceptQuest({ questId: quest.id })}
                    disabled={accepting}
                  >
                    Přijmout quest
                  </Button>
                )}

                {hasProgress && !isCompleted && quest.questType === 'MINI_GAME' && (
                  <Button onClick={() => setPlayingMiniGame(quest.id)}>
                    🎮 Hrát hru
                  </Button>
                )}

                {hasProgress && !isCompleted && quest.questType === 'STANDARD' && (
                  <Button onClick={() => completeQuest({ questId: quest.id })}>
                    Dokončit
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {filteredQuests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Nenalezeny žádné questy
          </CardContent>
        </Card>
      )}
    </div>
  )
}
