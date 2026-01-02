import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const rpgCardVariants = cva(
  "rounded-xl bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-1",
        quest:
          "border-2 border-amber-500/30 dark:border-amber-400/30 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 relative before:absolute before:inset-0 before:rounded-xl before:bg-texture-parchment before:opacity-30",
        achievement:
          "border-2 border-purple-500/30 dark:border-purple-400/30 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 relative before:absolute before:inset-0 before:rounded-xl before:bg-texture-parchment before:opacity-30",
        inventory:
          "border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30 backdrop-blur-sm hover:border-primary/40 hover:shadow-gold",
        glass:
          "backdrop-blur-md bg-card/60 border border-border/50 shadow-lg hover:bg-card/70",
        elevated:
          "border border-border shadow-rpg hover:shadow-rpg-lg hover:-translate-y-1",
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
