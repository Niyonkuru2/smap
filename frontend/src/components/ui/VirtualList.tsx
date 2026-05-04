import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { getVisibleItems } from '../../utils/performance';
import { cn } from './utils';

// Simple throttle function
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle = false;
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  } as T;
}

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * VirtualList Component
 * Efficiently renders large lists by only rendering visible items
 */
function VirtualListInner<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const { visibleItems, startIndex, offsetY } = getVisibleItems(
    items,
    scrollTop,
    containerHeight,
    itemHeight,
    overscan
  );

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback(
    throttle((e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);

      // Check if near end
      if (onEndReached) {
        const distanceFromEnd = totalHeight - (target.scrollTop + containerHeight);
        if (distanceFromEnd < endReachedThreshold) {
          onEndReached();
        }
      }
    }, 16), // ~60fps
    [totalHeight, containerHeight, onEndReached, endReachedThreshold]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoize the component
const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

export default VirtualList;

// ============================================
// Window Virtual List (for full-page lists)
// ============================================

interface WindowVirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function WindowVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 10,
  className,
}: WindowVirtualListProps<T>) {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const handleResize = throttle(() => {
      setWindowHeight(window.innerHeight);
    }, 100);

    const handleScroll = throttle(() => {
      setScrollTop(window.scrollY);
    }, 16);

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const { visibleItems, startIndex, offsetY } = getVisibleItems(
    items,
    scrollTop,
    windowHeight,
    itemHeight,
    overscan
  );

  const totalHeight = items.length * itemHeight;

  return (
    <div className={className} style={{ height: totalHeight, position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${offsetY}px)`,
        }}
      >
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{ height: itemHeight }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}
