import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"
import { Loader2 } from "lucide-react"

const rpgButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary via-primary to-primary/90 text-primary-foreground shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-[0_10px_30px_rgba(177,142,255,0.4)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-md border-2 border-primary/30 dark:border-primary/50 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/25 before:via-transparent before:to-transparent dark:before:from-white/10 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1.5 after:bg-gradient-to-b after:from-white/40 after:via-transparent after:to-transparent dark:after:from-white/15 after:pointer-events-none",
        secondary:
          "bg-gradient-to-b from-secondary via-secondary to-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0.5 active:shadow-md border border-border/50 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/15 before:to-transparent dark:before:from-white/5 before:pointer-events-none",
        accent:
          "bg-gradient-to-b from-accent via-accent to-accent/90 text-accent-foreground shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-[0_10px_30px_rgba(0,230,255,0.4)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-md border-2 border-accent/30 dark:border-accent/50 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/25 before:to-transparent dark:before:from-white/10 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1.5 after:bg-gradient-to-b after:from-white/40 after:to-transparent dark:after:from-white/15 after:pointer-events-none",
        destructive:
          "bg-gradient-to-b from-destructive via-destructive to-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0.5 active:shadow-md border border-destructive/20 dark:border-destructive/30 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent dark:before:from-white/5 before:pointer-events-none",
        outline:
          "border-2 border-primary/50 dark:border-primary/70 bg-background/40 dark:bg-background/60 backdrop-blur-sm hover:bg-primary/15 dark:hover:bg-primary/20 hover:border-primary/70 dark:hover:border-primary/80 hover:shadow-gold hover:-translate-y-0.5 text-foreground transition-all duration-200 before:absolute before:inset-0 before:bg-gradient-to-t before:from-primary/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:pointer-events-none",
        ghost:
          "hover:bg-accent/15 dark:hover:bg-accent/20 hover:text-accent-foreground text-foreground hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        link:
          "text-primary dark:text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors",
        quest:
          "bg-gradient-to-b from-amber-600 via-amber-600 to-amber-700 dark:from-amber-500 dark:via-amber-500 dark:to-amber-700 text-white shadow-lg dark:shadow-[0_8px_16px_rgba(217,119,6,0.3)] hover:shadow-xl dark:hover:shadow-[0_12px_24px_rgba(217,119,6,0.4)] hover:-translate-y-1 active:translate-y-0.5 border border-amber-500/30 dark:border-amber-400/30 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-white/20 before:via-transparent before:to-transparent dark:before:from-white/10 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1 after:bg-gradient-to-b after:from-white/30 after:via-transparent after:to-transparent dark:after:from-white/10 after:pointer-events-none",
        achievement:
          "bg-gradient-to-b from-purple-600 via-purple-600 to-purple-700 dark:from-purple-500 dark:via-purple-500 dark:to-purple-700 text-white shadow-lg dark:shadow-[0_8px_16px_rgba(139,92,246,0.3)] hover:shadow-xl dark:hover:shadow-[0_12px_24px_rgba(139,92,246,0.4)] hover:-translate-y-1 active:translate-y-0.5 border border-purple-500/30 dark:border-purple-400/30 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-white/20 before:via-transparent before:to-transparent dark:before:from-white/10 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1 after:bg-gradient-to-b after:from-white/30 after:via-transparent after:to-transparent dark:after:from-white/10 after:pointer-events-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
      glow: {
        true: "hover:shadow-glow-primary dark:hover:shadow-[0_0_30px_rgba(177,142,255,0.6)]",
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

export interface RpgButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rpgButtonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const RpgButton = React.forwardRef<HTMLButtonElement, RpgButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    glow, 
    asChild = false, 
    loading = false,
    icon,
    iconPosition = "left",
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(rpgButtonVariants({ variant, size, glow, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin" />
        )}
        {!loading && icon && iconPosition === "left" && icon}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </Comp>
    )
  }
)
RpgButton.displayName = "RpgButton"

export { RpgButton, rpgButtonVariants }
