"use client"

import { useState } from "react"
import { StudentDashboardModern } from "@/app/components/dashboard/StudentDashboardModern"
import V2SidebarLayout, { MenuItem } from "@/app/components/ui/V2sidebar"
import { TeacherDashboard } from "@/app/components/dashboard/TeacherDashboard"
import { OperatorDashboard } from "@/app/components/dashboard/OperatorDashboard"
import { UserRole } from "@/app/lib/generated"
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader"
import { 
  Home, 
  ListChecks, 
  Users, 
  Coins, 
  Settings, 
  Server, 
  Database, 
  Activity 
} from "lucide-react"

interface DashboardClientProps {
  user: {
    id: string
    name?: string | null
    role?: UserRole
    classId?: string | null
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const teacherMenuItems: MenuItem[] = [
    { icon: Home, label: 'Přehled', panel: 'dashboard' },
    { icon: ListChecks, label: 'Správa úloh', panel: 'job-list' },
    { icon: Users, label: 'Studenti', panel: 'students' },
    { icon: Coins, label: 'Rozpočet', panel: 'budget' },
    { icon: Settings, label: 'Nastavení', panel: 'settings' },
  ]

  const operatorMenuItems: MenuItem[] = [
    { icon: Home, label: 'Přehled', panel: 'dashboard' },
    { icon: Users, label: 'Uživatelé', panel: 'users' },
    { icon: Server, label: 'Systém', panel: 'system' },
    { icon: Database, label: 'Zálohy', panel: 'backups' },
    { icon: Activity, label: 'Logy', panel: 'activity' },
    { icon: Settings, label: 'Nastavení', panel: 'settings' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header - fixovaný nahoru */}
      <DashboardHeader 
        userName={user.name || "Uživateli"}
        userRole={user.role}
        onMenuToggle={handleMenuToggle}
      />

      {/* Hlavní obsah - plná šířka */}
      <div className="w-full min-h-screen">
        
        {/* Role-specific Dashboard */}
        {user.role === UserRole.STUDENT && user.id && (
          <div className="w-full">
            <V2SidebarLayout 
              isMobileOpen={isMobileMenuOpen}
              onMobileToggle={handleMenuToggle}
            >
              <div className="w-full p-4 md:p-6">
                <div className="text-xl sm:text-2xl font-semibold mb-4 md:mb-6">
                  Přeji krásný den, {user.name || "Uživateli"}!
                </div>
                <div className="w-full min-h-[calc(100vh-10rem)]">
                  <StudentDashboardModern 
                    userId={user.id} 
                    {...(user.classId && { classId: user.classId })}
                  />
                </div>
              </div>
            </V2SidebarLayout>
          </div>
        )}
        
        {user.role === UserRole.TEACHER && user.id && (
          <div className="w-full">
            <V2SidebarLayout 
              isMobileOpen={isMobileMenuOpen}
              onMobileToggle={handleMenuToggle}
              menuItems={teacherMenuItems}
            >
              <div className="w-full p-4 md:p-6">
                <div className="text-xl sm:text-2xl font-semibold mb-4 md:mb-6">
                  Přeji krásný den, {user.name || "Uživateli"}!
                </div>
                <div className="w-full min-h-[calc(100vh-10rem)]">
                  <TeacherDashboard userId={user.id} />
                </div>
              </div>
            </V2SidebarLayout>
          </div>
        )}
        
        {user.role === UserRole.OPERATOR && user.id && (
          <div className="w-full">
            <V2SidebarLayout 
              isMobileOpen={isMobileMenuOpen}
              onMobileToggle={handleMenuToggle}
              menuItems={operatorMenuItems}
            >
              <div className="w-full p-4 md:p-6">
                <div className="text-xl sm:text-2xl font-semibold mb-4 md:mb-6">
                  Přeji krásný den, {user.name || "Uživateli"}!
                </div>
                <div className="w-full min-h-[calc(100vh-10rem)]">
                  <OperatorDashboard userId={user.id} />
                </div>
              </div>
            </V2SidebarLayout>
          </div>
        )}
        
        {/* Fallback for unknown roles or missing user data */}
        {(!user.role || !user.id) && (
          <div className="w-full h-full p-4 md:p-6">
            <div className="text-center py-10 sm:py-12 h-full flex items-center justify-center">
              <p className="text-gray-500">Loading user information...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}