"use client"

import { useState } from "react"
import V2SidebarLayout, { MenuItem } from "@/app/components/ui/V2sidebar"
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader"
import { UserRole } from "@/app/lib/generated"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: {
    name?: string | null
    role?: string | null
    image?: string | null
  }
  menuItems: MenuItem[]
}

export function DashboardLayoutClient({ children, user, menuItems }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - fixovaný nahoru */}
      <DashboardHeader 
        userName={user.name || "Uživateli"}
        userRole={user.role as UserRole}
        onMenuToggle={handleMenuToggle}
      />

      {/* Hlavní obsah - plná šířka */}
      <div className="w-full min-h-screen">
        <V2SidebarLayout 
          isMobileOpen={isMobileMenuOpen}
          onMobileToggle={handleMenuToggle}
          menuItems={menuItems}
        >
          {children}
        </V2SidebarLayout>
      </div>
    </div>
  )
}
