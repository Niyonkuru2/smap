import React from 'react';
import { cn } from '../ui/utils';

interface MobileContentCardProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

/**
 * MobileContentCard - Responsive card component optimized for mobile
 * 
 * Features:
 * - Proper spacing for touch on mobile
 * - Better typography scaling
 * - Responsive padding (4 on mobile, 5-6 on desktop)
 * - Touch feedback with active states
 * - Safe area consideration for notched devices
 */
export function MobileContentCard({
  children,
  className = '',
  compact = false,
  interactive = false,
  onClick
}: MobileContentCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styling
        'rounded-lg border bg-card/80 backdrop-blur-sm',
        'transition-all duration-200',
        
        // Spacing
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 lg:p-6',
        
        // Border styling
        'border-accent/20 hover:border-accent/40',
        
        // Interactive state
        interactive && 'cursor-pointer active:scale-95 hover:bg-card/90',
        
        // Mobile-specific improvements
        'touch-target',
        
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function MobileCardHeader({
  title,
  subtitle,
  icon,
  action
}: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <div className="flex-shrink-0 text-green-500 mt-1">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-400 truncate mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-2">
          {action}
        </div>
      )}
    </div>
  );
}

interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function MobileCardList({
  children,
  className = '',
  compact = false
}: MobileCardListProps) {
  return (
    <div className={cn(
      'space-y-2 sm:space-y-3',
      compact && 'space-y-1.5 sm:space-y-2',
      className
    )}>
      {children}
    </div>
  );
}

interface MobileCardItemProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function MobileCardItem({
  children,
  className = '',
  compact = false
}: MobileCardItemProps) {
  return (
    <div className={cn(
      'py-3 px-3 sm:p-4 rounded-md bg-white/5 border border-accent/10',
      'hover:bg-white/10 hover:border-accent/20 transition-all',
      compact && 'py-2 px-3 sm:py-3',
      className
    )}>
      {children}
    </div>
  );
}
