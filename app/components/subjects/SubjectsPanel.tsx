"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useSidebar } from "@/app/components/ui/V2sidebar"
import { Button } from "@/app/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useApi } from "@/app/hooks/use-api"
import { BookOpen, Trophy, Calendar, ChevronDown, ChevronUp, Sparkles } from "lucide-react"

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
  } | null
}

// Helper: human-friendly label for upcoming lesson (Dnes/Zítra/weekday/date)
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
    if (diffDays > 1 && diffDays < 7) return `${dayNames[thatDay.getDay()]}${timePart}`
    return `${thatDay.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}${timePart}`
  } catch {
    return date.toLocaleDateString('cs-CZ')
  }
}

export default function SubjectsPanel() {
  // Utility: Normalize subject id (remove all leading underscores)
  const normalizeId = (id: string) => id ? id.replace(/^_+/, "") : "";
  const { setSelectedPanel } = useSidebar()
  const { data, loading, error, execute } = useApi<{ success: boolean; data: any[] } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null)

  useEffect(() => {
    execute(async () => {
      const res = await fetch('/api/subjects?listOnly=true&withXP=true')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const result = await res.json()
      
      // Get full weekly timetable directly from Bakalari
      const timetableRes = await fetch('/api/subjects?bakalariOnly=true')
      let fullTimetable = null
      if (timetableRes.ok) {
        const timetableResult = await timetableRes.json()
        fullTimetable = timetableResult.data?.timetable
        
        // Debug: Log the timetable structure
        if (fullTimetable) {
          console.log('Timetable Days:', fullTimetable.Days?.length || 0)
          console.log('Timetable Subjects:', fullTimetable.Subjects?.length || 0)
          if (fullTimetable.Days) {
            fullTimetable.Days.forEach((day: any) => {
              console.log(`Day ${day.DayOfWeek} (${day.Abbrev}): ${day.Atoms?.length || 0} lessons`)
            })
          }
        }
      }
      
      return { ...result, fullTimetable }
    })
  }, [execute])

  // Transform the API response to match our SubjectItem type
  // Supports both database enrollments and Bakalari subjects
  const subjects: SubjectItem[] = React.useMemo(() => {
    if (!data?.data) return []
    
    const timetable = (data as any).fullTimetable
    const days = timetable?.Days || []
    const subjectLookup = timetable?.Subjects || []
    const roomLookup = timetable?.Rooms || []
    const hoursLookup = timetable?.Hours || []
    
    // Debug logging
    console.log('Processing timetable with', days.length, 'days')
    console.log('Subject lookup has', subjectLookup.length, 'subjects')
    console.log('Hours lookup has', hoursLookup.length, 'hours')
    if (hoursLookup.length > 0) {
      console.log('First hour:', JSON.stringify(hoursLookup[0], null, 2))
    }
    
    // Sudý/lichý týden
    const now = new Date()
    const currentWeekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1
    const isEvenWeek = currentWeekNumber % 2 === 0
    console.log('Current week:', currentWeekNumber, isEvenWeek ? 'Sudý' : 'Lichý')
    
    // helper: combine date and HH:mm string into a Date
    const combineDateAndTime = (baseDate: Date, timeStr: string): Date => {
      const d = new Date(baseDate)
      const parts = (timeStr ?? '00:00').split(':')
      const hhRaw = parts.length > 0 ? parts[0] : '0'
      const mmRaw = parts.length > 1 ? parts[1] : '0'
      const hh = Number.parseInt(hhRaw ?? '0', 10)
      const mm = Number.parseInt(mmRaw ?? '0', 10)
      const h = Number.isNaN(hh) ? 0 : hh
      const m = Number.isNaN(mm) ? 0 : mm
      d.setHours(h, m, 0, 0)
      return d
    }

    // Create map of next lessons by subject ID from all days (find next lesson from now onward)
    const nextLessons: Record<string, any> = {}
    if (Array.isArray(days)) {
  const now = new Date()
  let futureAtoms: Array<{ atom: any; dayDate: Date; dayName: string; lessonStart: Date }> = []
      days.forEach((day: any, dayIndex: number) => {
        const dayAtoms = day.Atoms || []
        const dayDate = day.Date ? new Date(day.Date) : null
        const dayOfWeek = dayDate ? dayDate.getDay() : day.DayOfWeek || 0
        const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
        const dayName = dayNames[dayOfWeek] || `Den ${dayOfWeek}`
        if (dayIndex === 0) {
          console.log('First day structure:', JSON.stringify(day, null, 2))
        }
        console.log(`Processing day ${dayOfWeek} (${dayName}): ${dayAtoms.length} lessons`)
        dayAtoms.forEach((atom: any) => {
          const atomSubjectIdRaw = atom.SubjectId || atom.subjectId;
          const atomSubjectId = normalizeId(atomSubjectIdRaw);
          if (!atomSubjectId) return;
          // Sudý/lichý týden kontrola
          const atomCycles = atom.CycleIds || [];
          let showAtom = true;
          if (atomCycles.length > 0) {
            const hasEven = atomCycles.includes('0');
            const hasOdd = atomCycles.includes('1');
            if (hasEven && hasOdd) {
              showAtom = true;
            } else if (hasEven) {
              showAtom = isEvenWeek;
            } else if (hasOdd) {
              showAtom = !isEvenWeek;
            } else {
              showAtom = false;
            }
          }
          if (!showAtom) return;
          // Compare by exact lesson start datetime (day date + hour BeginTime)
          const hour = hoursLookup.find((h: any) => h.Id === atom.HourId);
          const beginStr = hour?.BeginTime || hour?.Begin || '00:00'
          if (dayDate) {
            const lessonStart = combineDateAndTime(dayDate, beginStr)
            if (lessonStart >= now) {
              futureAtoms.push({ atom, dayDate, dayName, lessonStart })
            }
          }
        })
      })
      // For each subject, find the earliest future lesson
      futureAtoms.forEach(({ atom, dayDate, dayName, lessonStart }) => {
        const atomSubjectId = normalizeId(atom.SubjectId || atom.subjectId)
        const room = roomLookup.find((r: any) => r.Id === atom.RoomId);
        const hour = hoursLookup.find((h: any) => h.Id === atom.HourId);
        if (!nextLessons[atomSubjectId] || lessonStart < nextLessons[atomSubjectId].calculatedDate) {
          nextLessons[atomSubjectId] = {
            ...atom,
            calculatedDate: lessonStart,
            dayName,
            roomAbbrev: room?.Abbrev || room?.Name || '',
            hourBegin: hour?.BeginTime || hour?.Begin || '',
            hourEnd: hour?.EndTime || hour?.End || ''
          };
          console.log(`  Subject ${atomSubjectId}: Next lesson on ${dayName} ${lessonStart.toLocaleDateString('cs-CZ')} at ${hour?.BeginTime || '?'} (${isEvenWeek ? 'Sudý' : 'Lichý'} týden)`);
        }
      })
      // If no future lessons found, simulate next week by shifting all days forward by 7 days
      if (Object.keys(nextLessons).length === 0) {
        console.log('No future lessons found in current week, simulating next week...')
  let nextWeekAtoms: Array<{ atom: any; dayDate: Date; dayName: string; lessonStart: Date }> = []
        days.forEach((day: any, dayIndex: number) => {
          const dayAtoms = day.Atoms || []
          const dayDate = day.Date ? new Date(day.Date) : null
          const nextWeekDate = dayDate ? new Date(dayDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null
          const dayOfWeek = nextWeekDate ? nextWeekDate.getDay() : day.DayOfWeek || 0
          const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
          const dayName = dayNames[dayOfWeek] || `Den ${dayOfWeek}`
          dayAtoms.forEach((atom: any) => {
            const atomSubjectIdRaw = atom.SubjectId || atom.subjectId;
            const atomSubjectId = normalizeId(atomSubjectIdRaw);
            if (!atomSubjectId) return;
            // Sudý/lichý týden kontrola (flip parity for next week)
            const atomCycles = atom.CycleIds || [];
            let showAtom = true;
            if (atomCycles.length > 0) {
              const hasEven = atomCycles.includes('0');
              const hasOdd = atomCycles.includes('1');
              // Flip week parity for next week
              if (hasEven && hasOdd) {
                showAtom = true;
              } else if (hasEven) {
                showAtom = !isEvenWeek;
              } else if (hasOdd) {
                showAtom = isEvenWeek;
              } else {
                showAtom = false;
              }
            }
            if (!showAtom) return;
            if (nextWeekDate) {
              const hour = hoursLookup.find((h: any) => h.Id === atom.HourId);
              const beginStr = hour?.BeginTime || hour?.Begin || '00:00'
              const lessonStart = combineDateAndTime(nextWeekDate, beginStr)
              if (lessonStart >= now) {
                nextWeekAtoms.push({ atom, dayDate: nextWeekDate, dayName, lessonStart })
              }
            }
          })
        })
        nextWeekAtoms.forEach(({ atom, dayDate, dayName, lessonStart }) => {
          const atomSubjectId = normalizeId(atom.SubjectId || atom.subjectId)
          const room = roomLookup.find((r: any) => r.Id === atom.RoomId);
          const hour = hoursLookup.find((h: any) => h.Id === atom.HourId);
          if (!nextLessons[atomSubjectId] || lessonStart < nextLessons[atomSubjectId].calculatedDate) {
            nextLessons[atomSubjectId] = {
              ...atom,
              calculatedDate: lessonStart,
              dayName,
              roomAbbrev: room?.Abbrev || room?.Name || '',
              hourBegin: hour?.BeginTime || hour?.Begin || '',
              hourEnd: hour?.EndTime || hour?.End || ''
            };
            console.log(`  Subject ${atomSubjectId}: Next lesson (next week) on ${dayName} ${lessonStart.toLocaleDateString('cs-CZ')} at ${hour?.BeginTime || '?'} (${!isEvenWeek ? 'Sudý' : 'Lichý'} týden)`);
          }
        })
      }
    }

    console.log('Next lessons map:', Object.keys(nextLessons).length, 'subjects')
    console.log('Next lessons keys:', Object.keys(nextLessons));
    if (subjectLookup.length > 0) {
      console.log('Subject lookup IDs:', subjectLookup.map((s: any) => s.Id || s.id || s.SubjectId));
    }
    
    // Handle case where data is an object with timetable (new format)
    if (!Array.isArray(data.data) && (data.data as any).timetable) {
      return [] // Timetable format not suitable for subjects panel
    }
    
    // Handle case where data is not an array
    if (!Array.isArray(data.data)) {
      return []
    }
    
    const mapped: SubjectItem[] = data.data.map((item: any) => {
  let subjectId: string | null = null;
  let result: SubjectItem;
      // Check if it's a Bakalari subject (multiple possible field names)
      if (item.Abbrev || item.Name || item.abbrev || item.name || item.SubjectAbbrev || item.SubjectName) {
        subjectId = item.Id || item.id || item.SubjectId;
          console.log('Mapping Bakalari subject:', subjectId, item.Name || item.name || item.SubjectName);
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
        // Otherwise it's a database enrollment
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
      // Add next lesson info if available
      const subjectIdNorm = normalizeId(subjectId || "");
        console.log('Checking nextLesson for subjectIdNorm:', subjectIdNorm);
      if (subjectIdNorm && nextLessons[subjectIdNorm]) {
        const lesson = nextLessons[subjectIdNorm];
        result.nextLesson = {
          date: lesson.calculatedDate,
          time: lesson.hourBegin || '??:??',
          room: lesson.roomAbbrev || '??'
        };
        console.log(`Subject "${result.name}" (${subjectIdNorm}): Next lesson ${lesson.dayName} ${lesson.hourBegin} in room ${lesson.roomAbbrev}`);
      } else {
        console.log(`Subject "${result.name}" (${subjectIdNorm}): No next lesson found`);
      }
      return result;
    })

    // Sort by name (Czech locale, case-insensitive)
    return mapped.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs', { sensitivity: 'base' }))
  }, [data])

  // Calculate XP progress to next level
  const getXPProgress = (currentXP: number, level: number) => {
    const currentLevelXP = Math.pow(level, 2) * 100
    const nextLevelXP = Math.pow(level + 1, 2) * 100
    const xpInCurrentLevel = currentXP - currentLevelXP
    const xpNeededForLevel = nextLevelXP - currentLevelXP
    return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100))
  }

  // If a subject is selected, show detail panel
  if (selectedSubject) {
    return <SubjectDetailPanel subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full h-full p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Moje předměty
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Přehled všech předmětů, jejich progress a získané zkušenosti
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedPanel('dashboard')}
              className="self-start sm:self-auto"
            >
              Zpět na dashboard
            </Button>
          </div>

          {/* Stats Summary */}
          {!loading && subjects.length > 0 && (
            <div className="mt-6 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Celkem:</span>
                <span className="font-semibold">{subjects.length} předmětů</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">Celkové XP:</span>
                <span className="font-semibold">{subjects.reduce((sum, s) => sum + (s.subjectXP || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Načítám předměty...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <span className="text-lg">⚠️</span>
                <span className="font-medium">Chyba při načítání:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subjects Grid */}
        {!loading && !error && (
          <>
            {subjects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Žádné předměty</h3>
                  <p className="text-muted-foreground">
                    Momentálně nejste zapsán/a v žádném předmětu.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {subjects.map(s => {
                  const isOpen = expandedId === s.id
                  const xpProgress = s.subjectXP && s.subjectLevel ? getXPProgress(s.subjectXP, s.subjectLevel) : 0

                  return (
                    <Card 
                      key={s.id} 
                      className="group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer border-border/50 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl overflow-hidden"
                      onClick={() => setSelectedSubject(s)}
                    >
                      {/* Decorative gradient line */}
                      <div className="h-1 bg-gradient-to-r from-primary via-amber-500 to-violet-500" />
                      
                      <CardContent className="p-6">
                        <div className="flex items-start gap-5">
                          {/* Level Badge */}
                          <div className="relative flex-shrink-0">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-2 border-primary/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
                              <div className="text-center">
                                <div className="text-xs font-medium text-primary/70 uppercase tracking-wider">Level</div>
                                <div className="text-3xl font-black bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                                  {s.subjectLevel || 1}
                                </div>
                              </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-background flex items-center justify-center shadow-lg">
                              <Trophy className="h-4 w-4 text-white" />
                            </div>
                          </div>

                          {/* Subject Info */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <h3 className="font-bold text-xl leading-tight mb-2 group-hover:text-primary transition-colors">
                                {s.name}
                              </h3>
                              
                              {/* Metadata Grid */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Kód</div>
                                    <div className="font-semibold">{s.code}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-violet-500" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Další hodina</div>
                                    <div className="font-semibold">
                                      {s.nextLesson 
                                        ? formatNextLessonLabel(s.nextLesson.date, s.nextLesson.time)
                                        : 'Příští týden'
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* XP Progress */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground font-medium">
                                  {s.subjectXP?.toLocaleString() || 0} XP
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(xpProgress)}% do Level {(s.subjectLevel || 1) + 1}
                                </span>
                              </div>
                              <div className="relative">
                                <Progress value={xpProgress} className="h-2.5 bg-muted/50" />
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent rounded-full pointer-events-none" />
                              </div>
                            </div>

                            {/* Action Badge */}
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {s.code}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                <span>{isOpen ? 'Skrýt detaily' : 'Zobrazit detaily'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isOpen && (
                          <div className="mt-6 pt-6 border-t border-border/50 space-y-4 animate-in slide-in-from-top-3 duration-300">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                                  {s.subjectLevel || 1}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Level</div>
                              </div>
                              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                  {s.subjectXP?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">XP</div>
                              </div>
                              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/10">
                                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                  {Math.round(xpProgress)}%
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Progress</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <Button 
                                size="lg" 
                                variant="outline" 
                                className="h-12 font-semibold bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 border-primary/20 hover:border-primary/40"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Open jobs
                                }}
                              >
                                <Trophy className="h-4 w-4 mr-2" />
                                Zobrazit úkoly
                              </Button>
                              <Button 
                                size="lg" 
                                variant="outline" 
                                className="h-12 font-semibold bg-gradient-to-br from-violet-500/5 to-transparent hover:from-violet-500/10 border-violet-500/20 hover:border-violet-500/40"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Open schedule
                                }}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Rozvrh hodin
                              </Button>
                            </div>
                          </div>
                        )}
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

// Subject Detail Panel Component
function SubjectDetailPanel({ subject, onBack }: { subject: SubjectItem; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full h-full p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 -ml-2"
          >
            ← Zpět na předměty
          </Button>
          
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-2 border-primary/30 flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className="text-xs font-medium text-primary/70 uppercase tracking-wider">Level</div>
                <div className="text-4xl font-black bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  {subject.subjectLevel || 1}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{subject.name}</h1>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="font-mono">{subject.code}</Badge>
                {subject.nextLesson && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Další hodina: {formatNextLessonLabel(subject.nextLesson.date, subject.nextLesson.time)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            <TabsTrigger value="tasks">Úkoly</TabsTrigger>
            <TabsTrigger value="schedule">Rozvrh</TabsTrigger>
            <TabsTrigger value="grades">Známky</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{subject.subjectLevel || 1}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Celkové XP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{subject.subjectXP?.toLocaleString() || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pozice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">-</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Nastavení a informace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Zde budou detailní informace o předmětu...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Úkoly a úkoly</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Zde budou úkoly pro tento předmět...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Rozvrh hodin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Zde bude rozvrh pro tento předmět...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle>Známky a hodnocení</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Zde budou známky pro tento předmět...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
