import React, { useState, useRef, useEffect, memo, ImgHTMLAttributes } from 'react';
import { useDataSaver } from '../../contexts/DataSaverContext';
import { cn } from './utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholderColor?: string;
  aspectRatio?: string;
  priority?: boolean;
  onLoadComplete?: () => void;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder-image.png',
  placeholderColor = '#e5e7eb',
  aspectRatio = '1/1',
  priority = false,
  className,
  onLoadComplete,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { isDataSaverEnabled, imageQuality, isOffline } = useDataSaver();

  // Get optimized image URL based on quality settings
  const getOptimizedSrc = (originalSrc: string): string => {
    if (!originalSrc || isOffline) return fallbackSrc;
    
    // If data saver is enabled, use lower quality
    if (isDataSaverEnabled) {
      // Add quality parameter if the URL supports it
      const url = new URL(originalSrc, window.location.origin);
      
      switch (imageQuality) {
        case 'low':
          url.searchParams.set('q', '30');
          url.searchParams.set('w', '200');
          break;
        case 'medium':
          url.searchParams.set('q', '60');
          url.searchParams.set('w', '400');
          break;
        default:
          url.searchParams.set('q', '85');
      }
      
      return url.toString();
    }
    
    return originalSrc;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element comes into view
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Preload priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedSrc(src);
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const optimizedSrc = isInView ? getOptimizedSrc(src) : '';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
        className
      )}
      style={{
        aspectRatio,
        backgroundColor: placeholderColor
      }}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]" />
      )}
      
      {/* Actual Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={hasError ? fallbackSrc : optimizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}
      
      {/* Error State */}
      {hasError && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      
      {/* Low Quality Indicator */}
      {isDataSaverEnabled && isLoaded && !hasError && imageQuality !== 'high' && (
        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
          {imageQuality === 'low' ? 'SD' : 'MD'}
        </div>
      )}
    </div>
  );
});

export default OptimizedImage;

// Preload critical images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Preload multiple images
export async function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}
