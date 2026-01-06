"use client"

import { useState, useEffect } from "react"
import SidebarLayout, { MenuItem } from "@/app/components/ui/Sidebar"
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader"
import { UserRole } from "@/app/lib/generated"
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import { Shield } from "lucide-react"
import { PolicyModal } from "@/app/components/shared/PolicyModal"
import { usePolicyAcknowledgment } from "@/app/hooks/use-policy-acknowledgment"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: {
    name?: string | null
    role?: string | null
    image?: string | null
  }
  menuItems: MenuItem[]
}

export function DashboardLayoutClient({ children, user, menuItems: initialMenuItems }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isOperatorMode, setIsOperatorMode] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const { shouldShowModal } = usePolicyAcknowledgment()
  const [showPolicyModal, setShowPolicyModal] = useState(false)

  const isOperator = user.role === UserRole.OPERATOR

  useEffect(() => {
    setShowPolicyModal(shouldShowModal)
  }, [shouldShowModal])

  useEffect(() => {
    if (isOperator) {
      const savedMode = localStorage.getItem("operatorMode")
      setIsOperatorMode(savedMode === "true")
    }
  }, [isOperator])

  useEffect(() => {
    if (!isOperator) return

    if (isOperatorMode) {
      // Show full operator menu
      setMenuItems(initialMenuItems)
    } else {
      // Show only teacher items (filter out operator specific items)
      // This assumes initialMenuItems contains ALL items for Operator
      // We need to filter based on some criteria. 
      // Since we don't have a 'role' property on MenuItem, we'll filter by known paths or labels
      // Or better, we can reconstruct the teacher menu here.
      
      const teacherItems: MenuItem[] = [
        { icon: 'Home', label: 'Přehled', href: '/dashboard' },
        { icon: 'ListChecks', label: 'Správa úloh', href: '/dashboard/job-list' },
        { icon: 'Users', label: 'Studenti', href: '/dashboard/students' },
        { icon: 'Coins', label: 'Rozpočet', href: '/dashboard/budget' },
        { icon: 'Settings', label: 'Nastavení', href: '/dashboard/settings' },
      ]
      setMenuItems(teacherItems)
    }
  }, [isOperatorMode, isOperator, initialMenuItems])

  const handleOperatorModeToggle = (checked: boolean) => {
    setIsOperatorMode(checked)
    localStorage.setItem("operatorMode", String(checked))
    // Dispatch custom event for other components to react
    window.dispatchEvent(new Event('operator-mode-change'))
  }

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - fixovaný nahoru */}
      <DashboardHeader 
        userName={user.name || "Uživateli"}
        userRole={user.role as UserRole}
        menuItems={menuItems}
      />
      
      {isOperator && (
        <div className={`w-full px-4 py-2 border-b flex items-center justify-end gap-2 transition-colors ${isOperatorMode ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'bg-background'}`}>
          <div className="flex items-center space-x-2">
            <Shield className={`h-4 w-4 ${isOperatorMode ? 'text-red-600' : 'text-muted-foreground'}`} />
            <Label htmlFor="operator-mode" className="text-sm font-medium cursor-pointer">
              Operátor mód
            </Label>
            <Switch 
              id="operator-mode" 
              checked={isOperatorMode}
              onCheckedChange={handleOperatorModeToggle}
            />
          </div>
        </div>
      )}

      {/* Hlavní obsah - plná šířka */}
      <div className="w-full">
        <SidebarLayout 
          isMobileOpen={isMobileMenuOpen}
          onMobileToggle={handleMenuToggle}
          menuItems={menuItems}
          className={isOperatorMode ? "border-l-4 border-l-red-500" : ""}
        >
          {children}
        </SidebarLayout>
      </div>

      <PolicyModal 
        isOpen={showPolicyModal} 
        onClose={() => setShowPolicyModal(false)} 
      />
    </div>
  )
}
