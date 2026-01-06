"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import { useApi, useApiMutation } from "@/app/hooks/use-api"
import { toast } from "sonner"
import { Users, Clock, Trophy, Coins, Zap, Star } from "lucide-react"

interface Job {
  id: string
  title: string
  description: string
  tier: string
  xpReward: number
  moneyReward: number
  skillpointsReward: number
  reputationReward: number
  status: string
  maxStudents: number
  isTeamJob: boolean
  requiredLevel: number
  estimatedHours?: number
  subject?: { name?: string }
  category?: { name: string; icon?: string; color?: string }
  teacher: { name: string }
  requiredSkill?: { name: string }
  requiredSkillLevel?: number
  assignments: Array<{ id: string; status: string }>
  _count: { assignments: number }
}

interface Category {
  id: string
  name: string
  icon?: string
}

const TIER_OPTIONS = [
  { value: 'BASIC', label: 'Základní', color: '#9CA3AF', icon: '⭐' },
  { value: 'INTERMEDIATE', label: 'Středně pokročilý', color: '#3B82F6', icon: '⭐⭐' },
  { value: 'ADVANCED', label: 'Pokročilý', color: '#8B5CF6', icon: '⭐⭐⭐' },
  { value: 'EXPERT', label: 'Expertní', color: '#F59E0B', icon: '⭐⭐⭐⭐' },
  { value: 'LEGENDARY', label: 'Legendární', color: '#EF4444', icon: '⭐⭐⭐⭐⭐' }
]

export default function JobListPanelEnhanced() {
  const { data: session } = useSession()
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [teamJobFilter, setTeamJobFilter] = useState<boolean | undefined>(undefined)

  const { data, loading, error, execute } = useApi<{ jobs: Job[] }>()
  const { data: categoriesData, execute: loadCategories } = useApi<{ categories: Category[] }>()

  const loadJobs = async () => {
    const params = new URLSearchParams()
    if (categoryFilter !== 'all') params.append('categoryId', categoryFilter)
    if (tierFilter !== 'all') params.append('tier', tierFilter)
    if (teamJobFilter !== undefined) params.append('isTeamJob', String(teamJobFilter))

    const res = await fetch(`/api/jobs?${params.toString()}`)
    if (!res.ok) throw new Error('Nepodařilo se načíst úlohy')
    const json = await res.json()
    return { jobs: json.data?.jobs || [] }
  }

  useEffect(() => {
    execute(loadJobs)
  }, [categoryFilter, tierFilter, teamJobFilter])

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/jobs/categories')
      if (!res.ok) throw new Error('Nepodařilo se načíst kategorie')
      const json = await res.json()
      return { categories: json.data?.categories || [] }
    }
    loadCategories(fetchCategories)
  }, [])

  const { mutate: applyForJob, loading: applying } = useApiMutation(async ({ jobId }: { jobId: string }) => {
    const resp = await fetch(`/api/jobs/${jobId}/apply`, { method: 'POST' })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error?.message || 'Nepodařilo se přihlásit k úloze')
    }
    const body = await resp.json()
    return body.data?.assignment
  }, {
    onSuccess: () => {
      toast.success("Přihláška odeslána", {
        description: "Váše přihláška byla úspěšně odeslána učiteli."
      })
      execute(loadJobs)
    },
    onError: (err) => {
      toast.error("Chyba", {
        description: err.message || "Nepodařilo se přihlásit"
      })
    }
  })

  const getTierInfo = (tier: string) => {
    return TIER_OPTIONS.find(t => t.value === tier) || TIER_OPTIONS[0]!
  }

  const canApply = (job: Job) => {
    if (session?.user?.role !== 'STUDENT') return false
    if (job.status !== 'OPEN') return false
    if (job.assignments.some(a => a.status !== 'REJECTED')) return false // Already applied
    if (job._count.assignments >= job.maxStudents) return false
    return true
  }

  const jobs = data?.jobs || []
  const categories = categoriesData?.categories || []

  return (
    <div className="space-y-4">
      {/* Filtry */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Kategorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny kategorie</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon && <span className="mr-2">{c.icon}</span>}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Obtížnost</Label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny obtížnosti</SelectItem>
                  {TIER_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={teamJobFilter === true} 
                  onCheckedChange={(checked) => setTeamJobFilter(checked ? true : undefined)} 
                />
                <Label>Pouze týmové úkoly</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seznam jobů */}
      {loading && <div className="text-center p-4">Načítám úlohy...</div>}
      {error && <div className="text-destructive p-4">Chyba při načítání</div>}

      <div className="grid grid-cols-1 gap-4">
        {jobs.map((job) => {
          const tierInfo = getTierInfo(job.tier)
          const isExpanded = expandedJob === job.id
          const hasApplied = job.assignments.length > 0
          const isFull = job._count.assignments >= job.maxStudents

          return (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {job.category && (
                        <Badge variant="outline" style={{ borderColor: job.category.color }}>
                          {job.category.icon} {job.category.name}
                        </Badge>
                      )}
                      <Badge style={{ backgroundColor: tierInfo.color }}>
                        {tierInfo.icon} {tierInfo.label}
                      </Badge>
                      {job.isTeamJob && (
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" /> Týmový
                        </Badge>
                      )}
                      {isFull && (
                        <Badge variant="destructive">Plný</Badge>
                      )}
                    </div>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>
                      {(job.subject?.name || "Obecný úkol")} • {job.teacher.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isExpanded && (
                  <div className="space-y-4 mb-4">
                    <p className="text-sm">{job.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>{job.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="w-4 h-4 text-green-500" />
                        <span>{job.moneyReward} peněz</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span>{job.skillpointsReward} SP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-blue-500" />
                        <span>{job.reputationReward} reputace</span>
                      </div>
                    </div>

                    {job.estimatedHours && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Odhadovaný čas: {job.estimatedHours}h</span>
                      </div>
                    )}

                    {job.requiredLevel > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Vyžaduje level {job.requiredLevel}
                      </div>
                    )}

                    {job.requiredSkill && (
                      <div className="text-sm text-muted-foreground">
                        Vyžaduje: {job.requiredSkill.name} (level {job.requiredSkillLevel})
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Přihlášených: {job._count.assignments} / {job.maxStudents}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                >
                  {isExpanded ? 'Skrýt detail' : 'Zobrazit detail'}
                </Button>

                {canApply(job) && (
                  <Button
                    onClick={() => applyForJob({ jobId: job.id })}
                    disabled={applying}
                  >
                    {applying ? 'Přihlašuji...' : 'Přihlásit se'}
                  </Button>
                )}

                {hasApplied && (
                  <Badge variant="secondary">Přihlášen</Badge>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {!loading && jobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Nenalezeny žádné úkoly odpovídající filtrům
          </CardContent>
        </Card>
      )}
    </div>
  )
}
