import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg border-b-4 border-primary/50 active:border-b-0 active:translate-y-1",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md border-b-4 border-destructive/50 active:border-b-0 active:translate-y-1",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md border-b-4 border-secondary/50 active:border-b-0 active:translate-y-1",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        rpg: "bg-gradient-to-b from-primary/80 to-primary text-primary-foreground border-2 border-primary-foreground/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_0_rgba(0,0,0,0.2)] hover:brightness-110 active:shadow-none active:translate-y-[4px] font-heading tracking-wide",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const RPGButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
RPGButton.displayName = "RPGButton"

export { RPGButton, buttonVariants }
