"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useSidebar } from "@/app/components/ui/Sidebar"
import { Button } from "@/app/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useApi } from "@/app/hooks/use-api"
import { 
  BookOpen, 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft,
  Zap,
  TrendingUp,
  Award
} from "lucide-react"

type SubjectItem = {
  id: string
  name: string
  code: string
  classId?: string | null
  className?: string | null
  enrolledAt?: string
  subjectXP?: number
  subjectLevel?: number
  nextLesson?: {
    date: Date
    time: string
    room?: string
    theme?: string | null
  } | null
}

// Helper functions
const formatNextLessonLabel = (date: Date, time?: string) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.round((thatDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
    const timePart = time ? ` v ${time}` : ''
    
    if (diffDays === 0) return `Dnes${timePart}`
    if (diffDays === 1) return `Zítra${timePart}`
    if (diffDays > 1 && diffDays <= 6) return `${dayNames[thatDay.getDay()]}${timePart}`
    
    // If it's 7 days or more away = next week or later
    if (diffDays >= 7 && diffDays <= 13) {
      return `Příští týden - ${dayNames[thatDay.getDay()]}${timePart}`
    }
    
    // More than 2 weeks away
    if (diffDays > 13) {
      return `${thatDay.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}${timePart}`
    }
    
    return `${thatDay.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}${timePart}`
  } catch {
    return date.toLocaleDateString('cs-CZ')
  }
}

const formatTimeUntilLesson = (date: Date, time?: string) => {
  try {
    const now = new Date()
    let lessonStart = new Date(date)
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      lessonStart.setHours(hours || 0, minutes || 0, 0, 0)
    }
    
    const diffMs = lessonStart.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 0) return 'Probíhá'
    if (diffMinutes < 60) return `za ${diffMinutes} min`
    if (diffHours < 24) return `za ${diffHours} h`
    if (diffDays === 1) return 'Zítra'
    if (diffDays >= 2 && diffDays <= 6) return `za ${diffDays} dny`
    
    // If it's 7+ days = next week or later
    if (diffDays >= 7 && diffDays <= 13) {
      return 'Příští týden'
    }
    
    // More than 2 weeks
    if (diffDays > 13) {
      const weeks = Math.floor(diffDays / 7)
      return `za ${weeks} týdnů`
    }
    
    return `za ${diffDays} dní`
  } catch {
    return ''
  }
}

const isLessonSoon = (date: Date, time?: string) => {
  try {
    const now = new Date()
    let lessonStart = new Date(date)
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      lessonStart.setHours(hours || 0, minutes || 0, 0, 0)
    }
    
    const diffMs = lessonStart.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    return diffMinutes > 0 && diffMinutes <= 60
  } catch {
    return false
  }
}

const isLessonNow = (date: Date, time?: string) => {
  try {
    const now = new Date()
    let lessonStart = new Date(date)
    let lessonEnd = new Date(date)
    
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      lessonStart.setHours(hours || 0, minutes || 0, 0, 0)
      lessonEnd.setHours(hours || 0, (minutes || 0) + 45, 0, 0)
    }
    
    return now >= lessonStart && now <= lessonEnd
  } catch {
    return false
  }
}

// Get absence count for a subject
const getAbsenceCount = (subjectName: string, absenceData: any): number => {
  if (!absenceData?.AbsencesPerSubject) return 0
  const subjectAbsence = absenceData.AbsencesPerSubject.find(
    (a: any) => a.SubjectName === subjectName
  )
  return subjectAbsence?.Base || 0
}

// Calculate red color intensity based on absence count
// 0 absences = no red, 5+ absences = full red
const getAbsenceBorderColor = (absenceCount: number): string => {
  if (absenceCount === 0) return 'border-transparent'
  
  // Progressive red intensity
  if (absenceCount === 1) return 'border-red-100'
  if (absenceCount === 2) return 'border-red-200'
  if (absenceCount === 3) return 'border-red-300'
  if (absenceCount === 4) return 'border-red-400'
  if (absenceCount >= 5) return 'border-red-500'
  
  return 'border-transparent'
}

