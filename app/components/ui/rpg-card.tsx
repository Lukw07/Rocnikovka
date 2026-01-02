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
          "border-[#d48068]/65 dark:border-[#d48068]/70 bg-gradient-to-br from-[#f6e6d8]/85 to-[#f4d7c8]/55 dark:from-[#3c211d]/60 dark:to-[#3e1f18]/45 shadow-[0_10px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.32)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.16)] dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.42)] hover:-translate-y-2 before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-[#f6e6d8]/80 before:via-[#d99c8c]/65 before:to-[#d73f19]/60 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:pointer-events-none after:shadow-inset after:from-[#d99c8c]/12 after:to-transparent",
        achievement:
          "border-[#4a2a24]/65 dark:border-[#4a2a24]/70 bg-gradient-to-br from-[#f4e1d2]/85 to-[#f6e6d8]/55 dark:from-[#3c211d]/60 dark:to-[#1b0a0b]/45 shadow-[0_10px_24px_rgba(0,0,0,0.14)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.36)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.48)] hover:-translate-y-2 before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-[#f4e1d2]/82 before:via-[#d99c8c]/68 before:to-[#d73f19]/58 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:pointer-events-none after:shadow-inset after:from-[#4a2a24]/18 after:to-transparent",
        inventory:
          "border-primary/55 dark:border-primary/70 bg-gradient-to-br from-primary/16 to-muted/30 dark:from-primary/22 dark:to-muted/18 shadow-[0_10px_22px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.32)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.16)] dark:hover:shadow-[0_14px_32px_rgba(0,0,0,0.42)] hover:-translate-y-2 backdrop-blur-sm before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-primary/75 before:via-accent/60 before:to-primary/72 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:pointer-events-none",
        glass:
          "backdrop-blur-xl bg-card/55 dark:bg-card/60 border-accent/45 dark:border-accent/55 shadow-[0_10px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.32)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.16)] dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.42)] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-accent/55 before:to-accent/55 before:pointer-events-none",
        elevated:
          "border-primary/55 dark:border-primary/70 shadow-[0_12px_28px_rgba(0,0,0,0.14)] dark:shadow-[0_14px_32px_rgba(0,0,0,0.36)] hover:shadow-[0_16px_34px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.48)] hover:-translate-y-2 before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-gradient-to-r before:from-primary/82 before:via-accent/62 before:to-primary/82 before:pointer-events-none",
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
