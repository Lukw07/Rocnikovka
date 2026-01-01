"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Popover, PopoverTrigger, PopoverContent } from "@/app/components/ui/popover"
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { UserRole } from "@/app/lib/generated"
import { LogOut, Coins, Menu } from "lucide-react"
import { UserAvatarWithBadge } from "@/app/components/dashboard/UserAvatarWithBadge"

interface DashboardHeaderProps {
  userName: string
  userRole?: UserRole
  userBalance?: number
  onMenuToggle: () => void
}

export function DashboardHeader({ userName, userRole, userBalance, onMenuToggle }: DashboardHeaderProps) {
  const router = useRouter()
  const [balance, setBalance] = useState<number | undefined>(userBalance)

  useEffect(() => {
    let mounted = true

    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/shop?active=true')
        if (!res.ok) throw new Error(res.statusText)
        const data = await res.json()
        const fetched = data?.data?.userBalance ?? data?.userBalance
        if (mounted) setBalance(fetched)
      } catch (err) {
       
      }
    }

    fetchBalance()

    return () => { mounted = false }
  }, [])

  const handleLogout = () => {
    signOut({ callbackUrl: "http://192.168.3.9:25586/" })
  }

  const handleBackToMain = () => {
    router.push("/")
  }

  const getRoleDisplayName = (role?: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return "Student"
      case UserRole.TEACHER:
        return "Učitel"
      case UserRole.OPERATOR:
        return "Operátor"
      default:
        return "Uživatel"
    }
  }

  return (
    <div className="w-full bg-muted/30 dark:bg-muted/20 border-b border-border px-3 sm:px-4 py-3 flex items-center justify-between">
      {/* Left: Mobile Menu Button */}
      <div className="flex md:hidden items-center">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={onMenuToggle}
        >
          <Menu className="h-7 w-7" />
        </Button>
      </div>

      {/* Center: Logo + Brand (centered on mobile) */}
      <div className="flex-1 flex justify-center md:flex-none md:justify-start">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer" 
          onClick={handleBackToMain}
        >
          <Image 
            src="/images/Logo.svg" 
            alt="Edu RPG Logo" 
            width={32} 
            height={32}
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
          <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Edu RPG
          </span>
        </div>
      </div>

      {/* Right: User Info and Controls */}
      <div className="hidden md:flex items-center gap-3">
        {/* Role */}
        <p className="text-sm text-muted-foreground">
          Role: {getRoleDisplayName(userRole)}
        </p>

        {/* Balance Badge */}
        <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm">
          <Coins className="w-5 h-5" />
          <span className="font-semibold">{balance ?? userBalance ?? 0}</span>
        </Badge>

        {/* User Menu - Full name on desktop */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 h-10">
              <UserAvatarWithBadge name={userName || "U"} className="h-6 w-6" />
              <span className="max-w-[140px] truncate text-sm">
                {userName}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Odhlásit se</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Right side - Only balance and user icon */}
      <div className="flex md:hidden items-center gap-2">
        {/* Balance Badge */}
        <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1 text-xs">
          <Coins className="w-4 h-4" />
          <span className="font-semibold">{balance ?? userBalance ?? 0}</span>
        </Badge>

        {/* User Menu - Only icon on mobile */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <UserAvatarWithBadge name={userName || "U"} className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1 text-xs text-muted-foreground border-b mb-1">
                <p>{userName}</p>
                <p>Role: {getRoleDisplayName(userRole)}</p>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Odhlásit se</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}