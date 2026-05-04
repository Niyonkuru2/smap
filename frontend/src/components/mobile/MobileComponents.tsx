import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../ui/utils';

// Swipeable Card Component
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 100;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setTranslateX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (translateX > 60 && onSwipeRight) {
      onSwipeRight();
    } else if (translateX < -60 && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setTranslateX(0);
    setIsDragging(false);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left Action (appears on swipe right) */}
      {leftAction && (
        <div
          className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-green-500 text-white"
          style={{ opacity: Math.min(translateX / 60, 1) }}
        >
          {leftAction}
        </div>
      )}
      
      {/* Right Action (appears on swipe left) */}
      {rightAction && (
        <div
          className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-green-600 text-white"
          style={{ opacity: Math.min(-translateX / 60, 1) }}
        >
          {rightAction}
        </div>
      )}
      
      {/* Main Card */}
      <div
        ref={cardRef}
        className={cn(
          'transition-transform bg-green-950 dark:bg-green-900',
          !isDragging && 'duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Touch Ripple Effect
interface TouchRippleProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TouchRipple({ children, className, onClick }: TouchRippleProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100
          }}
        />
      ))}
    </div>
  );
}

// Bottom Sheet Component
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9]
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const currentHeight = snapPoints[currentSnap] * 100;

  const handleDragStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - startY.current;
    setDragY(diff);
  };

  const handleDragEnd = () => {
    if (dragY > 100) {
      // Dragged down significantly
      if (currentSnap === 0) {
        onClose();
      } else {
        setCurrentSnap(currentSnap - 1);
      }
    } else if (dragY < -100) {
      // Dragged up significantly
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      }
    }
    setDragY(0);
    setIsDragging(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-green-950 dark:bg-green-900 rounded-t-3xl',
          'shadow-2xl',
          !isDragging && 'transition-all duration-300'
        )}
        style={{
          height: `calc(${currentHeight}vh - ${dragY}px)`,
          maxHeight: '95vh'
        }}
      >
        {/* Handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {/* Title */}
        {title && (
          <div className="px-4 pb-3 border-b border-accent dark:border-gray-700">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">
              {title}
            </h3>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-60px)] px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
}

// Skeleton Loading Component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseStyles = cn(
    'bg-gray-200 dark:bg-gray-700',
    animation === 'pulse' && 'animate-pulse',
    animation === 'wave' && 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
    variant === 'circular' && 'rounded-full',
    variant === 'text' && 'rounded',
    variant === 'rectangular' && 'rounded-lg',
    className
  );

  return (
    <div
      className={baseStyles}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1em' : '100%')
      }}
    />
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="p-4 border border-accent dark:border-gray-700 rounded-xl space-y-3">
      <Skeleton variant="rectangular" height={120} />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="50%" />
      <div className="flex justify-between">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="20%" />
      </div>
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

