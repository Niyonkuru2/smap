/**
 * Performance Optimization Utilities
 * Provides lazy loading, image optimization, caching, and performance monitoring
 */

// ============================================
// LAZY LOADING UTILITIES
// ============================================

/**
 * Intersection Observer for lazy loading elements
 */
export function createLazyObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
}

/**
 * Lazy load images with fade-in effect
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
): void {
  if (placeholder) {
    img.src = placeholder;
  }
  
  const observer = createLazyObserver((entry) => {
    const target = entry.target as HTMLImageElement;
    target.src = src;
    target.classList.add('loaded');
    observer.unobserve(target);
  });

  observer.observe(img);
}

// ============================================
// IMAGE OPTIMIZATION
// ============================================

/**
 * Generate optimized image URL with quality and size parameters
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If it's a local or data URL, return as is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Check if URL supports image optimization parameters
  const urlObj = new URL(url, window.location.origin);
  
  if (width) urlObj.searchParams.set('w', width.toString());
  if (height) urlObj.searchParams.set('h', height.toString());
  urlObj.searchParams.set('q', quality.toString());
  urlObj.searchParams.set('fm', format);

  return urlObj.toString();
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    type?: string;
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    type = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Could not load image'));
    };

    reader.onerror = () => reject(new Error('Could not read file'));
  });
}

/**
 * Generate placeholder blur hash for images
 */
export function generatePlaceholder(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Create a gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'hsl(160, 40%, 25%)');
    gradient.addColorStop(1, 'hsl(160, 40%, 20%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

// ============================================
// CACHING UTILITIES
// ============================================

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheItem<unknown>>();

/**
 * Get data from memory cache
 */
export function getFromCache<T>(key: string): T | null {
  const item = memoryCache.get(key) as CacheItem<T> | undefined;
  
  if (!item) return null;
  
  if (Date.now() - item.timestamp > item.ttl) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.data;
}

/**
 * Set data in memory cache
 */
export function setInCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear all cache or specific keys
 */
export function clearCache(keys?: string[]): void {
  if (keys) {
    keys.forEach((key) => memoryCache.delete(key));
  } else {
    memoryCache.clear();
  }
}

/**
 * Cached fetch with automatic caching
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheTtl: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `fetch:${url}`;
  const cached = getFromCache<T>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  setInCache(cacheKey, data, cacheTtl);
  
  return data;
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

interface PerformanceMetrics {
  fcp: number | null;  // First Contentful Paint
  lcp: number | null;  // Largest Contentful Paint
  fid: number | null;  // First Input Delay
  cls: number | null;  // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

const metrics: PerformanceMetrics = {
  fcp: null,
  lcp: null,
  fid: null,
  cls: null,
  ttfb: null,
};

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP monitoring not supported');
  }

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metrics.lcp = lastEntry.startTime;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP monitoring not supported');
  }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstInput = entries[0] as PerformanceEventTiming;
      if (firstInput) {
        metrics.fid = firstInput.processingStart - firstInput.startTime;
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID monitoring not supported');
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceEntry[];
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      metrics.cls = clsValue;
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS monitoring not supported');
  }

  // Time to First Byte
  try {
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
    }
  } catch (e) {
    console.warn('TTFB monitoring not supported');
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/**
 * Log performance metrics to console
 */
export function logPerformanceMetrics(): void {
  console.group('📊 Performance Metrics');
  console.log(`FCP (First Contentful Paint): ${metrics.fcp?.toFixed(2) || 'N/A'}ms`);
  console.log(`LCP (Largest Contentful Paint): ${metrics.lcp?.toFixed(2) || 'N/A'}ms`);
  console.log(`FID (First Input Delay): ${metrics.fid?.toFixed(2) || 'N/A'}ms`);
  console.log(`CLS (Cumulative Layout Shift): ${metrics.cls?.toFixed(4) || 'N/A'}`);
  console.log(`TTFB (Time to First Byte): ${metrics.ttfb?.toFixed(2) || 'N/A'}ms`);
  console.groupEnd();
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================
// VIRTUAL SCROLLING HELPERS
// ============================================

/**
 * Calculate visible items for virtual scrolling
 */
export function getVisibleItems<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
): { visibleItems: T[]; startIndex: number; endIndex: number; offsetY: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
  };
}

// ============================================
// RESOURCE HINTS
// ============================================

/**
 * Preload critical resources
 */
export function preloadResource(url: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Prefetch resources for future navigation
 */
export function prefetchResource(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Preconnect to external origins
 */
export function preconnect(origin: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// ============================================
// BUNDLE SIZE HELPERS
// ============================================

/**
 * Dynamic import with retry logic
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Dynamic import failed');
}

// ============================================
// MEMORY MANAGEMENT
// ============================================

/**
 * Check memory usage (Chrome only)
 */
export function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
  const performance = window.performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    };
  }

  return null;
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 1) as unknown as number;
}

// Initialize performance monitoring on import
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}
