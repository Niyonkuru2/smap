// components/vendor/SubmitPrice.tsx
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, Loader2, DollarSign, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Minus, Store, Package, MapPin,
  ChevronDown, ChevronUp, ArrowRight, FileText, XCircle
} from 'lucide-react';
import { useMarkets, useProducts, type Product, type Market } from '../../hooks/useAppData';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { submitVendorPrice } from '../../services/priceSubmissionService';
import referencePriceService, { type ProductWithReferencePrice } from '../../services/referencePriceService';

interface ReferencePriceInfo {
  market_id: string;
  market_name: string;
  reference_price: number;
  effective_date: string;
  is_current: boolean;
}

interface ProductWithReference extends Product {
  reference_prices?: ReferencePriceInfo[];
}

interface PriceComparison {
  referencePrice: number;
  submittedPrice: number;
  difference: number;
  percentageDiff: number;
  isAnomaly: boolean;
  anomalyReason?: string;
  marketName: string;
}

interface SubmitPriceProps {
  vendorName: string;
  vendorId: string;
}

export default function SubmitPrice({ vendorName, vendorId }: SubmitPriceProps) {
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const { t } = useLanguage();
  
  const [selectedProduct, setSelectedProduct] = useState<ProductWithReference | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ProductWithReference[]>([]);
  const [selectedProductPrices, setSelectedProductPrices] = useState<ReferencePriceInfo[]>([]);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null);
  const [productsWithRefPrices, setProductsWithRefPrices] = useState<ProductWithReference[]>([]);
  const [loadingRefPrices, setLoadingRefPrices] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Fetch products with reference prices
  useEffect(() => {
    fetchProductsWithReferencePrices();
  }, []);

  const fetchProductsWithReferencePrices = async () => {
    setLoadingRefPrices(true);
    try {
      const result = await referencePriceService.getProductsWithPrices({ limit: 100 });
      if (result.success && result.data) {
        // Merge reference price data with existing products
        const enrichedProducts = products.map(product => {
          const refData = result.data.find((rp: any) => rp.id === product.id);
          return {
            ...product,
            reference_prices: refData?.reference_prices || []
          };
        });
        setProductsWithRefPrices(enrichedProducts);
        setFilteredProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Error fetching reference prices:', error);
      setProductsWithRefPrices(products.map(p => ({ ...p, reference_prices: [] })));
      setFilteredProducts(products.map(p => ({ ...p, reference_prices: [] })));
    } finally {
      setLoadingRefPrices(false);
    }
  };

  // Filter products based on search
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = productsWithRefPrices.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(productsWithRefPrices);
    }
  }, [searchTerm, productsWithRefPrices]);

  const handleProductSelect = (product: ProductWithReference) => {
    setSelectedProduct(product);
    setSelectedProductPrices(product.reference_prices || []);
    setSelectedMarket(null);
    setPrice('');
    setPriceComparison(null);
    setShowPriceComparison(false);
    setExpandedProduct(null);
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (selectedMarket && selectedProduct && value) {
      compareWithReferencePrice(parseFloat(value), selectedMarket.id);
    } else {
      setPriceComparison(null);
    }
  };

  const handleMarketSelect = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    setSelectedMarket(market || null);
    if (price && parseFloat(price) > 0 && market) {
      compareWithReferencePrice(parseFloat(price), marketId);
    }
  };

  const compareWithReferencePrice = (submittedPrice: number, marketId: string) => {
    const referencePriceInfo = selectedProductPrices.find(p => p.market_id === marketId && p.is_current);
    
    if (referencePriceInfo) {
      const diff = submittedPrice - referencePriceInfo.reference_price;
      const percentageDiff = (diff / referencePriceInfo.reference_price) * 100;
      const isAnomaly = Math.abs(percentageDiff) > 30; // Flag if difference > 30%
      
      let anomalyReason = '';
      if (isAnomaly) {
        if (percentageDiff > 30) {
          anomalyReason = `Price is ${Math.abs(percentageDiff).toFixed(1)}% higher than reference price (${referencePriceInfo.reference_price.toLocaleString()} RWF). This may be flagged for review.`;
        } else if (percentageDiff < -30) {
          anomalyReason = `Price is ${Math.abs(percentageDiff).toFixed(1)}% lower than reference price (${referencePriceInfo.reference_price.toLocaleString()} RWF). This may be flagged for review.`;
        }
      }
      
      setPriceComparison({
        referencePrice: referencePriceInfo.reference_price,
        submittedPrice: submittedPrice,
        difference: diff,
        percentageDiff: percentageDiff,
        isAnomaly: isAnomaly,
        anomalyReason: anomalyReason,
        marketName: referencePriceInfo.market_name
      });
      setShowPriceComparison(true);
    } else {
      setShowPriceComparison(false);
      setPriceComparison(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !selectedMarket || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitVendorPrice({
        productId: selectedProduct.id,
        marketId: selectedMarket.id,
        price: priceNum,
        unit: selectedProduct.unit,
        notes: notes || `Quantity: ${quantity} kg`,
        quantity: parseFloat(quantity)
      });

      if (response.anomalyCheck?.isAnomaly) {
        toast.warning(response.message, {
          duration: 5000,
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
        });
      } else {
        toast.success(response.message);
      }

      // Reset form
      setSelectedProduct(null);
      setSelectedMarket(null);
      setPrice('');
      setQuantity('1');
      setNotes('');
      setPriceComparison(null);
      setShowPriceComparison(false);
      setSearchTerm('');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit price');
    } finally {
      setSubmitting(false);
    }
  };

  const getAnomalyColor = (percentageDiff: number) => {
    if (Math.abs(percentageDiff) > 50) return 'text-red-500 bg-red-500/10';
    if (Math.abs(percentageDiff) > 30) return 'text-orange-500 bg-orange-500/10';
    if (Math.abs(percentageDiff) > 15) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-emerald-500 bg-emerald-500/10';
  };

  const isLoading = productsLoading || marketsLoading || loadingRefPrices;

  if (isLoading) {
    return (
      <Card className="p-12 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading products and reference prices...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Selection Section */}
      {!selectedProduct ? (
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold gradient-text mb-2">Select Product to Submit Price</h2>
            <p className="text-muted-foreground">Choose a product to see its reference prices across markets</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
            {filteredProducts.map((product) => {
              const currentPrices = product.reference_prices?.filter(p => p.is_current) || [];
              const hasPrices = currentPrices.length > 0;
              const isExpanded = expandedProduct === product.id;
              
              return (
                <div
                  key={product.id}
                  className="border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer overflow-hidden"
                >
                  <div 
                    className="p-4"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                            {product.unit}
                          </Badge>
                          {product.category && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {hasPrices && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedProduct(isExpanded ? null : product.id);
                            }}
                            className="hover:bg-white/10"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Reference Price Summary */}
                    {hasPrices && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-muted-foreground mb-2">Reference prices:</p>
                        {currentPrices.slice(0, 2).map((price) => (
                          <div key={price.market_id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{price.market_name}:</span>
                            <span className="font-semibold text-primary">
                              {price.reference_price.toLocaleString()} RWF
                            </span>
                          </div>
                        ))}
                        {currentPrices.length > 2 && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            +{currentPrices.length - 2} more markets
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Reference Prices */}
                  {isExpanded && hasPrices && (
                    <div className="border-t border-white/10 bg-black/20 p-4 space-y-2">
                      <p className="text-sm font-medium text-primary mb-2">All Reference Prices</p>
                      {currentPrices.map((price) => (
                        <div key={price.market_id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Store className="h-3 w-3 text-primary" />
                            <span className="text-white">{price.market_name}</span>
                          </div>
                          <span className="font-semibold text-emerald-400">
                            {price.reference_price.toLocaleString()} RWF/{product.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No products found</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* Price Submission Form */
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedMarket(null);
                  setPrice('');
                  setPriceComparison(null);
                  setShowPriceComparison(false);
                }}
                className="mb-2 -ml-2 text-muted-foreground hover:text-white"
              >
                ← Back to Products
              </Button>
              <h2 className="text-2xl font-bold gradient-text">Submit Price for {selectedProduct.name}</h2>
              <p className="text-muted-foreground mt-1">
                Unit: {selectedProduct.unit} | Category: {selectedProduct.category || 'Uncategorized'}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1">
                Vendor: {vendorName}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Market Selection */}
            <div>
              <Label className="text-white font-semibold text-base mb-2 block">
                Select Market *
              </Label>
              <Select 
                value={selectedMarket?.id || ''} 
                onValueChange={handleMarketSelect}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choose a market" />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  {markets.map((market) => {
                    const hasReference = selectedProductPrices.some(p => p.market_id === market.id && p.is_current);
                    return (
                      <SelectItem key={market.id} value={market.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span>{market.name}</span>
                            <span className="text-xs text-muted-foreground">({market.location})</span>
                          </div>
                          {hasReference && (
                            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                              Has Reference
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Price Input */}
            <div>
              <Label className="text-white font-semibold text-base mb-2 block">
                Price (RWF) * per {selectedProduct.unit}
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="Enter your price"
                className="bg-white/5 border-white/10 text-white text-lg"
                step="1"
              />
            </div>

            {/* Quantity Input */}
            <div>
              <Label className="text-white font-semibold text-base mb-2 block">
                Quantity ({selectedProduct.unit})
              </Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className="bg-white/5 border-white/10 text-white"
                step="0.1"
                min="0.1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label className="text-white font-semibold text-base mb-2 block">
                Notes (Optional)
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Quality grade, organic, etc."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Price Comparison Display */}
            {showPriceComparison && priceComparison && (
              <div className={`rounded-lg p-4 border-2 ${priceComparison.isAnomaly ? 'border-orange-500/50 bg-orange-500/10' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-start gap-3">
                  {priceComparison.isAnomaly ? (
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">Price Comparison with Reference</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Reference Price ({priceComparison.marketName}):</span>
                        <span className="font-semibold text-white">
                          {priceComparison.referencePrice.toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Your Price:</span>
                        <span className="font-semibold text-white">
                          {priceComparison.submittedPrice.toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-muted-foreground">Difference:</span>
                        <span className={`font-semibold ${priceComparison.difference > 0 ? 'text-red-400' : priceComparison.difference < 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {priceComparison.difference > 0 ? '+' : ''}{priceComparison.difference.toLocaleString()} RWF
                          <span className="ml-2 text-sm">
                            ({priceComparison.percentageDiff > 0 ? '+' : ''}{priceComparison.percentageDiff.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {priceComparison.isAnomaly && priceComparison.anomalyReason && (
                      <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm text-yellow-400 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {priceComparison.anomalyReason}
                        </p>
                      </div>
                    )}
                    
                    {!priceComparison.isAnomaly && (
                      <div className="mt-3 p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-sm text-emerald-400 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          Price is within normal range (±30% of reference price)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Reference Price Warning */}
            {selectedMarket && selectedProductPrices.length > 0 && !selectedProductPrices.some(p => p.market_id === selectedMarket.id) && (
              <div className="rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-400 mb-1">No Reference Price Available</p>
                    <p className="text-sm text-muted-foreground">
                      There is no reference price for this product at {selectedMarket.name}. 
                      Your submission will be reviewed manually.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!selectedMarket || !price || submitting}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-6 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting Price...
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5 mr-2" />
                  Submit Price to {selectedMarket?.name}
                </>
              )}
            </Button>

            {/* Submission Guidelines */}
            <div className="rounded-lg p-4 bg-white/5 border border-white/10">
              <h4 className="font-medium text-primary mb-2">Submission Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Prices outside ±30% of reference price will be flagged for review</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Flagged submissions are reviewed by admins before approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Provide accurate quantity and unit information</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Add notes about product quality for better context</span>
                </li>
              </ul>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}