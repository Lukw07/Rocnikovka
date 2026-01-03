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
      { icon: 'Home', label: 'Přehled', href: '/dashboard', section: 'Hlavní' },
      { icon: 'ListChecks', label: 'Správa úloh', href: '/dashboard/job-list', section: 'Výuka' },
      { icon: 'Users', label: 'Studenti', href: '/dashboard/students', section: 'Výuka' },
      { icon: 'Coins', label: 'Rozpočet', href: '/dashboard/budget', section: 'Správa' },
      { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings', section: 'Systém' },
    ]
  } else if (role === UserRole.OPERATOR) {
    menuItems = [
      { icon: 'Home', label: 'Přehled', href: '/dashboard', section: 'Hlavní' },
      // Teacher items for Operator
      { icon: 'ListChecks', label: 'Správa úloh', href: '/dashboard/job-list', section: 'Výuka' },
      { icon: 'Users', label: 'Studenti', href: '/dashboard/students', section: 'Výuka' },
      { icon: 'Coins', label: 'Rozpočet', href: '/dashboard/budget', section: 'Výuka' },
      // Management items
      { icon: 'Trophy', label: 'Úspěchy', href: '/dashboard/achievements', section: 'Správa', variant: 'operator' },
      { icon: 'Award', label: 'Odznaky', href: '/dashboard/badges', section: 'Správa', variant: 'operator' },
      { icon: 'ShoppingCart', label: 'Obchod', href: '/dashboard/admin/shop', section: 'Správa', variant: 'operator' },
      // Operator specific items
      { icon: 'Users', label: 'Správa uživatelů', href: '/dashboard/users', section: 'Admin', variant: 'operator' },
      { icon: 'Server', label: 'Systém', href: '/dashboard/system', section: 'Admin', variant: 'operator' },
      { icon: 'Database', label: 'Zálohy', href: '/dashboard/backups', section: 'Admin', variant: 'operator' },
      { icon: 'Activity', label: 'Logy', href: '/dashboard/activity', section: 'Admin', variant: 'operator' },
      { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings', section: 'Systém' },
    ]
  } else {
    // Student (Default)
    menuItems = [
      { icon: 'Home', label: 'Přehled', href: '/dashboard', section: 'Hlavní' },
      // Aktivity
      { icon: 'BookOpen', label: 'Předměty', href: '/dashboard/subjects', section: 'Aktivity' },
      { icon: 'Sword', label: 'Questy', href: '/dashboard/quests', section: 'Aktivity' },
      { icon: 'Calendar', label: 'Eventy', href: '/dashboard/events', section: 'Aktivity' },
      // Progression
      { icon: 'Trophy', label: 'Úspěchy', href: '/dashboard/achievements', section: 'Postup' },
      { icon: 'Award', label: 'Leaderboard', href: '/dashboard/leaderboard', section: 'Postup' },
      { icon: 'Award', label: 'Odznaky', href: '/dashboard/badges', section: 'Postup' },
      // Sociální
      { icon: 'Shield', label: 'Guildy', href: '/dashboard/guilds', section: 'Sociální' },
      { icon: 'Users', label: 'Přátelé', href: '/dashboard/friends', section: 'Sociální' },
      { icon: 'ArrowRightLeft', label: 'Obchody', href: '/dashboard/trading', section: 'Sociální' },
      // Inventář & Ekonomika
      { icon: 'Package', label: 'Inventář', href: '/dashboard/inventory', section: 'Inventář' },
      { icon: 'Wallet', label: 'Peněženka', href: '/dashboard/wallet', section: 'Inventář' },
      { icon: 'ShoppingCart', label: 'Obchod', href: '/dashboard/shop', section: 'Inventář' },
      { icon: 'Store', label: 'Marketplace', href: '/dashboard/marketplace', section: 'Inventář' },
      // Ostatní
      { icon: 'Home', label: 'Personal Space', href: '/dashboard/personal-space', section: 'Ostatní' },
      { icon: 'ListChecks', label: 'Seznam Úloh', href: '/dashboard/job-list', section: 'Ostatní' },
      { icon: 'FileText', label: 'Záznam', href: '/dashboard/log', section: 'Ostatní' },
      { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings', section: 'Ostatní' },
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
