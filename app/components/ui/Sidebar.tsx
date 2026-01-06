"use client"

import { useState, createContext, useContext, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  BookOpen,
  Trophy,
  Award,
  ListChecks,
  FileText,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Settings,
  Users,
  Coins,
  Server,
  Database,
  Activity,
  Calendar,
  Store,
  Shield,
  Package,
  Wallet,
  ArrowRightLeft,
  Sword,
} from 'lucide-react'
import { ThemeToggle } from "@/app/components/theme/ThemeToggle"

// Custom icon mapping - maps icon names to custom PNG files
const CUSTOM_ICON_MAP: Record<string, string> = {
  'Home': '/icons/dashboard.png',
  'BookOpen': '/icons/subjects.png',
  'Trophy': '/icons/achievments.png', // Note: typo in filename
  'Award': '/icons/badges.png',
  'Leaderboard': '/icons/leaderboard.png',
  'ListChecks': '/icons/jobs.png',
  'ShoppingCart': '/icons/shop.png',
  'Settings': '/icons/settings.png',
  'Users': '/icons/friends.png',
  'Shield': '/icons/guilds.png',
  'ArrowRightLeft': '/icons/trade.png',
  'Package': '/icons/backpack.png',
  'Wallet': '/icons/wallet.png',
  'Sword': '/icons/quest.png',
  'Calendar': '/icons/events.png',
  'FileText': '/icons/logs.png',
  'Store': '/icons/market.png',
}

// Map ikon (kept for fallback)
const ICON_MAP = {
  Home,
  BookOpen,
  Trophy,
  Award,
  ListChecks,
  FileText,
  ChevronRight,
  ShoppingCart,
  Settings,
  Users,
  Coins,
  Server,
  Database,
  Activity,
  Calendar,
  Store,
  Shield,
  Package,
  Wallet,
  ArrowRightLeft,
  Sword,
  Leaderboard: Award, // Use Award icon as fallback for Leaderboard
}

export type IconName = keyof typeof ICON_MAP

export type SidebarPanel =
  | 'dashboard'
  | 'home'
  | 'subjects'
  | 'shop'
  | 'achievements'
  | 'leaderboard'
  | 'badges'
  | 'job-list'
  | 'log'
  | 'settings'
  | 'management'
  | 'students'
  | 'budget'
  | 'users'
  | 'system'
  | 'backups'
  | 'activity'

export type MenuItem = {
  icon: IconName | any
  label: string
  panel?: SidebarPanel
  href: string
  variant?: 'default' | 'operator'
  section?: string
  subsection?: string
  badge?: number
}

export type MenuSection = {
  title: string
  items: MenuItem[]
}

type SidebarLayoutProps = {
  children?: React.ReactNode
  className?: string
  isMobileOpen: boolean
  onMobileToggle: () => void
  menuItems?: MenuItem[]
}

