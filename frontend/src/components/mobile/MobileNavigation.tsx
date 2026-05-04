import React, { useState, useEffect } from 'react';
import { cn } from '../ui/utils';
import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User,
  TrendingUp,
  MapPin,
  Heart,
  Settings,
  Menu
} from 'lucide-react';

interface MobileNavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'consumer' | 'vendor' | 'admin' | 'business';
  notificationCount?: number;
  customItems?: MobileNavItem[];
}

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  userRole,
  notificationCount = 0,
  customItems
}: MobileBottomNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Define nav items based on user role
  const getNavItems = (): MobileNavItem[] => {
    if (customItems) return customItems;

    const baseItems: MobileNavItem[] = [
      { id: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
      { id: 'search', icon: <Search className="h-5 w-5" />, label: 'Search' }
    ];

    if (userRole === 'vendor') {
      return [
        ...baseItems,
        { id: 'submit', icon: <Plus className="h-5 w-5" />, label: 'Submit' },
        { id: 'notifications', icon: <Bell className="h-5 w-5" />, label: 'Alerts', badge: notificationCount },
        { id: 'profile', icon: <User className="h-5 w-5" />, label: 'Profile' }
      ];
    }

    if (userRole === 'admin') {
      return [
        ...baseItems,
        { id: 'analytics', icon: <TrendingUp className="h-5 w-5" />, label: 'Analytics' },
        { id: 'notifications', icon: <Bell className="h-5 w-5" />, label: 'Alerts', badge: notificationCount },
        { id: 'menu', icon: <Menu className="h-5 w-5" />, label: 'More' }
      ];
    }

    // Consumer/Business default
    return [
      ...baseItems,
      { id: 'markets', icon: <MapPin className="h-5 w-5" />, label: 'Markets' },
      { id: 'favorites', icon: <Heart className="h-5 w-5" />, label: 'Saved' },
      { id: 'profile', icon: <User className="h-5 w-5" />, label: 'Profile' }
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-16 md:hidden" />
      
      {/* Bottom Navigation */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-green-950/95 dark:bg-green-900/95 backdrop-blur-lg',
          'border-t border-accent dark:border-gray-800',
          'transition-transform duration-300 ease-in-out',
          'safe-area-bottom',
          !isVisible && 'translate-y-full'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-2 sm:px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-all duration-200 relative',
                'active:scale-95',
                'touch-target',
                activeTab === item.id
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-400'
              )}
            >
              {/* Active indicator */}
              {activeTab === item.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-green-500 rounded-b-full" />
              )}
              
              {/* Icon with badge */}
              <span className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-5 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              
              {/* Label */}
              <span className={cn(
                'text-[10px] sm:text-xs mt-1 font-medium text-center',
                activeTab === item.id && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

// Floating Action Button for mobile
export function MobileFAB({
  onClick,
  icon,
  label,
  className
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed right-4 bottom-20 md:hidden z-40',
        'w-14 h-14 rounded-full',
        'bg-gradient-to-br from-green-500 to-emerald-600',
        'text-white shadow-lg shadow-green-500/30',
        'flex items-center justify-center',
        'active:scale-95 transition-all duration-200',
        'hover:shadow-xl hover:shadow-green-500/40',
        className
      )}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

// Pull to Refresh Hook
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  useEffect(() => {
    let startY = 0;
    let isPulling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      
      if (distance > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(distance * 0.5, 100));
        
        if (distance > 150) {
          e.preventDefault();
        }
      }
    };
    
    const handleTouchEnd = async () => {
      if (pullDistance >= 80 && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      
      isPulling = false;
      setPullDistance(0);
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, pullDistance, isRefreshing]);
  
  return { isRefreshing, pullDistance };
}

// Pull to Refresh Indicator Component
export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing
}: {
  pullDistance: number;
  isRefreshing: boolean;
}) {
  if (pullDistance === 0 && !isRefreshing) return null;
  
  const progress = Math.min(pullDistance / 80, 1);
  const rotation = pullDistance * 2;
  
  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
      style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)` }}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full bg-green-900 dark:bg-green-800 shadow-lg',
          'flex items-center justify-center transition-transform',
          isRefreshing && 'animate-spin'
        )}
        style={{
          transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          opacity: progress
        }}
      >
        <svg
          className="w-5 h-5 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </div>
    </div>
  );
}

