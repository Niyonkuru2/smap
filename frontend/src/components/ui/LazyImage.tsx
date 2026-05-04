import React, { useState, useRef, useEffect, memo } from 'react';
import { createLazyObserver, generatePlaceholder } from '../../utils/performance';
import { cn } from './utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  blur?: boolean;
  lowQuality?: boolean;
}

/**
 * LazyImage Component
 * Implements lazy loading with blur-up effect and fallback support
 */
const LazyImage = memo(function LazyImage({
  src,
  alt,
  placeholder,
  fallback = '/placeholder-image.png',
  aspectRatio = 'auto',
  objectFit = 'cover',
  blur = true,
  lowQuality = false,
  className,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const placeholderSrc = placeholder || generatePlaceholder();

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = createLazyObserver((entry) => {
      setInView(true);
      observer.unobserve(entry.target);
    });

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  };

  // Generate low quality URL for data saver mode
  const imageSrc = lowQuality && !src.startsWith('data:')
    ? `${src}${src.includes('?') ? '&' : '?'}q=30&w=400`
    : src;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Placeholder/Blur layer */}
      {blur && !loaded && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 w-full h-full',
            objectFitClasses[objectFit],
            'filter blur-lg scale-110 transition-opacity duration-300',
            loaded ? 'opacity-0' : 'opacity-100'
          )}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={inView ? (error ? fallback : imageSrc) : placeholderSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        className={cn(
          'w-full h-full transition-opacity duration-300',
          objectFitClasses[objectFit],
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />

      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/5 to-muted animate-pulse" />
      )}
    </div>
  );
});

export default LazyImage;