type SidebarContextValue = {
  selectedPanel: SidebarPanel
  setSelectedPanel: (p: SidebarPanel) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export const useSidebar = () => {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

const SidebarLayout = ({ 
  children, 
  className, 
  isMobileOpen, 
  onMobileToggle,
  menuItems: customMenuItems
}: SidebarLayoutProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  // selectedPanel is kept for backward compatibility but should be phased out
  const [selectedPanel, setSelectedPanel] = useState<SidebarPanel>('dashboard')
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile && isMobileOpen) {
      onMobileToggle()
    }
  }, [isMobile, isMobileOpen, onMobileToggle])

  // Collapse is desktop-only; ensure it resets on mobile
  useEffect(() => {
    if (isMobile && isCollapsed) {
      setIsCollapsed(false)
    }
  }, [isMobile, isCollapsed])

  const defaultMenuItems: MenuItem[] = [
    { icon: Home, label: 'Přehled', panel: 'dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'Předměty', panel: 'subjects', href: '/dashboard/subjects' },
    { icon: Trophy, label: 'Úspěchy', panel: 'achievements', href: '/dashboard/achievements' },
    { icon: Award, label: 'Leaderboard', panel: 'leaderboard', href: '/dashboard/leaderboard' },
    { icon: Award, label: 'Odznaky', panel: 'badges', href: '/dashboard/badges' },
    { icon: ListChecks, label: 'Joby', panel: 'job-list', href: '/dashboard/job-list' },
    { icon: FileText, label: 'Log událostí', panel: 'log', href: '/dashboard/log' },
    { icon: ShoppingCart, label: 'Obchod', panel: 'shop', href: '/dashboard/shop' },
    { icon: Settings, label: 'Nastavení', panel: 'settings', href: '/dashboard/settings' },
  ];

  const menuItems = customMenuItems || defaultMenuItems;

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    menuItems.forEach((item) => initial.add(item.section || 'Ostatní'));
    return initial;
  });

  // Keep sections in sync if menuItems change (e.g., jiná role)
  useEffect(() => {
    const next = new Set<string>();
    menuItems.forEach((item) => next.add(item.section || 'Ostatní'));
    setOpenSections(next);
  }, [menuItems]);

  const handleSetSelectedPanel = (panel: SidebarPanel) => {
    setSelectedPanel(panel);
    
    // Find the menu item corresponding to this panel
    const item = menuItems.find(i => i.panel === panel);
    if (item) {
      router.push(item.href);
    } else {
      // Fallback mapping if panel is not in menuItems (e.g. from internal navigation)
      const fallbackMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'subjects': '/dashboard/subjects',
        'achievements': '/dashboard/achievements',
        'leaderboard': '/dashboard/leaderboard',
        'badges': '/dashboard/badges',
        'job-list': '/dashboard/job-list',
        'log': '/dashboard/log',
        'shop': '/dashboard/shop',
        'settings': '/dashboard/settings',
        'students': '/dashboard/students',
        'budget': '/dashboard/budget',
        'users': '/dashboard/users',
        'system': '/dashboard/system',
        'backups': '/dashboard/backups',
        'activity': '/dashboard/activity',
      };
      
      if (fallbackMap[panel]) {
        router.push(fallbackMap[panel]);
      }
    }
  };

  const handleItemClick = (index: number) => {
    if (isMobile) {
      onMobileToggle();
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setHoveredItem(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onMobileToggle();
    }
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    const iconName = typeof item.icon === 'string' ? item.icon : null;
    const customIconPath = iconName ? CUSTOM_ICON_MAP[iconName] : null;
    
    // Fallback to Lucide icon if no custom icon is available
    let Icon;
    if (typeof item.icon === 'string') {
        Icon = ICON_MAP[item.icon as IconName] || Home;
    } else {
        Icon = item.icon;
    }
    
    // Check if active based on pathname
    // Exact match for dashboard, startsWith for others to handle sub-routes if any
    const isActive = item.href === '/dashboard' 
      ? pathname === '/dashboard'
      : pathname?.startsWith(item.href);
      
    const isHoveredItemState = hoveredItem === index;
    // Rozbalení podle konkrétní sekce položky
    const sectionTitle = item.section || 'Ostatní';
    const isSectionOpen = openSections.has(sectionTitle);
    const showExpanded = isMobile ? true : (!isCollapsed && isSectionOpen);

    return (
      <div 
        key={index} 
        className="relative flex justify-center group/item"
        onMouseEnter={() => !isMobile && setHoveredItem(index)}
        onMouseLeave={() => !isMobile && setHoveredItem(null)}
      >
        <Link 
          href={item.href}
          onClick={() => handleItemClick(index)}
          className={`flex items-center transition-all duration-300 ease-out ${
            showExpanded ? 'w-[92%] px-3' : 'w-12 px-0 justify-center'
          } py-2 rounded-lg text-xs ${
            showExpanded && isHoveredItemState ? 'bg-muted/70' : ''
          }`}
        >
          {/* Icon */}
          <div className={`flex items-center justify-center transition-all duration-300 flex-shrink-0 relative ${
            isActive 
              ? 'opacity-100' 
              : isHoveredItemState && showExpanded
              ? 'opacity-100'
              : 'opacity-60'
          }`}>
            {customIconPath ? (
              <Image 
                src={customIconPath} 
                alt={item.label}
                width={44}
                height={44}
                className="w-11 h-11 object-contain"
              />
            ) : (
              <Icon className="w-11 h-11" />
            )}
            {/* Badge for collapsed state */}
            {!showExpanded && item.badge && item.badge > 0 && (
               <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
                 {item.badge > 9 ? '!' : item.badge}
               </span>
            )}
          </div>

          {/* Text */}
          <div className={`flex items-center transition-all duration-300 ease-out overflow-hidden whitespace-nowrap ${
            showExpanded ? 'flex-1 opacity-100 translate-x-0 max-w-[200px] ml-2' : 'flex-none w-0 opacity-0 -translate-x-2 max-w-0 ml-0'
          }`}>
            <span className={`font-medium whitespace-nowrap transition-colors duration-200 text-xs ${
              isActive ? 'text-primary-foreground' : isHoveredItemState ? 'font-bold text-foreground' : 'text-foreground'
            }`}>
              {item.label}
            </span>
            
            {/* Badge for expanded state */}
            {showExpanded && item.badge && item.badge > 0 && (
                <span className={`ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center flex items-center justify-center h-5 ${isActive ? 'ring-1 ring-white/20' : ''}`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
            )}
            
            {/* Active indicator */}
            {isActive && !item.badge && (
              <ChevronRight className={`w-3 h-3 text-primary-foreground/80 ml-auto transition-all duration-300 ease-out flex-shrink-0 ${
                showExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
              }`} />
            )}
          </div>
        </Link>
      </div>
    );
  };

  const renderMenuSections = () => {
    const sections = new Map<string, MenuItem[]>();
    
    // Seskupit items do sekcí
    menuItems.forEach(item => {
      const section = item.section || 'Ostatní';
      if (!sections.has(section)) {
        sections.set(section, []);
      }
      sections.get(section)!.push(item);
    });

    const sectionOrder = ['Hlavní', 'Aktivity', 'Postup', 'Sociální', 'Inventář', 'Výuka', 'Správa', 'Admin', 'Systém', 'Ostatní'];
    const sortedSections = Array.from(sections.entries()).sort((a, b) => {
      const indexA = sectionOrder.indexOf(a[0]);
      const indexB = sectionOrder.indexOf(b[0]);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return (
      <div className="flex flex-col h-full">
        {sortedSections.map(([sectionTitle, items], sectionIndex) => {
          const isSectionOpen = openSections.has(sectionTitle);
          return (
          <div key={sectionTitle} className={`${sectionIndex > 0 ? 'pt-2 border-t border-border' : ''} flex flex-col`}>
            {/* Section Label with toggle */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => {
                  setOpenSections((prev) => {
                    const next = new Set(prev);
                    if (next.has(sectionTitle)) next.delete(sectionTitle); else next.add(sectionTitle);
                    return next;
                  });
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-muted/50 rounded-lg transition-colors"
              >
                <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-widest">
                  {sectionTitle}
                </span>
                <ChevronRight
                  className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
                    isSectionOpen ? 'rotate-90' : 'rotate-0'
                  }`}
                />
              </button>
            )}
            {/* Section Items */}
            <div
              className={`flex flex-col overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-in-out ${
                isSectionOpen || isCollapsed
                  ? 'max-h-[480px] opacity-100 translate-y-0'
                  : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
              }`}
            >
              {items.map((item, index) => {
                const itemIndex = menuItems.indexOf(item);
                return renderMenuItem(item, itemIndex);
              })}
            </div>
          </div>
        )})}
      </div>
    );
  };

  return (
    <SidebarContext.Provider value={{ 
      selectedPanel, 
      setSelectedPanel: handleSetSelectedPanel, 
      isMobileOpen, 
      setIsMobileOpen: onMobileToggle 
    }}>
      <div className={`flex w-full ${className || ''}`}>
        {/* Mobile Overlay Backdrop */}
        {isMobile && isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={handleBackdropClick}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`fixed md:relative z-50 h-screen md:h-auto ${
            isMobile 
              ? `transition-all duration-300 ease-out w-72 ${
                  isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                }`
              : `${isCollapsed ? 'w-16' : 'w-72'}`
          } bg-card/95 backdrop-blur-xl transition-all duration-300 ease-out border-r border-border group/sidebar shadow-xl`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex flex-col h-full pt-2">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 pb-2 shrink-0`}>
              {!isCollapsed && (
                <span className="text-sm font-semibold text-muted-foreground">Menu</span>
              )}
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="p-2 rounded-lg hover:bg-muted/70 border border-border transition-colors"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {/* Main Menu */}
            <div className="flex-1 min-h-0 py-2 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted scrollbar-track-transparent flex flex-col">
              {renderMenuSections()}
            </div>

            {/* Bottom Section with Theme Toggle */}
            <div className="p-3 border-t border-border">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className={`flex-1 bg-background h-screen overflow-y-auto w-full transition-all duration-300 ${
          isMobile && isMobileOpen ? 'blur-sm' : ''
        }`}>
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

export default SidebarLayout;
export { SidebarLayout };
