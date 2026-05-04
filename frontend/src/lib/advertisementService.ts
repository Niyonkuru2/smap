// Advertisement System Types and Service

export type AdType = 'banner' | 'featured_product' | 'sponsored_listing' | 'popup' | 'sidebar';
export type AdStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'expired' | 'rejected';
export type AdPlacement = 'home_top' | 'home_sidebar' | 'search_results' | 'product_detail' | 'category_page' | 'checkout';
export type BillingModel = 'cpc' | 'cpm' | 'flat_rate' | 'daily';

export interface Advertisement {
  id: string;
  advertiserId: string;
  advertiserName: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  type: AdType;
  placement: AdPlacement[];
  status: AdStatus;
  billingModel: BillingModel;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  targeting: AdTargeting;
  metrics: AdMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface AdTargeting {
  markets: string[];
  categories: string[];
  userRoles: string[];
  ageRange?: { min: number; max: number };
  location?: string[];
  language?: string[];
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  costPerClick: number;
  costPerImpression: number;
}

export interface AdCampaign {
  id: string;
  name: string;
  advertiserId: string;
  ads: string[];
  totalBudget: number;
  dailyBudget: number;
  spent: number;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate: string;
  metrics: AdMetrics;
}

export interface AdPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // days
  features: string[];
  adTypes: AdType[];
  placements: AdPlacement[];
  maxImpressions: number;
  popular?: boolean;
}

// Sample ad packages
export const AD_PACKAGES: AdPackage[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for small vendors starting out',
    price: 15000, // RWF
    duration: 7,
    features: [
      'Sidebar banner ads',
      'Up to 5,000 impressions',
      'Basic analytics',
      'Email support',
    ],
    adTypes: ['sidebar'],
    placements: ['home_sidebar', 'category_page'],
    maxImpressions: 5000,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Great for growing businesses',
    price: 45000,
    duration: 30,
    features: [
      'Banner + Featured listings',
      'Up to 25,000 impressions',
      'Detailed analytics',
      'Priority placement',
      'Phone support',
    ],
    adTypes: ['banner', 'featured_product'],
    placements: ['home_top', 'home_sidebar', 'search_results', 'category_page'],
    maxImpressions: 25000,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum visibility for your business',
    price: 120000,
    duration: 30,
    features: [
      'All ad formats',
      'Unlimited impressions',
      'Advanced targeting',
      'Real-time analytics',
      'A/B testing',
      'Dedicated account manager',
      'Priority review',
    ],
    adTypes: ['banner', 'featured_product', 'sponsored_listing', 'popup', 'sidebar'],
    placements: ['home_top', 'home_sidebar', 'search_results', 'product_detail', 'category_page', 'checkout'],
    maxImpressions: 100000,
  },
];

// Sample advertisements (removed from production)
export const SAMPLE_ADS: Advertisement[] = [];

// Ad Service Functions
export function getActiveAds(placement?: AdPlacement): Advertisement[] {
  let ads = SAMPLE_ADS.filter(ad => ad.status === 'active');
  if (placement) {
    ads = ads.filter(ad => ad.placement.includes(placement));
  }
  return ads;
}

export function getAdsByAdvertiser(advertiserId: string): Advertisement[] {
  return SAMPLE_ADS.filter(ad => ad.advertiserId === advertiserId);
}

export function trackImpression(adId: string): void {
  // In real app, this would call backend API
  console.log(`Impression tracked for ad: ${adId}`);
}

export function trackClick(adId: string): void {
  // In real app, this would call backend API
  console.log(`Click tracked for ad: ${adId}`);
}

export function calculateAdStats(ads: Advertisement[]): {
  totalImpressions: number;
  totalClicks: number;
  totalSpent: number;
  totalRevenue: number;
  avgCtr: number;
} {
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.metrics.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.metrics.clicks, 0);
  const totalSpent = ads.reduce((sum, ad) => sum + ad.spent, 0);
  const totalRevenue = ads.reduce((sum, ad) => sum + ad.metrics.revenue, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return { totalImpressions, totalClicks, totalSpent, totalRevenue, avgCtr };
}
