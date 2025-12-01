import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { MenuItem } from "@/app/components/ui/V2sidebar"
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader"
import { DashboardLayoutClient } from "@/app/components/dashboard/DashboardLayoutClient"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const role = session.user.role as UserRole
  let menuItems: MenuItem[] = []

  if (role === UserRole.TEACHER) {
    menuItems = [
      { icon: 'Home', label: 'Přehled', href: '/dashboard' },
      { icon: 'ListChecks', label: 'Správa úloh', href: '/dashboard/job-list' },
      { icon: 'Users', label: 'Studenti', href: '/dashboard/students' },
      { icon: 'Coins', label: 'Rozpočet', href: '/dashboard/budget' },
      { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings' },
    ]
  } else if (role === UserRole.OPERATOR) {
    menuItems = [
      { icon: 'Home', label: 'Přehled', href: '/dashboard' },
      { icon: 'Users', label: 'Uživatelé', href: '/dashboard/users' },
      { icon: 'Server', label: 'Systém', href: '/dashboard/system' },
      { icon: 'Database', label: 'Zálohy', href: '/dashboard/backups' },
      { icon: 'Activity', label: 'Logy', href: '/dashboard/activity' },
      { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings' },
    ]
  } else {
    // Student (Default)
    menuItems = [
      { icon: 'Home', label: 'Přehled', href: '/dashboard' },
      { icon: 'BookOpen', label: 'Předměty', href: '/dashboard/subjects' },
      { icon: 'Trophy', label: 'Úspěchy', href: '/dashboard/achievements' },
      { icon: 'Award', label: 'Leaderboard', href: '/dashboard/leaderboard' },
      { icon: 'Award', label: 'Odznaky', href: '/dashboard/badges' },
      { icon: 'ListChecks', label: 'Seznam Úloh', href: '/dashboard/job-list' },
      { icon: 'FileText', label: 'Záznam', href: '/dashboard/log' },
      { icon: 'ShoppingCart', label: 'Obchod', href: '/dashboard/shop' },
      { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings' },
    ]
  }

  return (
    <DashboardLayoutClient 
      user={session.user} 
      menuItems={menuItems}
    >
      {children}
    </DashboardLayoutClient>
  )
}
