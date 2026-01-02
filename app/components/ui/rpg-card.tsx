import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const rpgCardVariants = cva(
  "rounded-xl bg-card text-card-foreground transition-all duration-300 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none",
        quest:
          "border-2 border-amber-500/40 dark:border-amber-400/40 bg-gradient-to-br from-amber-50/60 to-amber-50/20 dark:from-amber-950/30 dark:to-transparent relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-t before:from-amber-500/5 before:to-transparent before:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:shadow-inner after:from-amber-500/10 after:pointer-events-none",
        achievement:
          "border-2 border-purple-500/40 dark:border-purple-400/40 bg-gradient-to-br from-purple-50/60 to-purple-50/20 dark:from-purple-950/30 dark:to-transparent relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-t before:from-purple-500/5 before:to-transparent before:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:shadow-inner after:from-purple-500/10 after:pointer-events-none",
        inventory:
          "border-2 border-primary/30 dark:border-primary/50 bg-gradient-to-br from-primary/8 to-muted/20 dark:from-primary/15 dark:to-primary/5 backdrop-blur-sm hover:border-primary/50 dark:hover:border-primary/70 hover:shadow-gold relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/8 before:via-transparent before:to-transparent dark:before:from-white/3 before:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:shadow-inner after:pointer-events-none",
        glass:
          "backdrop-blur-xl bg-card/40 dark:bg-card/50 border border-border/50 dark:border-border/70 shadow-lg hover:bg-card/50 dark:hover:bg-card/60 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent dark:before:from-white/5 before:pointer-events-none",
        elevated:
          "border border-border shadow-rpg dark:shadow-rpg-lg hover:shadow-rpg-lg dark:hover:shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:-translate-y-1 relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent dark:before:from-white/3 before:pointer-events-none after:absolute after:-inset-0.5 after:bg-gradient-to-br after:from-primary/20 after:to-accent/10 after:rounded-xl after:-z-10 dark:after:from-primary/10 dark:after:to-accent/5",
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
