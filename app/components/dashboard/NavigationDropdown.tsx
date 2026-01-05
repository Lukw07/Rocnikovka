"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { Menu } from "lucide-react"
import { MenuItem } from "@/app/components/ui/Sidebar"

interface NavigationDropdownProps {
  menuItems: MenuItem[]
}

export function NavigationDropdown({ menuItems }: NavigationDropdownProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Seskupit items do sekcí
  const sections = new Map<string, MenuItem[]>()
  menuItems.forEach(item => {
    const section = item.section || 'Ostatní'
    if (!sections.has(section)) {
      sections.set(section, [])
    }
    sections.get(section)!.push(item)
  })

  const sectionOrder = ['Hlavní', 'Aktivity', 'Postup', 'Sociální', 'Inventář', 'Výuka', 'Správa', 'Admin', 'Systém', 'Ostatní']
  const sortedSections = Array.from(sections.entries()).sort((a, b) => {
    const indexA = sectionOrder.indexOf(a[0])
    const indexB = sectionOrder.indexOf(b[0])
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  const getIcon = (item: MenuItem) => {
    if (typeof item.icon === 'string') {
      return null
    }
    const Icon = item.icon
    return <Icon className="w-4 h-4" />
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Navigace</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="start" 
        className="w-56 max-h-[80vh] overflow-y-auto"
      >
        {sortedSections.map(([sectionTitle, items], sectionIndex) => (
          <div key={sectionTitle}>
            {sectionIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-widest px-2 py-1.5 text-muted-foreground">
              {sectionTitle}
            </DropdownMenuLabel>
            {items.map((item) => {
              const active = isActive(item.href)
              const Icon = typeof item.icon === 'string' ? null : item.icon

              return (
                <DropdownMenuItem key={item.href} asChild className="p-0">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-sm ${
                      active
                        ? item.variant === 'operator'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-primary/10 text-primary dark:bg-primary/20'
                        : ''
                    }`}
                  >
                    {Icon && (
                      <Icon className={`w-4 h-4 shrink-0 ${
                        active && item.variant === 'operator'
                          ? 'text-red-600 dark:text-red-400'
                          : active
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`} />
                    )}
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.variant === 'operator'
                          ? 'bg-red-600'
                          : 'bg-primary'
                      }`} />
                    )}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
