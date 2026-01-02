import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const rpgBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary via-primary to-primary/90 text-primary-foreground shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-[0_4px_12px_rgba(215,63,25,0.35)] border border-primary/25 dark:border-border/50 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/15 before:to-transparent dark:before:from-white/6 before:pointer-events-none",
        secondary:
          "bg-gradient-to-b from-secondary via-secondary to-secondary/90 text-secondary-foreground shadow-md hover:shadow-lg border border-border/50 dark:border-border/70 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/10 before:to-transparent dark:before:from-white/3 before:pointer-events-none",
        accent:
          "bg-gradient-to-b from-accent via-accent to-accent/90 text-accent-foreground shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-[0_4px_12px_rgba(215,63,25,0.32)] border border-accent/25 dark:border-accent/45 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/18 before:to-transparent dark:before:from-white/6 before:pointer-events-none",
        destructive:
          "bg-gradient-to-b from-destructive via-destructive to-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg border border-destructive/20 dark:border-destructive/30 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/15 before:to-transparent dark:before:from-white/5 before:pointer-events-none",
        outline:
          "border-2 border-primary/45 dark:border-border/60 bg-background/60 dark:bg-background/70 text-foreground hover:bg-primary/18 dark:hover:bg-primary/22 hover:border-primary/65 dark:hover:border-primary/70",
        gold:
          "bg-gradient-to-b from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 text-white shadow-gold dark:shadow-[0_4px_12px_rgba(217,119,6,0.4)] border border-amber-500/30 dark:border-amber-400/40 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent dark:before:from-white/10 before:pointer-events-none",
        silver:
          "bg-gradient-to-b from-slate-300 to-slate-500 dark:from-slate-400 dark:to-slate-600 text-white shadow-md dark:shadow-lg border border-slate-400/30 dark:border-slate-500/40 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent dark:before:from-white/10 before:pointer-events-none",
        bronze:
          "bg-gradient-to-b from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 text-white shadow-md dark:shadow-lg border border-orange-500/30 dark:border-orange-400/40 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent dark:before:from-white/10 before:pointer-events-none",
        rare:
          "bg-gradient-to-b from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 text-white shadow-md dark:shadow-lg border border-blue-500/30 dark:border-blue-400/40 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent dark:before:from-white/10 before:pointer-events-none",
        epic:
          "bg-gradient-to-b from-purple-500 to-purple-700 dark:from-purple-400 dark:to-purple-600 text-white shadow-md dark:shadow-lg border border-purple-500/30 dark:border-purple-400/40 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent dark:before:from-white/10 before:pointer-events-none",
        legendary:
          "bg-gradient-to-b from-orange-500 via-yellow-500 to-orange-600 dark:from-orange-400 dark:via-yellow-400 dark:to-orange-500 text-white shadow-gold dark:shadow-[0_4px_16px_rgba(217,119,6,0.5)] border border-orange-500/30 dark:border-orange-400/40 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/25 before:to-transparent dark:before:from-white/15 before:pointer-events-none hover:shadow-[0_6px_20px_rgba(217,119,6,0.6)] dark:hover:shadow-[0_8px_24px_rgba(217,119,6,0.6)]",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[10px] px-2 py-0.5 rounded-sm",
        lg: "text-sm px-3 py-1 rounded-lg",
      },
      glow: {
        true: "shadow-[0_0_12px_rgba(215,63,25,0.38)] dark:shadow-[0_0_16px_rgba(215,63,25,0.42)]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
    },
  }
)

export interface RpgBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof rpgBadgeVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const RpgBadge = React.forwardRef<HTMLDivElement, RpgBadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    glow, 
    icon,
    iconPosition = "left",
    children,
    ...props 
  }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(rpgBadgeVariants({ variant, size, glow }), className)} 
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="shrink-0">{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="shrink-0">{icon}</span>
        )}
      </div>
    )
  }
)
RpgBadge.displayName = "RpgBadge"

// Special badge variants for specific contexts
const LevelBadge = React.forwardRef<
  HTMLDivElement,
  Omit<RpgBadgeProps, "variant"> & { level: number }
>(({ level, className, ...props }, ref) => (
  <RpgBadge 
    ref={ref}
    variant="gold" 
    className={cn("font-bold", className)}
    {...props}
  >
    <span className="text-[10px]">LVL</span>
    <span>{level}</span>
  </RpgBadge>
))
LevelBadge.displayName = "LevelBadge"

const XpBadge = React.forwardRef<
  HTMLDivElement,
  Omit<RpgBadgeProps, "variant"> & { xp: number }
>(({ xp, className, ...props }, ref) => (
  <RpgBadge 
    ref={ref}
    variant="accent" 
    className={cn("font-semibold", className)}
    {...props}
  >
    <span className="text-amber-400">+{xp}</span>
    <span className="text-[10px]">XP</span>
  </RpgBadge>
))
XpBadge.displayName = "XpBadge"

const RarityBadge = React.forwardRef<
  HTMLDivElement,
  Omit<RpgBadgeProps, "variant"> & { 
    rarity: "common" | "rare" | "epic" | "legendary" 
  }
>(({ rarity, className, ...props }, ref) => {
  const variantMap = {
    common: "secondary" as const,
    rare: "rare" as const,
    epic: "epic" as const,
    legendary: "legendary" as const,
  }
  
  return (
    <RpgBadge 
      ref={ref}
      variant={variantMap[rarity]} 
      className={cn("uppercase tracking-wide font-bold", className)}
      {...props}
    >
      {rarity}
    </RpgBadge>
  )
})
RarityBadge.displayName = "RarityBadge"

const StatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<RpgBadgeProps, "variant"> & { 
    status: "active" | "completed" | "locked" | "failed"
  }
>(({ status, className, ...props }, ref) => {
  const statusConfig = {
    active: { variant: "accent" as const, label: "Aktivní", icon: "●" },
    completed: { variant: "default" as const, label: "Dokončeno", icon: "✓" },
    locked: { variant: "secondary" as const, label: "Uzamčeno", icon: "🔒" },
    failed: { variant: "destructive" as const, label: "Selhalo", icon: "✗" },
  }
  
  const config = statusConfig[status]
  
  return (
    <RpgBadge 
      ref={ref}
      variant={config.variant} 
      className={cn("font-medium", className)}
      {...props}
    >
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </RpgBadge>
  )
})
StatusBadge.displayName = "StatusBadge"

export { 
  RpgBadge, 
  LevelBadge, 
  XpBadge, 
  RarityBadge, 
  StatusBadge,
  rpgBadgeVariants,
}
