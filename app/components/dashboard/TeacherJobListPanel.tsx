"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog"
import JobCreatePanel from "@/app/components/job-list/JobCreatePanel"
import { formatXP } from "@/app/lib/utils"
import { Plus, Briefcase, Users, CheckCircle2, Clock, XCircle, Edit, Sparkles, Coins, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Job {
  id: string
  title: string
  description: string
  xpReward: number
  moneyReward: number
  status: string
  subject: {
    name: string
  }
  assignments: Array<{
    id: string
    status: string
    student: {
      name: string
      email: string
    }
  }>
}

export function TeacherJobListPanel() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs")
      if (response.ok) {
        const jobsData = await response.json()
        setJobs(jobsData.data?.jobs || [])
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const approveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/jobs/assignments/${assignmentId}/approve`, {
        method: "POST"
      })
      
      if (response.ok) {
        fetchJobs()
        toast.success("Přihláška schválena", {
          description: "Student byl přiřazen k úkolu."
        })
      } else {
        throw new Error("Failed to approve assignment")
      }
    } catch (error) {
      console.error("Error approving assignment:", error)
      toast.error("Chyba", {
        description: "Nepodařilo se schválit přihlášku."
      })
    }
  }

  const completeJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/complete`, {
        method: "POST"
      })
      
      if (response.ok) {
        fetchJobs()
        toast.success("Úkol dokončen", {
          description: "Úkol byl označen jako dokončený."
        })
      } else {
        throw new Error("Failed to complete job")
      }
    } catch (error) {
      console.error("Error completing job:", error)
      toast.error("Chyba", {
        description: "Nepodařilo se dokončit úkol."
      })
    }
  }

  const handleCreateSuccess = async () => {
    setShowCreateModal(false)
    await fetchJobs()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-muted-foreground">Načítání úkolů…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <TabsList>
              <TabsTrigger value="active" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aktivní úkoly
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                <Clock className="w-4 h-4 mr-2" />
                Čekající schválení
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Dokončené
              </TabsTrigger>
            </TabsList>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all" 
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nový úkol
          </Button>
        </div>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.filter(job => job.status === "OPEN").map((job) => (
              <Card key={job.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{job.title}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mb-2 bg-blue-50 border-blue-200">
                      {job.subject.name}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-2 rounded-lg">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-700">{formatXP(job.xpReward)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-2 rounded-lg">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-amber-700">{job.moneyReward} Kč</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <Users className="w-4 h-4" />
                    <span>Přihlášení: <strong>{job.assignments.length}</strong> studentů</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Upravit
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => completeJob(job.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Dokončit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {jobs
              .filter(job => job.assignments.some(a => a.status === "APPLIED"))
              .map((job) => (
                <Card key={job.id} className="border-l-4 border-l-yellow-500 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>
                          <Badge variant="outline" className="mb-2 bg-yellow-50 border-yellow-200">
                            {job.subject.name}
                          </Badge>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Clock className="w-3 h-3 mr-1" />
                        {job.assignments.filter(a => a.status === "APPLIED").length} čekajících
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {job.assignments
                        .filter(a => a.status === "APPLIED")
                        .map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {assignment.student.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{assignment.student.name}</p>
                                <p className="text-sm text-gray-500">{assignment.student.email}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => approveAssignment(assignment.id)}
                                className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Schválit
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Odmítnout
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.filter(job => job.status === "CLOSED").map((job) => (
              <Card key={job.id} className="border-l-4 border-l-green-500 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    {job.title}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mb-2 bg-green-50 border-green-200">
                      {job.subject.name}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-2 rounded-lg">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-700">{formatXP(job.xpReward)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-2 rounded-lg">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-amber-700">{job.moneyReward} Kč</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">
                      Dokončeno: <strong>{job.assignments.filter(a => a.status === "COMPLETED").length}</strong> studentů
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vytvořit nový úkol</DialogTitle>
            <DialogDescription>Vyplňte informace a publikujte úkol pro studenty.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <JobCreatePanel onSuccess={handleCreateSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
