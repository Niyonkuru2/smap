import { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  placeholder?: string;
  alt: string;
  className?: string;
  sizes?: string;
  srcSet?: string;
}

export function ProgressiveImage({ 
  src, 
  placeholder, 
  alt, 
  className = '',
  sizes,
  srcSet,
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    
    if (srcSet) {
      img.srcset = srcSet;
    }

    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };

    img.onerror = () => {
      setError(true);
      setLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, srcSet]);

  if (error) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={`${className} transition-all duration-300 ${
        loading ? 'blur-sm scale-105' : 'blur-0 scale-100'
      }`}
      loading="lazy"
      decoding="async"
    />
  );
}
