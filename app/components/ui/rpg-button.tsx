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
          "bg-gradient-to-b from-primary via-primary to-primary/90 text-primary-foreground shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.55)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-md border-2 border-primary/40 dark:border-border/60 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/18 before:via-transparent before:to-transparent dark:before:from-white/10 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-2 after:bg-gradient-to-r after:from-[#f4e1d2]/65 after:via-[#d99c8c]/55 after:to-[#d73f19]/50 dark:after:from-white/12 dark:after:via-[#d99c8c]/35 dark:after:to-[#d73f19]/30 after:pointer-events-none",
        secondary:
          "bg-gradient-to-b from-secondary via-secondary to-secondary/92 text-secondary-foreground shadow-md hover:shadow-lg dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-sm border border-border/60 dark:border-border/70 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/14 before:to-transparent dark:before:from-white/6 before:pointer-events-none",
        accent:
          "bg-gradient-to-b from-accent via-accent to-accent/90 text-accent-foreground shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.38)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.48)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.52)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-md border-2 border-accent/35 dark:border-accent/55 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/22 before:to-transparent dark:before:from-white/12 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-2 after:bg-gradient-to-r after:from-[#f6e6d8]/65 after:via-[#d99c8c]/60 after:to-[#d73f19]/45 dark:after:from-white/12 dark:after:via-[#d99c8c]/38 dark:after:to-[#d73f19]/28 after:pointer-events-none",
        destructive:
          "bg-gradient-to-b from-destructive via-destructive to-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0.5 active:shadow-md border border-destructive/20 dark:border-destructive/30 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent dark:before:from-white/5 before:pointer-events-none",
        outline:
          "border-2 border-primary/45 dark:border-border/60 bg-background/50 dark:bg-background/60 backdrop-blur-sm hover:bg-primary/18 dark:hover:bg-primary/24 hover:border-primary/65 dark:hover:border-primary/70 hover:shadow-[0_10px_26px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.32)] hover:-translate-y-0.5 text-foreground transition-all duration-200 before:absolute before:inset-0 before:bg-gradient-to-t before:from-primary/12 before:to-transparent before:opacity-0 hover:before:opacity-100 before:pointer-events-none",
        ghost:
          "hover:bg-accent/14 dark:hover:bg-accent/18 hover:text-accent-foreground text-foreground hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200",
        link:
          "text-primary dark:text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors",
        quest:
          "bg-gradient-to-b from-[#d99c8c] via-[#d48068] to-[#d73f19] text-white shadow-lg dark:shadow-[0_10px_22px_rgba(0,0,0,0.38)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.46)] hover:-translate-y-1 active:translate-y-0.5 border border-[#d48068]/50 dark:border-[#d48068]/55 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-white/16 before:via-transparent before:to-transparent dark:before:from-white/10 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1.5 after:bg-gradient-to-r after:from-[#f6e6d8]/75 after:via-[#d99c8c]/60 after:to-[#d73f19]/55 dark:after:from-white/14 dark:after:via-[#d99c8c]/42 dark:after:to-[#d73f19]/30 after:pointer-events-none",
        achievement:
          "bg-gradient-to-b from-[#3c211d] via-[#4a2a24] to-[#d73f19] text-white shadow-lg dark:shadow-[0_10px_22px_rgba(0,0,0,0.4)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:translate-y-0.5 border border-[#4a2a24]/60 dark:border-[#4a2a24]/65 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-white/14 before:via-transparent before:to-transparent dark:before:from-white/10 before:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1.5 after:bg-gradient-to-r after:from-[#f4e1d2]/70 after:via-[#d99c8c]/58 after:to-[#d73f19]/50 dark:after:from-white/12 dark:after:via-[#d99c8c]/38 dark:after:to-[#d73f19]/30 after:pointer-events-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
      glow: {
        true: "hover:shadow-[0_0_18px_rgba(215,63,25,0.45)] dark:hover:shadow-[0_0_24px_rgba(215,63,25,0.5)]",
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
