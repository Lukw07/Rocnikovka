"use client"

import { useState, createContext, useContext, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { ThemeToggle } from "@/app/components/ThemeToggle"

type V2SidebarLayoutProps = {
  children?: React.ReactNode
  className?: string
  isMobileOpen: boolean
  onMobileToggle: () => void
}

type SidebarPanel =
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
  onMobileToggle 
}: V2SidebarLayoutProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<number | null>(0);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
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

  const menuItems = [
    { icon: Home, label: 'Přehled', panel: 'dashboard' },
    { icon: BookOpen, label: 'Předměty', panel: 'subjects' },
    { icon: Trophy, label: 'Úspěchy', panel: 'achievements' },
    { icon: Award, label: 'Leaderboard', panel: 'leaderboard' },
    { icon: Award, label: 'Odznaky', panel: 'badges' },
    { icon: ListChecks, label: 'Seznam Úloh', panel: 'job-list' },
    { icon: FileText, label: 'Záznam', panel: 'log' },
    { icon: ShoppingCart, label: 'Obchod', panel: 'shop' },
    { icon: Settings, label: 'Nastavení', panel: 'settings' },
  ];

  const handleItemClick = (index: number, section: 'main' | 'bottom' = 'main') => {
    setActiveItem(index);
    const panel = menuItems[index]?.panel as SidebarPanel | undefined;
    if (panel) setSelectedPanel(panel);
    
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

  const renderMenuItem = (item: any, index: number, section: 'main' | 'bottom' = 'main') => {
    const Icon = item.icon;
    const isActive = activeItem === index && section === 'main';
    const isHoveredItemState = hoveredItem === index;
    const showExpanded = isMobile || isHovered;

    return (
      <div 
        key={index} 
        className="relative mb-1 flex justify-center"
        onMouseEnter={() => !isMobile && setHoveredItem(index)}
        onMouseLeave={() => !isMobile && setHoveredItem(null)}
      >
        <button 
          onClick={() => handleItemClick(index, section)}
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
        </button>

        
      </div>
    );
  };

  return (
    <SidebarContext.Provider value={{ 
      selectedPanel, 
      setSelectedPanel, 
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
                {menuItems.map((item, index) => renderMenuItem(item, index, 'main'))}
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