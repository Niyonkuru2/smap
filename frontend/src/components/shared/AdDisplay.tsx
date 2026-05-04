import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Advertisement, getActiveAds, trackImpression, trackClick } from '../../lib/advertisementService';

interface AdBannerProps {
  placement: 'home_top' | 'home_sidebar' | 'search_results' | 'product_detail' | 'category_page';
  className?: string;
}

export function AdBanner({ placement, className = '' }: AdBannerProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const activeAds = getActiveAds(placement);
    setAds(activeAds);
    
    // Track impression for first ad
    if (activeAds.length > 0) {
      trackImpression(activeAds[0].id);
    }
  }, [placement]);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % ads.length;
          trackImpression(ads[nextIndex].id);
          return nextIndex;
        });
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [ads]);

  if (dismissed || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  const handleClick = () => {
    trackClick(currentAd.id);
    // In real app, navigate to targetUrl
  };

  const nextAd = () => {
    const nextIndex = (currentIndex + 1) % ads.length;
    setCurrentIndex(nextIndex);
    trackImpression(ads[nextIndex].id);
  };

  const prevAd = () => {
    const prevIndex = (currentIndex - 1 + ads.length) % ads.length;
    setCurrentIndex(prevIndex);
    trackImpression(ads[prevIndex].id);
  };

  // Different styles based on placement
  if (placement === 'home_sidebar') {
    return (
      <Card className={`p-3 glass-card relative overflow-hidden ${className}`}>
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full z-10"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
        <span className="absolute top-2 left-2 text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600">
          Sponsored
        </span>
        
        <div 
          className="cursor-pointer mt-4"
          onClick={handleClick}
        >
          <div className="h-28 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center mb-2">
            <div className="text-center p-3">
              <p className="font-semibold text-xs">{currentAd.title}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-2">{currentAd.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">{currentAd.advertiserName}</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-7"
              onClick={() => window.open(currentAd.targetUrl || '#', '_blank')}
            >
              Learn More
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Banner style for home_top
  return (
    <div className={`relative bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-700 rounded-xl p-2 text-white ${className}`}>
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full"
      >
        <X className="h-3 w-3" />
      </button>
      <span className="absolute top-2 left-2 text-[10px] bg-white/20 px-2 py-0.5 rounded">
        Sponsored
      </span>

      <div 
        className="flex items-center gap-2 cursor-pointer mt-2.5"
        onClick={handleClick}
      >
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-base">🛒</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xs">{currentAd.title}</h3>
          <p className="text-[11px] text-white/80">{currentAd.description}</p>
          <p className="text-[10px] text-white/70 mt-1">By {currentAd.advertiserName}</p>
        </div>
        <Button 
          variant="secondary" 
          className="h-7 px-2 text-xs bg-card text-accent hover:bg-card/80\"
        >
          Shop Now
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {ads.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={prevAd} className="p-1 hover:bg-white/20 rounded">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            {ads.map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-card' : 'bg-white/40'}`}
              />
            ))}
          </div>
          <button onClick={nextAd} className="p-1 hover:bg-white/20 rounded">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Featured Product Ad Component
interface FeaturedProductAdProps {
  className?: string;
}

export function FeaturedProductAd({ className = '' }: FeaturedProductAdProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    const ads = getActiveAds('search_results').filter(a => a.type === 'featured_product');
    if (ads.length > 0) {
      setAd(ads[0]);
      trackImpression(ads[0].id);
    }
  }, []);

  if (!ad) return null;

  const handleClick = () => {
    trackClick(ad.id);
  };

  return (
    <Card 
      className={`p-3 glass-card border-2 border-green-600 relative cursor-pointer hover:shadow-lg transition-shadow ${className}`}
      onClick={handleClick}
    >
      <span className="absolute top-2 right-2 text-[10px] bg-green-600 text-white px-2 py-0.5 rounded">
        Featured
      </span>
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
          <span className="text-lg">⭐</span>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{ad.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
          <p className="text-[11px] text-green-600 mt-1">{ad.advertiserName}</p>
        </div>
        <Button size="sm" className="h-7 px-2 text-xs bg-gradient-to-r from-green-500 to-green-600">
          View
        </Button>
      </div>
    </Card>
  );
}

// Sponsored Listing Component (for search results)
interface SponsoredListingProps {
  className?: string;
}

export function SponsoredListing({ className = '' }: SponsoredListingProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    const activeAds = getActiveAds('search_results').filter(a => a.type === 'sponsored_listing');
    setAds(activeAds.slice(0, 2));
    activeAds.slice(0, 2).forEach(ad => trackImpression(ad.id));
  }, []);

  if (ads.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs text-muted-foreground">Sponsored Results</p>
      {ads.map((ad) => (
        <div 
          key={ad.id}
          className="flex items-center gap-2.5 p-2.5 bg-green-950 border border-green-700 rounded-lg cursor-pointer hover:bg-green-900 transition-colors"
          onClick={() => trackClick(ad.id)}
        >
          <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center">
            <span>📦</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-xs">{ad.title}</p>
            <p className="text-[11px] text-muted-foreground">{ad.advertiserName}</p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-green-600" />
        </div>
      ))}
    </div>
  );
}

