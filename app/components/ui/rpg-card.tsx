import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const rpgCardVariants = cva(
  "rounded-lg bg-card text-card-foreground transition-all duration-300 relative overflow-hidden border-2",
  {
    variants: {
      variant: {
        default:
          "border-[#d9b9a3]/60 dark:border-white/8 shadow-[0_10px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.16)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] hover:-translate-y-2 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_22%_26%,rgba(217,156,140,0.22),transparent_46%),radial-gradient(circle_at_82%_18%,rgba(215,63,25,0.20),transparent_40%)] before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:border after:border-white/10 after:opacity-50 after:pointer-events-none",
        quest:
          "border-amber-500/60 dark:border-amber-400/70 bg-gradient-to-br from-amber-50/80 to-amber-50/40 dark:from-amber-950/40 dark:to-amber-950/20 shadow-lg dark:shadow-[0_8px_16px_rgba(251,191,36,0.15)] hover:shadow-xl dark:hover:shadow-[0_12px_24px_rgba(251,191,36,0.25)] hover:-translate-y-2 before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-amber-600/80 before:via-amber-500/80 before:to-amber-600/80 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:pointer-events-none after:shadow-inset after:from-amber-500/5 after:to-transparent",
        achievement:
          "border-purple-500/60 dark:border-purple-400/70 bg-gradient-to-br from-purple-50/80 to-purple-50/40 dark:from-purple-950/40 dark:to-purple-950/20 shadow-lg dark:shadow-[0_8px_16px_rgba(168,85,247,0.15)] hover:shadow-xl dark:hover:shadow-[0_12px_24px_rgba(168,85,247,0.25)] hover:-translate-y-2 before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-purple-600/80 before:via-purple-500/80 before:to-purple-600/80 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:pointer-events-none after:shadow-inset after:from-purple-500/5 after:to-transparent",
        inventory:
          "border-primary/60 dark:border-primary/80 bg-gradient-to-br from-primary/12 to-muted/30 dark:from-primary/20 dark:to-primary/10 shadow-lg dark:shadow-[0_8px_16px_rgba(177,142,255,0.15)] hover:shadow-xl dark:hover:shadow-[0_12px_24px_rgba(177,142,255,0.25)] hover:-translate-y-2 backdrop-blur-sm before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-primary/70 before:via-accent/60 before:to-primary/70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:pointer-events-none",
        glass:
          "backdrop-blur-xl bg-card/50 dark:bg-card/60 border-accent/40 dark:border-accent/60 shadow-lg dark:shadow-[0_8px_16px_rgba(0,230,255,0.1)] hover:shadow-xl dark:hover:shadow-[0_12px_24px_rgba(0,230,255,0.2)] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-accent/50 before:to-accent/50 before:pointer-events-none",
        elevated:
          "border-primary/50 dark:border-primary/70 shadow-xl dark:shadow-[0_12px_24px_rgba(177,142,255,0.2)] hover:shadow-2xl dark:hover:shadow-[0_16px_32px_rgba(177,142,255,0.3)] hover:-translate-y-2 before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-gradient-to-r before:from-primary/80 before:via-accent/60 before:to-primary/80 before:pointer-events-none",
      },
      padding: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
      glow: {
        true: "hover:shadow-glow-primary",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      glow: false,
    },
  }
)

export interface RpgCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof rpgCardVariants> {
  interactive?: boolean
}

const RpgCard = React.forwardRef<HTMLDivElement, RpgCardProps>(
  ({ className, variant, padding, glow, interactive = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        rpgCardVariants({ variant, padding, glow }),
        interactive && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
RpgCard.displayName = "RpgCard"

const RpgCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
RpgCardHeader.displayName = "RpgCardHeader"

const RpgCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-cinzel font-bold leading-none tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h3>
))
RpgCardTitle.displayName = "RpgCardTitle"

const RpgCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-inter", className)}
    {...props}
  />
))
RpgCardDescription.displayName = "RpgCardDescription"

const RpgCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
RpgCardContent.displayName = "RpgCardContent"

const RpgCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-0", className)}
    {...props}
  />
))
RpgCardFooter.displayName = "RpgCardFooter"

// Special card components for specific RPG contexts
const QuestCard = React.forwardRef<
  HTMLDivElement,
  Omit<RpgCardProps, "variant">
>(({ className, children, ...props }, ref) => (
  <RpgCard ref={ref} variant="quest" className={cn("relative", className)} {...props}>
    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
      <span className="text-white text-xs font-bold">!</span>
    </div>
    {children}
  </RpgCard>
))
QuestCard.displayName = "QuestCard"

const AchievementCard = React.forwardRef<
  HTMLDivElement,
  Omit<RpgCardProps, "variant"> & { unlocked?: boolean }
>(({ className, unlocked = false, children, ...props }, ref) => (
  <RpgCard 
    ref={ref} 
    variant="achievement" 
    className={cn(
      "relative",
      !unlocked && "opacity-60 grayscale",
      className
    )} 
    {...props}
  >
    {unlocked && (
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-white text-xs">✓</span>
      </div>
    )}
    {children}
  </RpgCard>
))
AchievementCard.displayName = "AchievementCard"

const InventorySlot = React.forwardRef<
  HTMLDivElement,
  Omit<RpgCardProps, "variant"> & { empty?: boolean }
>(({ className, empty = false, children, ...props }, ref) => (
  <RpgCard 
    ref={ref} 
    variant="inventory" 
    padding="sm"
    className={cn(
      "aspect-square flex items-center justify-center",
      empty && "opacity-40",
      className
    )} 
    {...props}
  >
    {empty ? (
      <div className="w-full h-full rounded-lg border-2 border-dashed border-border/50" />
    ) : (
      children
    )}
  </RpgCard>
))
InventorySlot.displayName = "InventorySlot"

export { 
  RpgCard, 
  RpgCardHeader, 
  RpgCardFooter, 
  RpgCardTitle, 
  RpgCardDescription, 
  RpgCardContent,
  QuestCard,
  AchievementCard,
  InventorySlot,
  rpgCardVariants,
}
