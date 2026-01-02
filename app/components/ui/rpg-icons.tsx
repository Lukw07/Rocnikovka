import * as React from "react"
import { cn } from "@/app/lib/utils"

// RPG Icon Wrapper - adds consistent styling to icons
export interface RpgIconProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "primary" | "secondary" | "accent" | "destructive" | "gold" | "silver" | "bronze"
  size?: "sm" | "md" | "lg" | "xl"
  glow?: boolean
}

const RpgIcon = React.forwardRef<HTMLDivElement, RpgIconProps>(
  ({ className, variant = "default", size = "md", glow = false, children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-muted text-foreground",
      primary: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
      secondary: "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground",
      accent: "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground",
      destructive: "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground",
      gold: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
      silver: "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
      bronze: "bg-gradient-to-br from-orange-400 to-orange-600 text-white",
    }

    const sizeClasses = {
      sm: "w-8 h-8 [&_svg]:w-4 [&_svg]:h-4",
      md: "w-10 h-10 [&_svg]:w-5 [&_svg]:h-5",
      lg: "w-12 h-12 [&_svg]:w-6 [&_svg]:h-6",
      xl: "w-16 h-16 [&_svg]:w-8 [&_svg]:h-8",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg flex items-center justify-center shadow-rpg border border-white/10",
          "transition-all duration-200 hover:scale-105",
          variantClasses[variant],
          sizeClasses[size],
          glow && "shadow-glow-primary",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
RpgIcon.displayName = "RpgIcon"

// Shield Icon Component
export const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

// Sword Icon Component
export const SwordIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="M13 19 8 14" />
    <path d="M16 16 19 19" />
    <path d="m19 19 2 2" />
    <path d="m21 21-2-2" />
  </svg>
)

// Scroll Icon Component
export const ScrollIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
    <path d="M12 20v2" />
    <path d="M12 14v2" />
    <path d="M12 8v2" />
    <path d="M12 2v2" />
  </svg>
)

// Crystal Icon Component
export const CrystalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </svg>
)

// Star Icon Component (for ratings/achievements)
export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

// Crown Icon Component (for achievements/VIP)
export const CrownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M2 20h20v2H2v-2zm1.84-5.91L2 18h20l-1.84-3.91-4.15-.87L12 16l-4.01-2.78-4.15.87z" />
    <circle cx="12" cy="6" r="2" />
    <circle cx="6" cy="9" r="2" />
    <circle cx="18" cy="9" r="2" />
  </svg>
)

// Coin Icon Component
export const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="m4.93 4.93 2.83 2.83" />
    <path d="m16.24 16.24 2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="m4.93 19.07 2.83-2.83" />
    <path d="m16.24 7.76 2.83-2.83" />
  </svg>
)

// Gem Icon Component
export const GemIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </svg>
)

// Potion Icon Component
export const PotionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 2v4" />
    <path d="M14 2v4" />
    <path d="M17 6h-1a3 3 0 0 0-2.83 2" />
    <path d="M7 6h1a3 3 0 0 1 2.83 2" />
    <path d="M7 12a5 5 0 0 0 10 0" />
    <path d="M18 12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8" />
  </svg>
)

// Chest Icon Component (for inventory/rewards)
export const ChestIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <path d="M12 11h.01" />
  </svg>
)

// Quest Icon Component
export const QuestIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M12 18v-6" />
    <path d="m9 15 3 3 3-3" />
  </svg>
)

// Book Icon Component (for learning/knowledge)
export const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

export { RpgIcon }
