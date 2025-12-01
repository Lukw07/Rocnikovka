"use client"

import { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  Award, 
  ListChecks, 
  FileText,
  ChevronRight,
  ShoppingCart,
  X,
  Settings,
  Users,
  Coins,
  Server,
  Database,
  Activity
} from 'lucide-react';
import { ThemeToggle } from "@/app/components/theme/ThemeToggle"

// Map of icon names to components
const ICON_MAP = {
  Home,
  BookOpen,
  Trophy,
  Award,
  ListChecks,
  FileText,
  ShoppingCart,
  Settings,
  Users,
  Coins,
  Server,
  Database,
  Activity
};

export type IconName = keyof typeof ICON_MAP;

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
}

type V2SidebarLayoutProps = {
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

const V2SidebarLayout = ({ 
  children, 
  className, 
  isMobileOpen, 
  onMobileToggle,
  menuItems: customMenuItems
}: V2SidebarLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  // selectedPanel is kept for backward compatibility but should be phased out
  const [selectedPanel, setSelectedPanel] = useState<SidebarPanel>('dashboard');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && isMobileOpen) {
      onMobileToggle();
    }
  }, [isMobile, isMobileOpen, onMobileToggle]);

  const defaultMenuItems: MenuItem[] = [
    { icon: Home, label: 'Přehled', panel: 'dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'Předměty', panel: 'subjects', href: '/dashboard/subjects' },
    { icon: Trophy, label: 'Úspěchy', panel: 'achievements', href: '/dashboard/achievements' },
    { icon: Award, label: 'Leaderboard', panel: 'leaderboard', href: '/dashboard/leaderboard' },
    { icon: Award, label: 'Odznaky', panel: 'badges', href: '/dashboard/badges' },
    { icon: ListChecks, label: 'Seznam Úloh', panel: 'job-list', href: '/dashboard/job-list' },
    { icon: FileText, label: 'Záznam', panel: 'log', href: '/dashboard/log' },
    { icon: ShoppingCart, label: 'Obchod', panel: 'shop', href: '/dashboard/shop' },
    { icon: Settings, label: 'Nastavení', panel: 'settings', href: '/dashboard/settings' },
  ];

  const menuItems = customMenuItems || defaultMenuItems;

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
    let Icon;
    if (typeof item.icon === 'string') {
        Icon = ICON_MAP[item.icon as IconName] || Home; // Fallback to Home if not found
    } else {
        Icon = item.icon;
    }
    // Check if active based on pathname
    // Exact match for dashboard, startsWith for others to handle sub-routes if any
    const isActive = item.href === '/dashboard' 
      ? pathname === '/dashboard'
      : pathname?.startsWith(item.href);
      
    const isHoveredItemState = hoveredItem === index;
    const showExpanded = isMobile || isHovered;

    return (
      <div 
        key={index} 
        className="relative mb-1 flex justify-center"
        onMouseEnter={() => !isMobile && setHoveredItem(index)}
        onMouseLeave={() => !isMobile && setHoveredItem(null)}
      >
        <Link 
          href={item.href}
          onClick={() => handleItemClick(index)}
          className={`flex items-center transition-all duration-300 ease-out ${
            showExpanded ? 'w-[92%] px-4' : 'w-12 px-0 justify-center'
          } py-3 rounded-2xl ${
            isActive 
              ? 'bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20' 
              : isHoveredItemState
              ? 'bg-muted border border-border shadow-md'
              : 'hover:bg-muted/50'
          }`}
        >
          {/* Icon */}
          <div className={`flex items-center justify-center transition-all duration-300 ${
            isActive 
              ? 'text-primary-foreground' 
              : 'text-muted-foreground'
          }`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Text */}
          <div className={`flex-1 flex items-center transition-all duration-300 ease-out overflow-hidden ${
            showExpanded ? 'opacity-100 translate-x-0 max-w-full ml-3' : 'opacity-0 -translate-x-2 max-w-0 ml-0'
          }`}>
            <span className={`font-medium whitespace-nowrap transition-colors duration-200 text-sm ${
              isActive ? 'text-primary-foreground' : 'text-foreground'
            }`}>
              {item.label}
            </span>
            
            {/* Active indicator */}
            {isActive && (
              <ChevronRight className={`w-4 h-4 text-primary-foreground/80 ml-2 transition-all duration-300 ease-out ${
                showExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
              }`} />
            )}
          </div>
        </Link>
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
              : isHovered ? 'w-72' : 'w-20'
          } bg-card/95 backdrop-blur-xl transition-all duration-300 ease-out border-r border-border md:min-h-[calc(100vh-4rem)] group/sidebar shadow-xl`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
         
          <div className="flex flex-col h-full pt-2">
            {/* Main Menu */}
            <div className="flex-1 py-4 px-3">
              <div className="mb-6">
                <div className={`px-4 mb-3 transition-all duration-300 ${
                  (isMobile || isHovered) ? 'opacity-100' : 'opacity-0'
                }`}>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Hlavní menu
                  </span>
                </div>
                {menuItems.map((item, index) => renderMenuItem(item, index))}
              </div>
            </div>

            {/* Bottom Section with Theme Toggle */}
            <div className="p-3 border-t border-border">
              <div className={`flex items-center justify-center transition-all duration-300 ${
                (isMobile || isHovered) ? 'justify-between px-4' : 'justify-center'
              }`}>
                <div className={`transition-all duration-300 ${
                  (isMobile || isHovered) ? 'opacity-100' : 'opacity-0'
                }`}>
                  <span className="text-xs text-muted-foreground">Vzhled</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className={`flex-1 bg-background min-h-screen w-full transition-all duration-300 ${
          isMobile && isMobileOpen ? 'blur-sm' : ''
        }`}>
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default V2SidebarLayout;
export { V2SidebarLayout };