// Get background color based on absence count
const getAbsenceBackgroundColor = (absenceCount: number): string => {
  if (absenceCount === 0) return 'bg-card'
  
  if (absenceCount === 1) return 'bg-red-50 dark:bg-red-950/30'
  if (absenceCount === 2) return 'bg-red-100 dark:bg-red-900/40'
  if (absenceCount === 3) return 'bg-red-100 dark:bg-red-900/50'
  if (absenceCount === 4) return 'bg-red-200 dark:bg-red-800/60'
  if (absenceCount >= 5) return 'bg-red-200 dark:bg-red-800/70'
  
  return 'bg-card'
}

// ISO week number calculation
const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Check if week number is even
const isWeekEven = (weekNumber: number): boolean => weekNumber % 2 === 0

export default function SubjectsPanel() {
  const normalizeId = (id: string) => id ? id.replace(/^_+/, "") : "";
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<{ success: boolean; data: any[] } | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [absenceData, setAbsenceData] = useState<any>(null)
  const [homeworksData, setHomeworksData] = useState<any>(null)

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/subjects?listOnly=true&withXP=true')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const result = await res.json()
      
      const timetableRes = await fetch('/api/subjects?bakalariOnly=true')
      let fullTimetable = null
      if (timetableRes.ok) {
        const timetableResult = await timetableRes.json()
        fullTimetable = timetableResult.data?.timetable
      }
      
      return { ...result, fullTimetable }
    })
  }, [execute])
  
  // Fetch absence data
  useEffect(() => {
    const fetchAbsence = async () => {
      try {
        const res = await fetch('/api/absence')
        if (res.ok) {
          const result = await res.json()
          setAbsenceData(result.data)
        }
      } catch (error) {
        console.error('Error fetching absence:', error)
      }
    }
    fetchAbsence()
  }, [])
  
  // Fetch homeworks data
  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
        const res = await fetch('/api/homeworks')
        if (res.ok) {
          const result = await res.json()
          console.log('[SubjectsPanel] Loaded', result.data?.Homeworks?.length || 0, 'homeworks')
          setHomeworksData(result.data)
        } else {
          const errorText = await res.text()
          console.error('[SubjectsPanel] Failed to fetch homeworks:', res.status, errorText)
        }
      } catch (error) {
        console.error('[SubjectsPanel] Error fetching homeworks:', error)
      }
    }
    fetchHomeworks()
  }, [])

  // Memoize homework counts per subject - computed only once when data changes
  const homeworkCounts = React.useMemo(() => {
    if (!homeworksData?.Homeworks) return {}
    
    console.log('[useMemo] Computing homework counts for', homeworksData.Homeworks.length, 'homeworks')
    
    const counts: Record<string, number> = {}
    homeworksData.Homeworks.forEach((hw: any) => {
      const subjectAbbrev = hw.Subject?.Abbrev
      if (subjectAbbrev && !hw.Finished) {
        counts[subjectAbbrev] = (counts[subjectAbbrev] || 0) + 1
      }
    })
    
    console.log('[useMemo] Homework counts computed:', counts)
    return counts
  }, [homeworksData])

  const subjects: SubjectItem[] = React.useMemo(() => {
    if (!data?.data) return []
    
    const timetable = (data as any).fullTimetable
    const days = timetable?.Days || []
    const roomLookup = timetable?.Rooms || []
    const hoursLookup = timetable?.Hours || []
    
    const now = new Date()
    const currentWeekNumber = getISOWeekNumber(now)
    
    const combineDateAndTime = (baseDate: Date, timeStr: string): Date => {
      const d = new Date(baseDate)
      const parts = (timeStr ?? '00:00').split(':')
      const hh = Number.parseInt(parts[0] ?? '0', 10)
      const mm = Number.parseInt(parts[1] ?? '0', 10)
      d.setHours(hh, mm, 0, 0)
      return d
    }

    const nextLessons: Record<string, any> = {}
    if (Array.isArray(days)) {
      let futureAtoms: Array<{ atom: any; dayDate: Date; lessonStart: Date; weekNumber: number; isEven: boolean }> = []
      
      days.forEach((day: any) => {
        const dayAtoms = day.Atoms || []
        const dayDate = day.Date ? new Date(day.Date) : null
        const dayWeekNumber = dayDate ? getISOWeekNumber(dayDate) : currentWeekNumber
        const isDayWeekEven = isWeekEven(dayWeekNumber)
        const isDayWeekOdd = !isDayWeekEven
        
        dayAtoms.forEach((atom: any) => {
          const atomSubjectId = normalizeId(atom.SubjectId || atom.subjectId);
          if (!atomSubjectId) return;

          const atomCycles = atom.CycleIds || [];
          let showAtom = true;
          if (atomCycles.length > 0) {
            const hasEven = atomCycles.includes('0');
            const hasOdd = atomCycles.includes('1');
            if (hasEven && hasOdd) {
              showAtom = true;
            } else if (hasEven) {
              showAtom = isDayWeekEven;
            } else if (hasOdd) {
              showAtom = isDayWeekOdd;
            } else {
              showAtom = false;
            }
          }
          if (!showAtom) return;

          const hour = hoursLookup.find((h: any) => h.Id === atom.HourId);
          const beginStr = hour?.BeginTime || hour?.Begin || '00:00'
          const endStr = hour?.EndTime || hour?.End || '23:59'
          
          if (dayDate) {
            const lessonStart = combineDateAndTime(dayDate, beginStr)
            const lessonEnd = combineDateAndTime(dayDate, endStr)
            if (lessonEnd > now) {
              futureAtoms.push({ atom, dayDate, lessonStart, weekNumber: dayWeekNumber, isEven: isDayWeekEven })
            }
          }
        })
      })

      futureAtoms.forEach(({ atom, dayDate, lessonStart }) => {
        const atomSubjectId = normalizeId(atom.SubjectId || atom.subjectId)
        const room = roomLookup.find((r: any) => r.Id === atom.RoomId);
        const hour = hoursLookup.find((h: any) => h.Id === atom.HourId);
        if (!nextLessons[atomSubjectId] || lessonStart < nextLessons[atomSubjectId].calculatedDate) {
          nextLessons[atomSubjectId] = {
            calculatedDate: lessonStart,
            roomAbbrev: room?.Abbrev || room?.Name || '',
            hourBegin: hour?.BeginTime || hour?.Begin || '',
            theme: atom.Theme || null,
          };
        }
      })
    }
    
    if (!Array.isArray(data.data)) return []
    
    const mapped: SubjectItem[] = data.data.map((item: any) => {
      let subjectId: string | null = null;
      let result: SubjectItem;

      if (item.Abbrev || item.Name || item.abbrev || item.name || item.SubjectAbbrev || item.SubjectName) {
        subjectId = item.Id || item.id || item.SubjectId;
        result = {
          id: subjectId || item.Abbrev || item.abbrev || String(Math.random()),
          name: item.Name || item.name || item.SubjectName || 'Neznámý předmět',
          code: item.Abbrev || item.abbrev || item.SubjectAbbrev || 'N/A',
          classId: null,
          className: null,
          enrolledAt: new Date().toISOString(),
          subjectXP: item.subjectXP,
          subjectLevel: item.subjectLevel,
          nextLesson: null
        };
      } else {
        subjectId = item.subject?.id;
        result = {
          id: item.subject?.id || item.id,
          name: item.subject?.name || 'Neznámý předmět',
          code: item.subject?.code || 'N/A',
          classId: item.class?.id || null,
          className: item.class?.name || null,
          enrolledAt: item.createdAt || new Date().toISOString(),
          subjectXP: item.subjectXP,
          subjectLevel: item.subjectLevel,
          nextLesson: null
        };
      }

      const subjectIdNorm = normalizeId(subjectId || "");
      if (subjectIdNorm && nextLessons[subjectIdNorm]) {
        const lesson = nextLessons[subjectIdNorm];
        result.nextLesson = {
          date: lesson.calculatedDate,
          time: lesson.hourBegin || '??:??',
          room: lesson.roomAbbrev || '??',
          theme: lesson.theme || null
        };
      }
      return result;
    })

    return mapped.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs', { sensitivity: 'base' }))
  }, [data])

  const getXPProgress = (currentXP: number, level: number) => {
    const currentLevelXP = Math.pow(level, 2) * 100
    const nextLevelXP = Math.pow(level + 1, 2) * 100
    const xpInCurrentLevel = currentXP - currentLevelXP
    const xpNeededForLevel = nextLevelXP - currentLevelXP
    return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100))
  }

  const filteredSubjects = subjects.filter(subject => {
    if (activeTab === "all") return true
    if (activeTab === "soon") return subject.nextLesson && isLessonSoon(subject.nextLesson.date, subject.nextLesson.time)
    if (activeTab === "now") return subject.nextLesson && isLessonNow(subject.nextLesson.date, subject.nextLesson.time)
    return true
  })

  if (selectedSubject) {
    return <SubjectDetailPanel subject={selectedSubject} homeworksData={homeworksData} onBack={() => setSelectedSubject(null)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full h-full p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Moje předměty
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Přehled všech předmětů a jejich progresu
              </p>
            </div>
            <Button 
              onClick={() => setSelectedPanel('dashboard')}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zpět na dashboard
            </Button>
          </div>

          {/* Stats Summary */}
          {!loading && subjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Celkem předmětů</p>
                    <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Celkové XP</p>
                    <p className="text-2xl font-bold text-foreground">{subjects.reduce((sum, s) => sum + (s.subjectXP || 0), 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Průměrný level</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(subjects.reduce((sum, s) => sum + (s.subjectLevel || 1), 0) / subjects.length * 10) / 10}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs for filtering */}
          {!loading && subjects.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="bg-card border p-1 rounded-lg">
                <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Všechny předměty
                </TabsTrigger>
                <TabsTrigger value="soon" className="rounded-md data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  Brzy začíná
                </TabsTrigger>
                <TabsTrigger value="now" className="rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Právě probíhá
                </TabsTrigger>
                <TabsTrigger value="schedule" className="rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Týdenní rozvrh
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div>
                <p className="text-muted-foreground font-medium">Načítám předměty</p>
                <p className="text-sm text-muted-foreground">Prosím počkejte...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5 max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-destructive text-xl">⚠️</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Chyba při načítání</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Zkusit znovu</Button>
            </CardContent>
          </Card>
        )}

        {/* Subjects Grid */}
        {!loading && !error && (
          <>
            {filteredSubjects.length === 0 ? (
              <Card className="text-center py-12 max-w-md mx-auto border-dashed">
                <CardContent>
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {activeTab === "all" ? "Žádné předměty" : "Žádné odpovídající předměty"}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTab === "all" 
                      ? "Momentálně nejste zapsán/a v žádném předmětu." 
                      : "Žádné předměty neodpovídají zvolenému filtru."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredSubjects.map(s => {
                  const xpProgress = s.subjectXP && s.subjectLevel ? getXPProgress(s.subjectXP, s.subjectLevel) : 0
                  const lessonSoon = s.nextLesson ? isLessonSoon(s.nextLesson.date, s.nextLesson.time) : false
                  const lessonNow = s.nextLesson ? isLessonNow(s.nextLesson.date, s.nextLesson.time) : false
                  
                  // Get absence data for this subject
                  const absenceCount = getAbsenceCount(s.name, absenceData)
                  const absenceBorder = getAbsenceBorderColor(absenceCount)
                  const absenceBackground = getAbsenceBackgroundColor(absenceCount)
                  
                  // Get homework count for this subject (from memoized counts)
                  const homeworkCount = homeworkCounts[s.code] || 0

                  return (
                    <Card 
                      key={s.id} 
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group border-2 ${
                        lessonNow 
                          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20' 
                          : lessonSoon 
                            ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20' 
                            : `${absenceBorder} ${absenceBackground} backdrop-blur-sm`
                      }`}
                      onClick={() => setSelectedSubject(s)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Level Badge */}
                          <div className="flex-shrink-0 relative">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${
                              lessonNow 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                                : lessonSoon 
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
                                  : 'bg-gradient-to-br from-primary to-purple-600 text-white'
                            }`}>
                              <div className="text-center">
                                <div className="text-xs font-bold opacity-90">LVL</div>
                                <div className="text-lg font-bold leading-5">{s.subjectLevel || 1}</div>
                              </div>
                            </div>
                            {lessonNow && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Zap className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Subject Info */}
                          <div className="flex-1 min-w-0 space-y-4">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                  {s.name}
                                </h3>
                                <Badge variant="secondary" className="flex-shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-200">
                                  {s.code}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {s.className && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{s.className}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Next Lesson Info */}
                            <div className={`rounded-lg p-3 border ${
                              !s.nextLesson
                                ? 'bg-muted/20 border-border'
                                : lessonNow 
                                  ? 'bg-green-100/50 border-green-200 dark:bg-green-900/20' 
                                  : lessonSoon 
                                    ? 'bg-amber-100/50 border-amber-200 dark:bg-amber-900/20' 
                                    : 'bg-muted/30 border-border'
                            }`}>
                              {s.nextLesson ? (
                                <>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className={`h-4 w-4 ${
                                        lessonNow ? 'text-green-600' : lessonSoon ? 'text-amber-600' : 'text-muted-foreground'
                                      }`} />
                                      <span className={`font-medium ${
                                        lessonNow ? 'text-green-700' : lessonSoon ? 'text-amber-700' : 'text-foreground'
                                      }`}>
                                        {lessonNow ? 'Právě probíhá' : lessonSoon ? 'Brzy začíná' : 'Další hodina'}
                                      </span>
                                    </div>
                                    <span className={`font-semibold ${
                                      lessonNow ? 'text-green-700' : lessonSoon ? 'text-amber-700' : 'text-foreground'
                                    }`}>
                                      {formatTimeUntilLesson(s.nextLesson.date, s.nextLesson.time)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {formatNextLessonLabel(s.nextLesson.date, s.nextLesson.time)}
                                    </span>
                                    {s.nextLesson.room && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span>{s.nextLesson.room}</span>
                                      </div>
                                    )}
                                  </div>
                                  {s.nextLesson.theme && (
                                    <div className="mt-2 text-sm">
                                      <span className="text-muted-foreground">Téma: </span>
                                      <span className="font-medium">{s.nextLesson.theme}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>Tento týden bez hodiny</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Homework Info */}
                            {homeworkCount > 0 && (
                              <div className="rounded-lg p-2 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
                                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                                  <BookOpen className="h-4 w-4" />
                                  <span className="font-medium">Úkoly: {homeworkCount}×</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Absence Info */}
                            {absenceCount > 0 && (
                              <div className="rounded-lg p-2 border border-red-200 bg-red-50/50 dark:bg-red-900/20">
                                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">Absence: {absenceCount}×</span>
                                </div>
                              </div>
                            )}

                            {/* XP Progress */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4 text-amber-500" />
                                  <span className="font-medium">{s.subjectXP?.toLocaleString() || 0} XP</span>
                                </div>
                                <span className="text-muted-foreground">
                                  {Math.round(xpProgress)}% do levelu {(s.subjectLevel || 1) + 1}
                                </span>
                              </div>
                              <Progress 
                                value={xpProgress} 
                                className={`h-2 ${
                                  lessonNow 
                                    ? '[&>div]:bg-green-500' 
                                    : lessonSoon 
                                      ? '[&>div]:bg-amber-500' 
                                      : '[&>div]:bg-gradient-to-r from-primary to-purple-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Enhanced Detail Panel with full page layout
function SubjectDetailPanel({ subject, homeworksData, onBack }: { subject: SubjectItem; homeworksData: any; onBack: () => void }) {
  const lessonSoon = subject.nextLesson ? isLessonSoon(subject.nextLesson.date, subject.nextLesson.time) : false
  const lessonNow = subject.nextLesson ? isLessonNow(subject.nextLesson.date, subject.nextLesson.time) : false
  
  // Filter homeworks for this subject
  const subjectHomeworks = React.useMemo(() => {
    if (!homeworksData?.Homeworks) return []
    
    console.log('[SubjectDetail] Filtering for subject:', subject.code)
    console.log('[SubjectDetail] Available homework Subject.Abbrevs:', 
      homeworksData.Homeworks.map((hw: any) => hw.Subject?.Abbrev))
    
    const filtered = homeworksData.Homeworks.filter(
      (hw: any) => hw.Subject?.Abbrev === subject.code
    )
    
    if (filtered.length > 0) {
      console.log('[SubjectDetail] Found', filtered.length, 'homework(s) for', subject.code)
    }
    
    return filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.DateEnd || a.DateStart)
      const dateB = new Date(b.DateEnd || b.DateStart)
      return dateA.getTime() - dateB.getTime()
    })
  }, [homeworksData, subject.code])
  
  // Calculate XP progress
  const getXPProgress = (currentXP: number, level: number) => {
    const currentLevelXP = Math.pow(level, 2) * 100
    const nextLevelXP = Math.pow(level + 1, 2) * 100
    const xpInCurrentLevel = currentXP - currentLevelXP
    const xpNeededForLevel = nextLevelXP - currentLevelXP
    return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100))
  }
  
  const xpProgress = subject.subjectXP && subject.subjectLevel ? 
    getXPProgress(subject.subjectXP, subject.subjectLevel) : 0
  
  // Calculate next level XP
  const nextLevelXP = subject.subjectLevel ? Math.pow(subject.subjectLevel + 1, 2) * 100 : 400
  const xpToNextLevel = nextLevelXP - (subject.subjectXP || 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full h-full p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6 -ml-2 gap-2 hover:bg-card backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na předměty
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className={`flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
              lessonNow 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : lessonSoon 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                  : 'bg-gradient-to-br from-primary to-purple-600'
            }`}>
              <div className="text-center text-foreground">
                <div className="text-sm font-bold opacity-90">LVL</div>
                <div className="text-2xl font-bold leading-6">{subject.subjectLevel || 1}</div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    {subject.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-base px-3 py-1 bg-blue-100 text-blue-700">
                      {subject.code}
                    </Badge>
                    {subject.className && (
                      <Badge variant="outline" className="flex items-center gap-1 text-base px-3 py-1">
                        <Users className="h-4 w-4" />
                        {subject.className}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-card backdrop-blur-sm rounded-xl p-3 border shadow-sm">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      <span className="font-bold text-lg">{subject.subjectXP?.toLocaleString() || 0}</span>
                      <span className="text-muted-foreground">XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Next Lesson Card */}
          <div className={`lg:col-span-2 rounded-2xl p-6 border-2 shadow-sm ${
            !subject.nextLesson
              ? 'bg-card backdrop-blur-sm border-border'
              : lessonNow 
                ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20' 
                : lessonSoon 
                  ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20' 
                  : 'bg-card backdrop-blur-sm border-border'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                !subject.nextLesson
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  : lessonNow 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30' 
                    : lessonSoon 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' 
                      : 'bg-primary/10 text-primary'
              }`}>
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex-1">
                {subject.nextLesson ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {lessonNow ? 'Právě probíhá' : lessonSoon ? 'Brzy začíná' : 'Další hodina'}
                      </h3>
                      <Badge className={
                        lessonNow ? 'bg-green-500' : lessonSoon ? 'bg-amber-500' : 'bg-primary'
                      }>
                        {formatTimeUntilLesson(subject.nextLesson.date, subject.nextLesson.time)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Čas</span>
                        </div>
                        <div className="font-medium">
                          {formatNextLessonLabel(subject.nextLesson.date, subject.nextLesson.time)}
                        </div>
                      </div>
                      {subject.nextLesson.room && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Místnost</span>
                          </div>
                          <div className="font-medium">{subject.nextLesson.room}</div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-lg mb-2 text-muted-foreground">
                      Příští hodina
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Tento týden nemáš hodinu tohoto předmětu</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pokrok
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Level {subject.subjectLevel || 1} → {subject.subjectLevel ? subject.subjectLevel + 1 : 2}</span>
                  <span className="font-medium">{Math.round(xpProgress)}%</span>
                </div>
                <Progress value={xpProgress} className="h-2 [&>div]:bg-gradient-to-r from-primary to-purple-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{subject.subjectLevel || 1}</div>
                  <div className="text-xs text-muted-foreground">Aktuální level</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{xpToNextLevel}</div>
                  <div className="text-xs text-muted-foreground">XP do dalšího levelu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs - Simplified */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full bg-card backdrop-blur-sm border p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              Přehled
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              Úkoly
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              Rozvrh
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-card backdrop-blur-sm border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Informace o předmětu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Kód předmětu</div>
                      <div className="font-medium text-lg">{subject.code}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Název</div>
                      <div className="font-medium text-lg">{subject.name}</div>
                    </div>
                    {subject.className && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Třída</div>
                        <div className="font-medium text-lg">{subject.className}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="bg-card backdrop-blur-sm border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Úkoly ({subjectHomeworks.length})
                </CardTitle>
                <CardDescription>
                  Přehled úkolů a termínů pro tento předmět
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subjectHomeworks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Zatím žádné úkoly</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Všechny úkoly jsou splněné nebo zatím nebyly zadány žádné nové úkoly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subjectHomeworks.map((hw: any) => {
                      const startDate = new Date(hw.DateStart)
                      const endDate = new Date(hw.DateEnd || hw.DateStart)
                      const now = new Date()
                      const isOverdue = endDate < now && !hw.Finished
                      const isDueSoon = !hw.Finished && endDate > now && (endDate.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000
                      
                      return (
                        <div 
                          key={hw.ID} 
                          className={`p-4 rounded-lg border-2 transition-all ${
                            hw.Finished 
                              ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10' 
                              : isOverdue 
                                ? 'bg-red-50/50 border-red-300 dark:bg-red-900/10' 
                                : isDueSoon 
                                  ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-900/10' 
                                  : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-lg">{hw.Content || 'Bez názvu'}</h4>
                                {hw.Finished && (
                                  <Badge className="bg-green-500">Hotovo</Badge>
                                )}
                                {isOverdue && !hw.Finished && (
                                  <Badge className="bg-red-500">Po termínu</Badge>
                                )}
                                {isDueSoon && !hw.Finished && (
                                  <Badge className="bg-amber-500">Brzy termín</Badge>
                                )}
                              </div>
                              {hw.Notice && (
                                <p className="text-sm text-muted-foreground mb-2">{hw.Notice}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Zadáno: {startDate.toLocaleDateString('cs-CZ')}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${
                              isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                            }`}>
                              <Clock className="h-4 w-4" />
                              <span>Termín: {endDate.toLocaleDateString('cs-CZ')}</span>
                            </div>
                          </div>
                          
                          {hw.Attachments && hw.Attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm text-muted-foreground mb-2">Přílohy:</div>
                              <div className="space-y-1">
                                {hw.Attachments.map((att: any, idx: number) => (
                                  <div key={idx} className="text-sm flex items-center gap-2">
                                    <BookOpen className="h-3 w-3" />
                                    <span>{att.Name || `Příloha ${idx + 1}`}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="bg-card backdrop-blur-sm border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Rozvrh hodin
                </CardTitle>
                <CardDescription>
                  Přehled hodin a rozvrhu pro tento předmět
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Rozvrh se připravuje</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Detailní rozvrh hodin pro tento předmět bude brzy dostupný.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}