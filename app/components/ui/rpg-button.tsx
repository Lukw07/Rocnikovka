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
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-rpg hover:shadow-rpg-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-rpg-inner border border-primary/20",
        secondary:
          "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-rpg hover:shadow-rpg-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-rpg-inner border border-border",
        accent:
          "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-rpg hover:shadow-rpg-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-rpg-inner border border-accent/20",
        destructive:
          "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-rpg hover:shadow-rpg-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-rpg-inner border border-destructive/20",
        outline:
          "border-2 border-primary/40 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/60 hover:shadow-gold",
        ghost:
          "hover:bg-accent/10 hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        quest:
          "bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-500 dark:to-amber-600 text-white shadow-rpg hover:shadow-rpg-lg hover:-translate-y-0.5 active:translate-y-0 border border-amber-500/30 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-transparent before:to-white/10",
        achievement:
          "bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 text-white shadow-rpg hover:shadow-rpg-lg hover:-translate-y-0.5 active:translate-y-0 border border-purple-500/30 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-transparent before:to-white/10",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
      glow: {
        true: "hover:shadow-glow-primary",
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
