import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const rpgBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm border border-primary/20",
        secondary:
          "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border border-border",
        accent:
          "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-sm border border-accent/20",
        destructive:
          "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-sm border border-destructive/20",
        outline:
          "border-2 border-primary/40 bg-background/50 text-foreground hover:bg-primary/10",
        gold:
          "bg-gradient-to-br from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 text-white shadow-gold border border-amber-500/30",
        silver:
          "bg-gradient-to-br from-slate-300 to-slate-500 dark:from-slate-400 dark:to-slate-600 text-white shadow-sm border border-slate-400/30",
        bronze:
          "bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 text-white shadow-sm border border-orange-500/30",
        rare:
          "bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 text-white shadow-sm border border-blue-500/30",
        epic:
          "bg-gradient-to-br from-purple-500 to-purple-700 dark:from-purple-400 dark:to-purple-600 text-white shadow-sm border border-purple-500/30",
        legendary:
          "bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 dark:from-orange-400 dark:via-yellow-400 dark:to-orange-500 text-white shadow-gold border border-orange-500/30 animate-glow",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[10px] px-2 py-0.5 rounded-sm",
        lg: "text-sm px-3 py-1 rounded-lg",
      },
      glow: {
        true: "shadow-glow-primary",
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
