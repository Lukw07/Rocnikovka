import * as React from "react"
import { cn } from "@/lib/utils"

const RPGCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rpg-card rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
RPGCard.displayName = "RPGCard"

const RPGCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b border-border/50", className)}
    {...props}
  />
))
RPGCardHeader.displayName = "RPGCardHeader"

const RPGCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight font-heading text-primary",
      className
    )}
    {...props}
  />
))
RPGCardTitle.displayName = "RPGCardTitle"

const RPGCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
RPGCardDescription.displayName = "RPGCardDescription"

const RPGCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-6", className)} {...props} />
))
RPGCardContent.displayName = "RPGCardContent"

const RPGCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
RPGCardFooter.displayName = "RPGCardFooter"

export { RPGCard, RPGCardHeader, RPGCardFooter, RPGCardTitle, RPGCardDescription, RPGCardContent }
