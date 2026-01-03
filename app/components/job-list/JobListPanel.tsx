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

interface Job {
  id: string
  title: string
  description: string
  xpReward: number
  moneyReward: number
  status: string
  subject: { name: string }
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
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Seznam úloh</h2>
        <div className="text-muted-foreground">Načítání úloh…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Seznam úloh</h2>
        <div className="text-destructive mb-4">Chyba: {error}</div>
        <Button onClick={() => execute(loadJobs)} variant="outline">Zkusit znovu</Button>
      </div>
    )
  }

  const jobs = data?.jobs || []
  const myJobs = jobs.filter(j => (j.assignments || []).length > 0)
  const availableJobs = jobs.filter(j => j.status === 'OPEN' && (j.assignments || []).length === 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Seznam úloh</h2>
        <div className="space-x-2">
          <Button size="sm" variant="ghost" onClick={() => setSelectedPanel('dashboard')}>Zpět</Button>
        </div>
      </div>

      {/* Show create panel for teachers/operators */}
      {(session?.user?.role === 'TEACHER' || session?.user?.role === 'OPERATOR') && (
        <div className="mb-6">
          <JobCreatePanel onSuccess={() => execute(loadJobs)} />
        </div>
      )}

      <section className="mb-6">
        <h3 className="text-lg font-medium mb-2">Moje úkoly</h3>
        {myJobs.length === 0 && <div className="text-muted-foreground">Nemáte žádné aktivní úkoly.</div>}
        <div className="grid grid-cols-1 gap-3">
          {myJobs.map(job => (
            <Card key={job.id}>
              <CardHeader className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{job.title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{job.subject?.name} — {job.teacher?.name}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{job.assignments[0]?.status || job.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3">{job.description}</div>
                {expandedJob === job.id && (
                  <div className="mt-3 text-sm">
                    <div>XP: {job.xpReward} • Peníze: {job.moneyReward}</div>
                    <div className="mt-2">Detaily: {job.description}</div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div>
                  <Button size="sm" variant="link" onClick={() => setExpandedJob(prev => prev === job.id ? null : job.id)}>
                    {expandedJob === job.id ? 'Skrýt detaily' : 'Zobrazit detaily'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Vytvořeno: {/* placeholder, server may provide createdAt */}</div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-medium mb-2">Dostupné úkoly</h3>
        {availableJobs.length === 0 && <div className="text-muted-foreground">Momentálně nejsou žádné dostupné úkoly.</div>}
        <div className="grid grid-cols-1 gap-3">
          {availableJobs.map(job => (
            <Card key={job.id}>
              <CardHeader className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{job.subject?.name?.[0] || 'S'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">{job.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">{job.subject?.name} — {job.teacher?.name}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">XP {job.xpReward}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3">{job.description}</div>
                {expandedJob === job.id && (
                  <div className="mt-3 text-sm">
                    <div>Peníze: {job.moneyReward}</div>
                    <div className="mt-2">Max studentů: {/* placeholder if available */}</div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div>
                  <Button size="sm" variant="link" onClick={() => setExpandedJob(prev => prev === job.id ? null : job.id)}>
                    {expandedJob === job.id ? 'Skrýt detaily' : 'Zobrazit detaily'}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={() => applyForJob({ jobId: job.id })} disabled={applying}>
                    {applying ? 'Přihlašování…' : 'Přihlásit se'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
