"use client"

import React, { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { formatXP, calculateLevel } from "@/app/lib/utils"
import { Sword, Trophy, Coins, Target, AlertCircle, Flame } from "lucide-react"
import { useApi, useApiMutation } from "@/app/hooks/use-api"

interface StudentOverviewProps {
  userId: string
  classId?: string
}

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
  teacher: {
    name: string
  }
  assignments: Array<{
    id: string
    status: string
  }>
}

interface DashboardData {
  jobs: Job[]
  totalXP: number
  streak: {
    currentStreak: number
    maxStreak: number
    currentMultiplier: number
    nextMilestone?: number
  }
}

export function StudentOverview({ userId, classId }: StudentOverviewProps) {
  const { data: dashboardData, loading, error, execute: fetchData } = useApi<DashboardData>()
  // --- Bakaláři API: Fetch today's subjects ---
  const [bakalariSubjects, setBakalariSubjects] = React.useState<any[]>([])
  const [bakalariLoading, setBakalariLoading] = React.useState(false)
  const [bakalariError, setBakalariError] = React.useState<string | null>(null)
  const [subjectMap, setSubjectMap] = React.useState<{
    subjects: Record<string, any>
    teachers: Record<string, any>
    rooms: Record<string, any>
  }>({ subjects: {}, teachers: {}, rooms: {} })
  const [currentTime, setCurrentTime] = React.useState(new Date())
  
  // Helper function to get ISO week number
  const getWeekNumber = React.useCallback((date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }, [])
  
  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  useEffect(() => {
      const fetchBakalariSubjects = async () => {
        setBakalariLoading(true)
        setBakalariError(null)
        try {
          const res = await fetch("/api/subjects?bakalariOnly=true")
          if (!res.ok) throw new Error("Nepodařilo se načíst předměty z Bakalářů")
          const data = await res.json()
          const timetable = data.data?.timetable
          
          if (!timetable || !timetable.Days) {
            setBakalariSubjects([])
            return
          }
          
          // Build subject name lookup map from Subjects array
          const subjectLookup: Record<string, any> = {}
          if (timetable.Subjects && Array.isArray(timetable.Subjects)) {
            timetable.Subjects.forEach((subj: any) => {
              subjectLookup[subj.Id] = subj
            })
          }
          
          // Build teacher lookup map
          const teacherLookup: Record<string, any> = {}
          if (timetable.Teachers && Array.isArray(timetable.Teachers)) {
            timetable.Teachers.forEach((teacher: any) => {
              teacherLookup[teacher.Id] = teacher
            })
          }
          
          // Build room lookup map
          const roomLookup: Record<string, any> = {}
          if (timetable.Rooms && Array.isArray(timetable.Rooms)) {
            timetable.Rooms.forEach((room: any) => {
              roomLookup[room.Id] = room
            })
          }
          
          setSubjectMap({
            subjects: subjectLookup,
            teachers: teacherLookup,
            rooms: roomLookup
          })
          
          // Determine current week cycle (odd/even)
          const currentDate = new Date()
          const weekNumber = getWeekNumber(currentDate)
          const isEvenWeek = weekNumber % 2 === 0
          
          // Find today's day in the Days array
          const today = currentDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          const todayData = timetable.Days.find((day: any) => day.DayOfWeek === today)
          
          if (!todayData || !todayData.Atoms) {
            setBakalariSubjects([])
            return
          }
          
          // Extract lessons from today's Atoms and filter by cycle
          let atoms = todayData.Atoms || []
          
          // Filter lessons by cycle - cycle 0 = even week, cycle 1 = odd week
          atoms = atoms.filter((lesson: any) => {
            if (!lesson.CycleIds || lesson.CycleIds.length === 0) {
              return true // No cycle restriction
            }
            
            // Check if lesson applies to current week
            const hasEven = lesson.CycleIds.includes('0') || lesson.CycleIds.includes(0)
            const hasOdd = lesson.CycleIds.includes('1') || lesson.CycleIds.includes(1)
            
            if (hasEven && hasOdd) {
              return true // Both weeks
            } else if (hasEven) {
              return isEvenWeek
            } else if (hasOdd) {
              return !isEvenWeek
            }
            return false
          })
          
          // Sort by HourId
          atoms.sort((a: any, b: any) => {
            return Number(a.HourId || 0) - Number(b.HourId || 0)
          })
          
          setBakalariSubjects(atoms)
          
        } catch (err: any) {
          setBakalariError(err.message || "Chyba při načítání Bakaláři předmětů")
        } finally {
          setBakalariLoading(false)
        }
      }
      
      // Initial fetch
      fetchBakalariSubjects()
    }, [getWeekNumber])
  
  const loadDashboard = async () => {
    const [jobsResponse, xpResponse, streakResponse] = await Promise.all([
      fetch("/api/jobs"),
      fetch("/api/xp/student"),
      fetch("/api/streak")
    ])

    if (!jobsResponse.ok || !xpResponse.ok || !streakResponse.ok) {
      throw new Error("Nepodařilo se načíst data dashboardu")
    }

    const jobsData = await jobsResponse.json()
    const xpData = await xpResponse.json()
    const streakData = await streakResponse.json()

    return {
      jobs: jobsData.data?.jobs || [],
      totalXP: xpData.totalXP || 0,
      streak: streakData.streak
    }
  }
  
  const { 
    mutate: applyForJob, 
    loading: applying, 
    error: applyError 
  } = useApiMutation<string, { jobId: string }>(
    async ({ jobId }) => {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST"
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Nepodařilo se přihlásit k úloze")
      }
      
      const result = await response.json()
      return result.assignment.id
    },
    {
      onSuccess: () => {
        // Obnovit data dashboardu po úspěšném přihlášení
        fetchData(loadDashboard)
      }
    }
  )

  useEffect(() => {
    fetchData(loadDashboard)
  }, [fetchData])

  const handleApplyForJob = (jobId: string) => {
    applyForJob({ jobId })
  }

  const levelData = calculateLevel(dashboardData?.totalXP || 0)
  const xpToNextLevel = (levelData.level + 1) * 100 - (dashboardData?.totalXP || 0)
  const xpProgress = levelData.progress

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítání dashboardu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chyba při načítání dashboardu</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchData} variant="outline">
                Zkusit znovu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableJobs = dashboardData?.jobs.filter(job => 
    job.status === "OPEN" && 
    !job.assignments.some(assignment => assignment.status === "APPLIED")
  ) || []

  const myApplications = dashboardData?.jobs.filter(job => 
    job.assignments.some(assignment => assignment.status === "APPLIED")
  ) || []

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Dnešní předměty z Bakalářů */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Dnešní rozvrh</CardTitle>
          <CardDescription>Tvůj rozvrh na dnešní den z Bakalářů</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {bakalariLoading ? (
            <div className="text-center text-muted-foreground">Načítání předmětů...</div>
          ) : bakalariError ? (
            <div className="text-center text-destructive">{bakalariError}</div>
          ) : bakalariSubjects.length === 0 ? (
            dashboardData?.jobs ? (
              <div className="grid gap-2">
                {/* Fallback: show subjects from DB enrollments */}
                {dashboardData.jobs.map((job, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{job.subject?.name || "Neznámý předmět"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">Dnes nemáš žádné předměty nebo se je nepodařilo načíst.</div>
            )
          ) : (
            <>
              {(() => {
                const currentHour = currentTime.getHours()
                const currentMinute = currentTime.getMinutes()
                const currentSecond = currentTime.getSeconds()
                const currentTimeInMinutes = currentHour * 60 + currentMinute
                
                // Lesson times - HourId is offset by +2 from actual lesson number
                // HourId 3 = 1st lesson (8:00), HourId 5 = 3rd lesson (10:00), etc.
                const lessonTimes = [
                  { id: 3, start: 8 * 60 + 0, end: 8 * 60 + 45, displayName: "1. hodina" },      // 8:00-8:45
                  { id: 4, start: 8 * 60 + 55, end: 9 * 60 + 40, displayName: "2. hodina" },     // 8:55-9:40
                  { id: 5, start: 9 * 60 + 50, end: 10 * 60 + 35, displayName: "3. hodina" },    // 9:50-10:35
                  { id: 6, start: 10 * 60 + 50, end: 11 * 60 + 35, displayName: "4. hodina" },   // 10:50-11:35
                  { id: 7, start: 11 * 60 + 45, end: 12 * 60 + 30, displayName: "5. hodina" },   // 11:45-12:30
                  { id: 8, start: 12 * 60 + 40, end: 13 * 60 + 25, displayName: "6. hodina" },   // 12:40-13:25
                  { id: 9, start: 13 * 60 + 35, end: 14 * 60 + 20, displayName: "7. hodina" },   // 13:35-14:20
                  { id: 10, start: 14 * 60 + 25, end: 15 * 60 + 10, displayName: "8. hodina" },   // 14:25-15:10
                  { id: 11, start: 15 * 60 + 15, end: 16 * 60 + 0, displayName: "9. hodina" },    // 15:15-16:00
                  { id: 12, start: 16 * 60 + 5, end: 16 * 60 + 50, displayName: "10. hodina" },  // 16:05-16:50
                ]
                
                // Find current lesson
                let currentLessonId = 0
                let currentLessonName = ""
                let isInBreak = false
                let breakEndsAt = 0
                let nextLessonAfterBreak = ""
                
                for (const lesson of lessonTimes) {
                  if (currentTimeInMinutes >= lesson.start && currentTimeInMinutes <= lesson.end) {
                    currentLessonId = lesson.id
                    currentLessonName = lesson.displayName
                    break
                  }
                }
                
                // Check if we're in a break
                if (currentLessonId === 0) {
                  for (let i = 0; i < lessonTimes.length - 1; i++) {
                    const currentLesson = lessonTimes[i]
                    const nextLesson = lessonTimes[i + 1]
                    
                    if (currentLesson && nextLesson && currentTimeInMinutes > currentLesson.end && currentTimeInMinutes < nextLesson.start) {
                      isInBreak = true
                      breakEndsAt = nextLesson.start
                      nextLessonAfterBreak = nextLesson.displayName
                      break
                    }
                  }
                }
                
                // Calculate remaining time for break
                let breakMinutesLeft = 0
                let breakSecondsLeft = 0
                if (isInBreak) {
                  const totalSecondsLeft = (breakEndsAt - currentTimeInMinutes) * 60 - currentSecond
                  breakMinutesLeft = Math.floor(totalSecondsLeft / 60)
                  breakSecondsLeft = totalSecondsLeft % 60
                }
                
                // Filter out past lessons
                const upcomingLessons = bakalariSubjects.filter((lesson: any) => {
                  const lessonTime = lessonTimes.find(t => t.id === lesson.HourId)
                  return lessonTime && currentTimeInMinutes <= lessonTime.end
                })
                
                // Find the first lesson of the day (lowest HourId in your schedule)
                const firstLessonId = upcomingLessons.length > 0 
                  ? Math.min(...upcomingLessons.map((l: any) => l.HourId))
                  : 0
                const firstLessonName = lessonTimes.find(l => l.id === firstLessonId)?.displayName || `${firstLessonId}. hodina`
                
                return (
                  <>
                    {currentLessonId > 0 ? (
                      <div className="mb-4">
                        <span className="text-sm font-semibold text-primary">
                          🎯 Aktuálně probíhá: {currentLessonName}
                        </span>
                      </div>
                    ) : isInBreak ? (
                      <div className="mb-4">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          ☕ Přestávka • Zbývá {breakMinutesLeft}:{breakSecondsLeft.toString().padStart(2, '0')} • Další: {nextLessonAfterBreak}
                        </span>
                      </div>
                    ) : upcomingLessons.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-muted-foreground">
                          ⏭️ Další hodina: {firstLessonName}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-4 py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">{upcomingLessons.map((lesson, idx) => {
                        const subject = subjectMap.subjects?.[lesson.SubjectId]
                        const teacher = subjectMap.teachers?.[lesson.TeacherId]
                        const room = subjectMap.rooms?.[lesson.RoomId]
                        const isCurrent = lesson.HourId === currentLessonId
                        const hasChange = lesson.Change !== null
                        
                        // Get subject display name with fallback to Change object
                        const getSubjectDisplayName = (lesson: any) => {
                          // First try normal subject lookup
                          if (subject?.Abbrev) {
                            return subject.Abbrev
                          }
                          
                          // If SubjectId is null, use Change object
                          if (!lesson.SubjectId && lesson.Change) {
                            const change = lesson.Change
                            
                            // Priority: TypeAbbrev -> TypeName -> Description
                            let changeText = change.TypeAbbrev || change.TypeName || change.Description || "???"
                            
                            // Truncate to first 4 characters
                            return changeText.substring(0, 4)
                          }
                          
                          return "???"
                        }
                        
                        // Get subject full name with fallback to Change object
                        const getSubjectFullName = (lesson: any) => {
                          // First try normal subject lookup
                          if (subject?.Name) {
                            return subject.Name
                          }
                          
                          // If SubjectId is null, use Change object
                          if (!lesson.SubjectId && lesson.Change) {
                            const change = lesson.Change
                            
                            // Priority: TypeName -> Description -> TypeAbbrev
                            return change.TypeName || change.Description || change.TypeAbbrev || "Neznámý předmět"
                          }
                          
                          return "Neznámý předmět"
                        }
                        
                        const subjectFullName = getSubjectFullName(lesson)
                        
                        // Calculate break time after this lesson
                        let breakMinutes = 0
                        if (idx < upcomingLessons.length - 1) {
                          const currentLessonTime = lessonTimes.find(l => l.id === lesson.HourId)
                          const nextLesson = upcomingLessons[idx + 1]
                          const nextLessonTime = lessonTimes.find(l => l.id === nextLesson.HourId)
                          
                          if (currentLessonTime && nextLessonTime) {
                            breakMinutes = nextLessonTime.start - currentLessonTime.end
                          }
                        }
                        
                        return (
                          <React.Fragment key={idx}>
                            <div
                              className={`shrink-0 p-5 rounded-2xl min-w-[180px] transition-all duration-300 ${
                                isCurrent 
                                  ? 'bg-linear-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-500 scale-100 ring-4 ring-green-500/20' 
                                  : hasChange 
                                  ? 'bg-linear-to-br from-red-500/20 to-orange-500/10 border-2 border-red-500 shadow-lg' 
                                  : 'bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg hover:scale-105'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                                  isCurrent 
                                    ? 'bg-green-500 text-white shadow-md' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {lessonTimes.find(l => l.id === lesson.HourId)?.displayName || `${lesson.HourId}. hodina`}
                                </div>
                                <div className="flex items-center gap-1">
                                  {room && (
                                    <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-semibold">
                                      {room.Abbrev || room.Name}
                                    </div>
                                  )}
                                  {hasChange && (
                                    <div className="text-xs bg-red-500 text-white px-2 py-1 rounded-md font-bold shadow-sm">
                                      ZMĚNA
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="font-bold text-xl mb-2">
                                {getSubjectDisplayName(lesson)}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                {getSubjectFullName(lesson)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-500">
                                {teacher && (
                                  <div className="flex items-center gap-1">
                                    <span>👤</span>
                                    <span className="truncate">{teacher.Abbrev || teacher.Name}</span>
                                  </div>
                                )}
                                {lesson.Theme && (
                                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="font-medium">Téma:</span> {lesson.Theme}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Break indicator */}
                            {breakMinutes > 0 && (
                              <div className="shrink-0 flex items-center justify-center w-[30px] h-[140px] mx-1">
                                <div className="flex flex-col items-center justify-center h-full bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800 px-1">
                                  <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 transform -rotate-90 whitespace-nowrap">
                                    ☕ {breakMinutes} min
                                  </div>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </div>
                    {upcomingLessons.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        Dnes už nemáš žádné další hodiny 🎉
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </CardContent>
      </Card>
      {/* Přehled XP a levelu */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové XP</CardTitle>
            <Sword className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatXP(dashboardData?.totalXP || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Level {levelData.level}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktuální streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.streak?.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">
              Max: {dashboardData?.streak?.maxStreak || 0} dní
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP do dalšího levelu</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatXP(xpToNextLevel)}</div>
            <Progress value={xpProgress * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivní přihlášky</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myApplications.length}</div>
            <p className="text-xs text-muted-foreground">
              Počet přihlášených úloh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Záložky s úlohami */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Dostupné úlohy</TabsTrigger>
          <TabsTrigger value="applications">Moje přihlášky</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Momentálně nejsou k dispozici žádné úlohy.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {availableJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {job.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{job.subject?.name || "Obecný úkol"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Sword className="h-4 w-4" />
                          <span>{formatXP(job.xpReward)} XP</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Coins className="h-4 w-4" />
                          <span>{job.moneyReward} mincí</span>
                        </div>
                        <span>od {job.teacher.name}</span>
                      </div>
                      <Button
                        onClick={() => handleApplyForJob(job.id)}
                        disabled={applying}
                        size="sm"
                      >
                        {applying ? "Přihlašuji..." : "Přihlásit se"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {myApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Zatím jste se nepřihlásili k žádné úloze.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myApplications.map((job) => {
                const myAssignment = job.assignments.find(assignment => assignment.status === "APPLIED")
                return (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {job.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Přihlášeno</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Sword className="h-4 w-4" />
                            <span>{formatXP(job.xpReward)} XP</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Coins className="h-4 w-4" />
                            <span>{job.moneyReward} mincí</span>
                          </div>
                          <span>od {job.teacher.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {myAssignment?.status === "APPLIED" ? "Přihlášeno" : "Neznámý"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {applyError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{applyError}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
