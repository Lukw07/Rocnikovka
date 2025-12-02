"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog"
import JobCreatePanel from "@/app/components/job-list/JobCreatePanel"
import { formatXP } from "@/app/lib/utils"
import { Plus } from "lucide-react"
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
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="active">Aktivní úkoly</TabsTrigger>
            <TabsTrigger value="pending">Čekající schválení</TabsTrigger>
            <TabsTrigger value="completed">Dokončené</TabsTrigger>
          </TabsList>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nový úkol
          </Button>
        </div>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.filter(job => job.status === "OPEN").map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mb-2">
                      {job.subject.name}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">{job.description}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      {formatXP(job.xpReward)}
                    </span>
                    <span className="text-yellow-600 font-medium">
                      {job.moneyReward} Kč
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Přihlášení: {job.assignments.length} studentů
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      Upravit
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => completeJob(job.id)}
                    >
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
                <Card key={job.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mb-2">
                        {job.subject.name}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {job.assignments
                        .filter(a => a.status === "APPLIED")
                        .map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{assignment.student.name}</p>
                              <p className="text-sm text-gray-500">{assignment.student.email}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => approveAssignment(assignment.id)}
                              >
                                Schválit
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
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
              <Card key={job.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mb-2">
                      {job.subject.name}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">{job.description}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-600 font-medium">
                      {formatXP(job.xpReward)}
                    </span>
                    <span className="text-yellow-600 font-medium">
                      {job.moneyReward} Kč
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Dokončeno: {job.assignments.filter(a => a.status === "COMPLETED").length} studentů
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
