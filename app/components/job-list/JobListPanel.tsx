"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSidebar } from "@/app/components/ui/Sidebar"
import JobCreatePanel from "./JobCreatePanel"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { useApi, useApiMutation } from "@/app/hooks/use-api"
import { toast } from "sonner"
import { Briefcase, Coins, Sparkles, ChevronDown, ChevronUp, BookOpen, User, CheckCircle2, Clock, ArrowLeft, Loader2 } from "lucide-react"

interface Job {
  id: string
  title: string
  description: string
  xpReward: number
  moneyReward: number
  status: string
  subject?: { name?: string }
  teacher: { name: string }
  assignments: Array<{ id: string; status: string }>
}

export default function JobListPanel() {
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<{ jobs: Job[] }>()
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const { data: session } = useSession()

  const loadJobs = async () => {
    const res = await fetch('/api/jobs')
    if (!res.ok) throw new Error('Nepodařilo se načíst úlohy')
    const json = await res.json()
    return { jobs: json.data?.jobs || [] }
  }

  useEffect(() => {
    execute(loadJobs)
  }, [execute])

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
      // Trigger stats update
      fetch('/api/progression/stats').catch(() => {})
      
      execute(loadJobs)
      toast.success("Přihlášeno", {
        description: "Úspěšně jste se přihlásili k úkolu."
      })
      
      // Reload after short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    },
    onError: (err) => {
      toast.error("Chyba", {
        description: err.message || "Nepodařilo se přihlásit k úkolu"
      })
    }
  })

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Seznam úloh</h2>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-muted-foreground">Načítání úloh…</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Seznam úloh</h2>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-red-600 mb-4 font-medium">⚠️ Chyba: {error}</div>
              <Button onClick={() => execute(loadJobs)} variant="outline" className="border-red-300 hover:bg-red-100">
                Zkusit znovu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const jobs = data?.jobs || []
  const myJobs = jobs.filter(j => (j.assignments || []).length > 0)
  const availableJobs = jobs.filter(j => j.status === 'OPEN' && (j.assignments || []).length === 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Seznam úloh
            </h2>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setSelectedPanel('dashboard')}
            className="hover:bg-white/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>
        </div>

        {/* Show create panel for teachers/operators */}
        {(session?.user?.role === 'TEACHER' || session?.user?.role === 'OPERATOR') && (
          <div className="mb-6">
            <JobCreatePanel onSuccess={() => execute(loadJobs)} />
          </div>
        )}

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-800">Moje úkoly</h3>
          </div>
          {myJobs.length === 0 && (
            <Card className="border-dashed bg-white/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <div className="text-muted-foreground">Nemáte žádné aktivní úkoly.</div>
              </CardContent>
            </Card>
          )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myJobs.map(job => (
              <Card key={job.id} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <BookOpen className="w-3 h-3 text-gray-500" />
                        <CardDescription className="text-xs">{job.subject?.name || "Obecný úkol"}</CardDescription>
                        <span className="text-xs text-gray-400">•</span>
                        <User className="w-3 h-3 text-gray-500" />
                        <CardDescription className="text-xs">{job.teacher?.name}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
                      {job.assignments[0]?.status || job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-2">{job.description}</div>
                  {expandedJob === job.id && (
                    <div className="mt-4 pt-4 border-t space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">XP Odměna</span>
                        </div>
                        <span className="font-bold text-purple-600">{job.xpReward} XP</span>
                      </div>
                      <div className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Peníze</span>
                        </div>
                        <span className="font-bold text-amber-600">{job.moneyReward} Kč</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-3">
                        <p className="font-medium mb-1">Popis:</p>
                        <p>{job.description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setExpandedJob(prev => prev === job.id ? null : job.id)}
                    className="w-full hover:bg-blue-50 transition-colors"
                  >
                    {expandedJob === job.id ? (
                      <><ChevronUp className="w-4 h-4 mr-2" />Skrýt detaily</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 mr-2" />Zobrazit detaily</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Dostupné úkoly</h3>
          </div>
          {availableJobs.length === 0 && (
            <Card className="border-dashed bg-white/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <div className="text-muted-foreground">Momentálně nejsou žádné dostupné úkoly.</div>
              </CardContent>
            </Card>
          )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableJobs.map(job => (
              <Card key={job.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-blue-300 bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full -mr-16 -mt-16" />
                <CardHeader className="space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="border-2 border-blue-200 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          {job.subject?.name?.[0] || 'O'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <BookOpen className="w-3 h-3 text-gray-500" />
                          <CardDescription className="text-xs">{job.subject?.name || "Obecný úkol"}</CardDescription>
                          <span className="text-xs text-gray-400">•</span>
                          <User className="w-3 h-3 text-gray-500" />
                          <CardDescription className="text-xs">{job.teacher?.name}</CardDescription>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {job.xpReward} XP
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-2">{job.description}</div>
                  {expandedJob === job.id && (
                    <div className="mt-4 pt-4 border-t space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">XP Odměna</span>
                        </div>
                        <span className="font-bold text-purple-600">{job.xpReward} XP</span>
                      </div>
                      <div className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Peníze</span>
                        </div>
                        <span className="font-bold text-amber-600">{job.moneyReward} Kč</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-3">
                        <p className="font-medium mb-1">Podrobný popis:</p>
                        <p>{job.description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setExpandedJob(prev => prev === job.id ? null : job.id)}
                    className="flex-1 hover:bg-gray-100 transition-colors"
                  >
                    {expandedJob === job.id ? (
                      <><ChevronUp className="w-4 h-4 mr-1" />Skrýt</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 mr-1" />Detaily</>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => applyForJob({ jobId: job.id })} 
                    disabled={applying}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {applying ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Přihlašuji…</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" />Přihlásit se</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
