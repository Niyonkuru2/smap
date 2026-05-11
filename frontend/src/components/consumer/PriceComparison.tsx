import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, TrendingUp, TrendingDown, Star, Clock, AlertTriangle, ThumbsUp, Plus, Bell, Lightbulb, Loader2 } from 'lucide-react';
import { useProducts, useMarkets } from '../../hooks/useAppData';
import PriceCardSkeleton from '../utils/PriceCardSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { getProvinceColor } from '../../utils/provinceUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLivePrices } from '../../lib/api';

// Types
interface LivePrice {
  id: number;
  product_id: number;
  product_name: string;
  product_unit: string;
  market_id: string;
  market_name: string;
  province: string;
  district: string;
  price: number;
  unit: string;
  vendor_notes?: string;
  created_at: string;
}

interface PriceWithDetails {
  market_name: string;
  market_id: string;
  province: string;
  district: string;
  current: number;
  unit: string;
  vendor_notes?: string;
  last_updated: Date;
  trend: 'up' | 'down' | 'stable';
}

export default function PriceComparison() {
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedPriceForReview, setSelectedPriceForReview] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const { t } = useLanguage();

  // Fetch live prices from API
  useEffect(() => {
    fetchLivePrices();
  }, []);

  const fetchLivePrices = async () => {
    setLoadingPrices(true);
    try {
      const response = await getLivePrices();
      if (response.success && response.prices && response.prices.length > 0) {
        setLivePrices(response.prices);
      } else {
        setLivePrices([]);
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
      toast.error('Failed to load prices');
      setLivePrices([]);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Set default product when products load
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(String(products[0].id));
    }
  }, [products, selectedProduct]);

  // Simulate loading when changing products
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [selectedProduct]);

  // Filter live prices by selected product and province
  const selectedProductData = products.find(p => String(p.id) === selectedProduct);
  
  const productPrices: PriceWithDetails[] = livePrices
    .filter(p => {
      const matchesProduct = p.product_id.toString() === selectedProduct;
      if (!matchesProduct) return false;
      
      if (selectedProvince === 'all') return true;
      return p.province === selectedProvince;
    })
    .map(p => ({
      market_name: p.market_name,
      market_id: p.market_id,
      province: p.province,
      district: p.district,
      current: p.price,
      unit: p.product_unit || p.unit,
      vendor_notes: p.vendor_notes,
      last_updated: new Date(p.created_at),
      trend: 'stable' as const,
    }));

  const product = selectedProductData;

  const getAgeInHours = (lastUpdated: Date) => {
    return Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60));
  };

  const getAgeWarning = (hours: number) => {
    if (hours > 48) return { level: 'high', text: 'Outdated', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    if (hours > 24) return { level: 'medium', text: 'Check freshness', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { level: 'low', text: 'Fresh', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  };

  const handleSubmitReview = () => {
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    toast.success('Thank you for your review!');
    setShowReviewDialog(false);
    setReviewRating(0);
    setReviewComment('');
    setSelectedPriceForReview(null);
  };

  const handleRequestPrice = () => {
    toast.success(`Price request sent for ${product?.name}. You'll be notified when vendors add prices!`);
  };

  const handleSetPriceAlert = () => {
    toast.success(`Price alert set for ${product?.name}. You'll be notified when new prices are added!`);
  };

  const isLoadingState = productsLoading || marketsLoading || loadingPrices;

  if (isLoadingState) {
    return (
      <div className="space-y-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="h-10 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="h-10 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </Card>
        <div className="space-y-3">
          <PriceCardSkeleton />
          <PriceCardSkeleton />
          <PriceCardSkeleton />
        </div>
      </div>
    );
  }

  // Get unique provinces from markets data (not from live prices)
  const availableProvinces = markets && markets.length > 0 
    ? ['all', ...new Set(markets.map(m => m.province).filter(Boolean))]
    : ['all'];

  // Calculate price statistics
  const prices = productPrices.map(p => p.current);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card className="p-4 rounded-xl dark-glass border-white/10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('selectProduct') || 'Select Product'}</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder={t('selectProduct') || 'Select a product'} />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {products.map(product => (
                  <SelectItem key={product.id} value={String(product.id)} className="text-white">
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('province') || 'Province'}</label>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder={t('allProvinces') || 'All Provinces'} />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                <SelectItem value="all" className="text-white">{t('allProvinces') || 'All Provinces'}</SelectItem>
                {availableProvinces.filter(p => p !== 'all').map(province => (
                  <SelectItem key={province} value={province} className="text-white">
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Card */}
      <Card className="relative overflow-hidden rounded-xl dark-glass border-white/10 p-5">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <div className="relative">
          <h2 className="text-lg font-bold gradient-text mb-1">{product?.name} - {t('marketComparison') || 'Market Comparison'}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('averagePrice') || 'Average price'}: {averagePrice.toLocaleString()} RWF per {product?.unit || 'unit'}
          </p>
          
          {isLoading ? (
            <div className="space-y-3">
              <PriceCardSkeleton />
              <PriceCardSkeleton />
              <PriceCardSkeleton />
            </div>
          ) : (
            <div className="space-y-3">
              {productPrices.length > 0 ? (
                productPrices.map((price, index) => {
                  const isLowest = price.current === lowestPrice;
                  const ageInHours = getAgeInHours(price.last_updated);
                  const ageWarning = getAgeWarning(ageInHours);
                  const priceKey = `${price.market_id}-${index}`;
                  const provinceColors = getProvinceColor(price.province);

                  return (
                    <div 
                      key={priceKey} 
                      className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                        isLowest
                          ? 'bg-gradient-to-r from-emerald-950/80 to-emerald-900/60 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-semibold text-white">{price.market_name}</h3>
                            {price.province && (
                              <Badge className={`${provinceColors.badge} ${provinceColors.badgeText} text-xs border border-white/10`}>
                                {provinceColors.emoji} {price.province}
                              </Badge>
                            )}
                            {isLowest && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                🏆 {t('lowestPrice') || 'Lowest Price'}
                              </Badge>
                            )}
                            <Badge className={`${ageWarning.color} border text-[11px]`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {ageWarning.text}
                            </Badge>
                          </div>
                          
                          {price.district && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('district') || 'District'}: {price.district}
                            </p>
                          )}

                          {price.vendor_notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              📝 {price.vendor_notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-left md:text-right">
                          <p className="text-3xl font-bold text-white">
                            RWF {price.current.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">per {price.unit || 'kg'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/10">
                        <div>
                          <p className="text-[11px] text-muted-foreground">{t('average') || 'Average'}</p>
                          <p className="font-medium text-sm text-white">{averagePrice.toLocaleString()} RWF</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">{t('highest') || 'Highest'}</p>
                          <p className="font-medium text-sm text-white">{highestPrice.toLocaleString()} RWF</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">{t('lastUpdated') || 'Last Updated'}</p>
                          <p className="font-medium text-xs text-white">
                            {ageInHours < 1 ? t('justNow') || 'Just now' : `${ageInHours} ${t('hoursAgo') || 'hours ago'}`}
                          </p>
                        </div>
                      </div>

                      {/* Add Review Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 btn-outline-premium"
                        onClick={() => {
                          setSelectedPriceForReview(priceKey);
                          setShowReviewDialog(true);
                        }}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {t('rateThisPrice') || 'Rate this price'}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 mb-4">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400">{t('noQuotesYet') || 'No market quotes yet'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t('noPriceData') || 'No Price Data Available'}</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      {t('noPriceDataMessage', { product: product?.name }) || `We don't have price information for ${product?.name} yet.`}
                      {t('helpBuildDatabase') || ' Help us build a stronger market database.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                      <div 
                        className="group cursor-pointer bg-white/5 border border-white/10 hover:border-primary/50 transition-all rounded-lg p-3"
                        onClick={() => window.location.href = '/vendor/submit-price'}
                      >
                        <div className="text-center">
                          <div className="icon-container-small mb-2 inline-flex">
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-white">{t('submitPrice') || 'Submit a Price'}</p>
                          <p className="text-[11px] text-muted-foreground">{t('shareCurrentPrice') || 'Share current price'}</p>
                        </div>
                      </div>

                      <div className="group cursor-pointer bg-white/5 border border-white/10 hover:border-primary/50 transition-all rounded-lg p-3" onClick={handleRequestPrice}>
                        <div className="text-center">
                          <div className="icon-container-small mb-2 inline-flex">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-white">{t('requestFromVendors') || 'Request from Vendors'}</p>
                          <p className="text-[11px] text-muted-foreground">{t('notifyVendors') || 'Notify vendors'}</p>
                        </div>
                      </div>

                      <div className="group cursor-pointer bg-white/5 border border-white/10 hover:border-primary/50 transition-all rounded-lg p-3" onClick={handleSetPriceAlert}>
                        <div className="text-center">
                          <div className="icon-container-small mb-2 inline-flex">
                            <Bell className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-white">{t('setPriceAlert') || 'Set Price Alert'}</p>
                          <p className="text-[11px] text-muted-foreground">{t('getNotified') || 'Get notified'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-lg bg-primary/5 border border-primary/20 p-3 max-w-md mx-auto">
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong className="text-white">{t('tip') || 'Tip'}:</strong> {t('priceTip') || 'Browse products that already have price data, or check back later as vendors continuously update prices.'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="dark-glass border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{t('rateThisPrice') || 'Rate this price'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('yourRating') || 'Your Rating'}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    aria-label={`Rate ${star} stars`}
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        star <= reviewRating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-gray-500 hover:text-amber-400/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('commentOptional') || 'Comment (Optional)'}</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t('shareExperience') || 'Share your experience with this price...'}
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} className="btn-premium flex-1">
                {t('submitReview') || 'Submit Review'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReviewDialog(false);
                  setReviewRating(0);
                  setReviewComment('');
                }}
                className="btn-outline-premium"
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}