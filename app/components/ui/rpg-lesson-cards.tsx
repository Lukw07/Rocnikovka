import * as React from "react"
import { cn } from "@/app/lib/utils"
import { RpgCard, type RpgCardProps } from "@/app/components/ui/rpg-card"

/**
 * ClassCard - Karta pro třídu/předmět
 * Dvousloupcový layout: název vlevo, metadata vpravo
 */
const ClassCard = React.forwardRef<
  HTMLDivElement,
  RpgCardProps & { 
    title: string
    students?: number
    xp?: string
    date?: string
    duration?: string
  }
>(({ className, title, students, xp, date, duration, children, ...props }, ref) => (
  <RpgCard 
    ref={ref} 
    variant="default"
    padding="none"
    className="overflow-hidden"
    {...props}
  >
    <div className="flex items-center justify-between p-6 gap-6">
      <div className="flex-1 min-w-0">
        <h3 className="text-2xl font-cinzel font-bold text-foreground wrap-break-word">{title}</h3>
        {children}
      </div>
      <div className="flex flex-col gap-4 text-right shrink-0">
        {students !== undefined && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20H1v-2a6 6 0 016-6v0" />
            </svg>
            <span className="font-semibold text-foreground">{students}</span>
          </div>
        )}
        {xp && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold text-primary shrink-0">XP</div>
            <span className="font-semibold text-foreground">{xp}</span>
          </div>
        )}
        {date && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-foreground whitespace-nowrap">{date}</span>
          </div>
        )}
        {duration && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-foreground whitespace-nowrap">{duration}</span>
          </div>
        )}
      </div>
    </div>
  </RpgCard>
))
ClassCard.displayName = "ClassCard"

/**
 * LessonCard - Karta pro lekci
 * Jednoduchý layout s ikonou/číslem, názvem a detaily
 */
const LessonCard = React.forwardRef<
  HTMLDivElement,
  RpgCardProps & { 
    number?: string | number
    title: string
    teacher?: string
    date?: string
    duration?: string
    icon?: React.ReactNode
  }
>(({ className, number, title, teacher, date, duration, icon, children, ...props }, ref) => (
  <RpgCard 
    ref={ref} 
    variant="default"
    padding="none"
    {...props}
  >
    <div className="p-6 space-y-3">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-xl font-bold shrink-0">
            {icon}
          </div>
        ) : number && (
          <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary font-cinzel">{number}</span>
          </div>
        )}
        <h3 className="text-xl font-cinzel font-bold text-foreground">{title}</h3>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm">
        {teacher && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-muted-foreground">{teacher}</span>
          </div>
        )}
        {date && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-muted-foreground">{date}</span>
          </div>
        )}
        {duration && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-muted-foreground">{duration}</span>
          </div>
        )}
      </div>

      {children}
    </div>
  </RpgCard>
))
LessonCard.displayName = "LessonCard"

export { ClassCard, LessonCard }
