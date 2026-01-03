import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { MenuItem } from "@/app/components/ui/Sidebar"
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
      // Teacher items for Operator
      { icon: 'ListChecks', label: 'Správa úloh', href: '/dashboard/job-list' },
      { icon: 'Users', label: 'Studenti', href: '/dashboard/students' },
      { icon: 'Coins', label: 'Rozpočet', href: '/dashboard/budget' },
      // Management items
      { icon: 'Trophy', label: 'Úspěchy', href: '/dashboard/achievements', variant: 'operator' },
      { icon: 'Award', label: 'Odznaky', href: '/dashboard/badges', variant: 'operator' },
      { icon: 'ShoppingCart', label: 'Obchod', href: '/dashboard/admin/shop', variant: 'operator' },
      // Operator specific items
      { icon: 'Users', label: 'Správa uživatelů', href: '/dashboard/users', variant: 'operator' },
      { icon: 'Server', label: 'Systém', href: '/dashboard/system', variant: 'operator' },
      { icon: 'Database', label: 'Zálohy', href: '/dashboard/backups', variant: 'operator' },
      { icon: 'Activity', label: 'Logy', href: '/dashboard/activity', variant: 'operator' },
      { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings' },
    ]
  } else {
    // Student (Default)
    menuItems = [
      { icon: 'Home', label: 'Přehled', href: '/dashboard' },
      { icon: 'BookOpen', label: 'Předměty', href: '/dashboard/subjects' },
      { icon: 'Sword', label: 'Questy', href: '/dashboard/quests' },
      { icon: 'Calendar', label: 'Eventy', href: '/dashboard/events' },
      { icon: 'Trophy', label: 'Úspěchy', href: '/dashboard/achievements' },
      { icon: 'Award', label: 'Leaderboard', href: '/dashboard/leaderboard' },
      { icon: 'Award', label: 'Odznaky', href: '/dashboard/badges' },
      { icon: 'ListChecks', label: 'Seznam Úloh', href: '/dashboard/job-list' },
      { icon: 'Shield', label: 'Guildy', href: '/dashboard/guilds' },
      { icon: 'Users', label: 'Přátelé', href: '/dashboard/friends' },
      { icon: 'ArrowRightLeft', label: 'Obchody', href: '/dashboard/trading' },
      { icon: 'Home', label: 'Personal Space', href: '/dashboard/personal-space' },
      { icon: 'Wallet', label: 'Wallet', href: '/dashboard/wallet' },
      { icon: 'Package', label: 'Inventář', href: '/dashboard/inventory' },
      { icon: 'FileText', label: 'Záznam', href: '/dashboard/log' },
      { icon: 'ShoppingCart', label: 'Obchod', href: '/dashboard/shop' },
      { icon: 'Store', label: 'Marketplace', href: '/dashboard/marketplace' },
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
