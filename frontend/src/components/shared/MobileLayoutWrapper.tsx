import React from 'react';
import { cn } from '../ui/utils';
import MobileBottomNav from '../mobile/MobileNavigation';

interface MobileNavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  navItems: MobileNavItem[];
  userRole: 'consumer' | 'vendor' | 'admin' | 'business';
  notificationCount?: number;
  showOnMobileOnly?: boolean;
  contentClassName?: string;
}

/**
 * MobileLayoutWrapper provides consistent mobile navigation layout
 * Manages spacing, z-index, and bottom navigation for mobile views
 * 
 * Features:
 * - Automatic bottom padding for content
 * - Consistent z-index management (header z-40, nav z-50)
 * - Mobile-only bottom navigation
 * - Desktop fallback support
 */
export function MobileLayoutWrapper({
  children,
  activeTab,
  onTabChange,
  navItems,
  userRole,
  notificationCount,
  showOnMobileOnly = true,
  contentClassName = ''
}: MobileLayoutWrapperProps) {
  return (
    <>
      {/* Main content with bottom padding for mobile nav */}
      <main className={cn(
        'pb-20 md:pb-0', // pb-20 = 5rem (80px) for bottom nav + padding
        contentClassName
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      {(!showOnMobileOnly || typeof window !== 'undefined') && (
        <div className="md:hidden">
          <MobileBottomNav 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
            userRole={userRole}
            notificationCount={notificationCount}
            customItems={navItems}
          />
        </div>
      )}
    </>
  );
}

/**
 * Helper component for proper header spacing with mobile navigation
 * Ensures header z-index doesn't conflict with navigation
 */
export function MobileHeaderWrapper({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn(
      'sticky top-0 z-40', // z-40 so it's below nav (z-50) for scroll hiding
      'dark-glass border-b border-white/10 shadow-lg overflow-hidden',
      className
    )}>
      {children}
    </header>
  );
}

/**
 * Calculates safe spacing for content on mobile
 * Accounts for bottom navigation height (64px) + safe-area-inset-bottom
 */
export const getMobileContentPadding = (): string => {
  return 'pb-[calc(5rem+env(safe-area-inset-bottom))]';
};
