import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, BellOff, Trash2, Plus, TrendingUp, TrendingDown, AlertCircle, Info, CheckCircle, Loader2, X } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useProducts, useMarkets } from '../../hooks/useAppData';
import { getLivePrices } from '../../lib/api';
import { 
  getUserPriceAlerts, 
  createPriceAlert, 
  deletePriceAlert, 
  togglePriceAlert,
  getAlertStatistics,
  type PriceAlert 
} from '../../services/priceAlertService';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

// Simple modal component to replace Dialog
function SimpleModal({ isOpen, onClose, title, description, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-xl dark-glass border border-white/10 shadow-2xl p-6 m-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

interface LiveProduct {
  product_id: number;
  product_name: string;
  market_id: string;
  market_name: string;
  province: string;
  price: number;
  unit: string;
}

interface PriceAlertsProps {
  userId: string;
}

export default function PriceAlerts({ userId }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [statistics, setStatistics] = useState<{
    total_alerts: number;
    active_alerts: number;
    triggered_alerts: number;
    total_triggers: number;
  } | null>(null);
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [alertType, setAlertType] = useState<'below' | 'above' | 'change'>('below');
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [liveProducts, setLiveProducts] = useState<LiveProduct[]>([]);
  const { t } = useLanguage();
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();

  // Fetch live prices to get available products
  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const fetchLiveProducts = async () => {
    try {
      const response = await getLivePrices();
      if (response.success && response.prices) {
        setLiveProducts(response.prices);
      }
    } catch (error) {
      console.error('Error fetching live products:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
    loadStatistics();
  }, [userId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await getUserPriceAlerts();
      if (response.success) {
        setAlerts(response.alerts || []);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getAlertStatistics();
      if (response.success) {
        setStatistics(response.stats);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Get unique products from live prices for the dropdown
  const getUniqueProducts = () => {
    const uniqueProducts = new Map();
    // First try to use products from the products hook
    if (products && products.length > 0) {
      products.forEach(product => {
        uniqueProducts.set(product.id, { id: product.id, name: product.name, unit: product.unit });
      });
    }
    // Also add products from live prices that might not be in products list
    liveProducts.forEach(lp => {
      if (!uniqueProducts.has(lp.product_id)) {
        uniqueProducts.set(lp.product_id, { id: lp.product_id, name: lp.product_name, unit: lp.unit });
      }
    });
    return Array.from(uniqueProducts.values());
  };

  const getUniqueMarkets = () => {
    const uniqueMarkets = new Map();
    if (markets && markets.length > 0) {
      markets.forEach(market => {
        uniqueMarkets.set(market.id, { id: market.id, name: market.name });
      });
    }
    liveProducts.forEach(lp => {
      if (!uniqueMarkets.has(lp.market_id)) {
        uniqueMarkets.set(lp.market_id, { id: lp.market_id, name: lp.market_name });
      }
    });
    return Array.from(uniqueMarkets.values());
  };

  const handleAddAlert = async () => {
    if (!selectedProduct || !threshold) {
      toast.error('Please fill all required fields');
      return;
    }

    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      toast.error('Please enter a valid threshold');
      return;
    }

    setCreating(true);
    try {
      const product = getUniqueProducts().find(p => p.id.toString() === selectedProduct);
      const market = selectedMarket === 'all' ? null : getUniqueMarkets().find(m => m.id === selectedMarket);
      
      await createPriceAlert({
        productName: product?.name,
        productId: selectedProduct ? parseInt(selectedProduct) : undefined,
        marketName: market?.name,
        marketId: market?.id,
        alertType: alertType,
        threshold: thresholdNum
      });
      
      toast.success('Price alert created successfully!');
      setIsAddAlertOpen(false);
      setSelectedProduct('');
      setSelectedMarket('all');
      setThreshold('');
      setAlertType('below');
      await loadAlerts();
      await loadStatistics();
    } catch (error: any) {
      console.error('Error creating alert:', error);
      toast.error(error.response?.data?.message || 'Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAlert = async (alertId: number) => {
    try {
      const response = await togglePriceAlert(alertId);
      if (response.success) {
        await loadAlerts();
        await loadStatistics();
        toast.success(response.message);
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('Failed to toggle alert');
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    try {
      await deletePriceAlert(alertId);
      await loadAlerts();
      await loadStatistics();
      toast.success('Alert deleted successfully');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const getProductName = (productId: number | null) => {
    if (!productId) return 'All Products';
    const allProducts = getUniqueProducts();
    const product = allProducts.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getMarketName = (marketId: string | null) => {
    if (!marketId) return 'All Markets';
    const allMarkets = getUniqueMarkets();
    const market = allMarkets.find(m => m.id === marketId);
    return market?.name || 'Unknown Market';
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'above':
        return <TrendingUp className="h-3.5 w-3.5" />;
      case 'below':
        return <TrendingDown className="h-3.5 w-3.5" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'above': return t('priceIncrease') || 'Price Increase';
      case 'below': return t('priceDecrease') || 'Price Decrease';
      default: return t('priceChange') || 'Price Change';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'above': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'below': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getAlertDescription = (alert: PriceAlert) => {
    const thresholdValue = alert.threshold.toLocaleString();
    
    switch (alert.alert_type) {
      case 'below':
        return `Notify when price drops below ${thresholdValue} RWF`;
      case 'above':
        return `Notify when price rises above ${thresholdValue} RWF`;
      case 'change':
        return `Notify when price changes by ${thresholdValue}%`;
      default:
        return `Notify on price changes`;
    }
  };

  const uniqueProductsList = getUniqueProducts();
  const uniqueMarketsList = getUniqueMarkets();

  if (loading || productsLoading || marketsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section with Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold gradient-text">{t('priceAlerts') || 'Price Alerts'}</h2>
          <p className="text-sm text-muted-foreground">
            {t('alertsDescription') || 'Get notified when prices change'}
          </p>
        </div>
        
        {statistics && statistics.active_alerts > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Badge className="bg-emerald-500/20 text-emerald-300">
              {statistics.active_alerts} Active
            </Badge>
            {statistics.triggered_alerts > 0 && (
              <Badge className="bg-blue-500/20 text-blue-300">
                {statistics.triggered_alerts} Triggered
              </Badge>
            )}
          </div>
        )}
        
        <Button onClick={() => setIsAddAlertOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          {t('newAlert') || 'New Alert'}
        </Button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="p-8 text-center dark-glass border-white/10">
          <div className="icon-container mx-auto mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('noPriceAlerts') || 'No Price Alerts'}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            {t('noAlertsMessage') || 'Create your first alert to get notified about price changes'}
          </p>
          <Button onClick={() => setIsAddAlertOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            {t('createAlert') || 'Create Alert'}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {alerts.map(alert => {
            const isEnabled = alert.is_active;
            const hasTriggered = (alert.trigger_count || 0) > 0;
            
            return (
              <Card 
                key={alert.id} 
                className={`p-4 rounded-xl dark-glass border-white/10 transition-all duration-200 hover:-translate-y-0.5 ${
                  !isEnabled && 'opacity-60'
                } ${hasTriggered && isEnabled ? 'border-blue-500/30 bg-blue-500/5' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-white">{getProductName(alert.product_id)}</h3>
                      <Badge className={`${getAlertTypeColor(alert.alert_type)} text-xs`}>
                        <span className="flex items-center gap-1">
                          {getAlertTypeIcon(alert.alert_type)}
                          {getAlertTypeText(alert.alert_type)}
                        </span>
                      </Badge>
                      {!isEnabled && (
                        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                          {t('disabled') || 'Disabled'}
                        </Badge>
                      )}
                      {hasTriggered && isEnabled && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          {t('triggered') || 'Triggered'} ({alert.trigger_count}x)
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                      {getMarketName(alert.market_id)}
                    </p>
                    
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {getAlertDescription(alert)}
                    </p>
                    
                    {alert.last_triggered_at && (
                      <p className="text-xs text-blue-400/70 mt-2 flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Last triggered: {new Date(alert.last_triggered_at).toLocaleString()}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('created') || 'Created'}: {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAlert(alert.id)}
                      className="border-white/10 hover:bg-white/10"
                    >
                      {isEnabled ? (
                        <>
                          <BellOff className="h-4 w-4 mr-1.5" />
                          {t('disable') || 'Disable'}
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-1.5" />
                          {t('enable') || 'Enable'}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Simple Modal for Creating Alerts */}
      <SimpleModal
        isOpen={isAddAlertOpen}
        onClose={() => setIsAddAlertOpen(false)}
        title={t('createPriceAlert') || 'Create Price Alert'}
        description={t('alertDescription') || "Set up an alert to be notified when a product's price changes"}
      >
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-white text-sm mb-1.5 block">{t('product') || 'Product'} *</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder={t('selectProduct') || 'Select product'} />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {uniqueProductsList.map(product => (
                  <SelectItem key={product.id} value={product.id.toString()} className="text-white">
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white text-sm mb-1.5 block">{t('market') || 'Market'} (Optional)</Label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder={t('allMarkets') || 'All Markets'} />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                <SelectItem value="all" className="text-white">All Markets</SelectItem>
                {uniqueMarketsList.map(market => (
                  <SelectItem key={market.id} value={market.id} className="text-white">
                    {market.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white text-sm mb-1.5 block">{t('alertType') || 'Alert Type'} *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={alertType === 'below' ? 'default' : 'outline'}
                onClick={() => setAlertType('below')}
                className="flex-1"
              >
                <TrendingDown className="h-4 w-4 mr-1" />
                Below
              </Button>
              <Button
                type="button"
                variant={alertType === 'above' ? 'default' : 'outline'}
                onClick={() => setAlertType('above')}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Above
              </Button>
              <Button
                type="button"
                variant={alertType === 'change' ? 'default' : 'outline'}
                onClick={() => setAlertType('change')}
                className="flex-1"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Change %
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-white text-sm mb-1.5 block">
              {alertType === 'change' ? 'Percentage (%)' : 'Price (RWF)'} *
            </Label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={alertType === 'change' ? 'e.g., 10' : 'e.g., 1000'}
              min="1"
              step={alertType === 'change' ? '1' : '100'}
              className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {alertType === 'change' 
                ? 'Alert when price changes by this percentage'
                : `Alert when price goes ${alertType === 'below' ? 'below' : 'above'} this amount`}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddAlertOpen(false)} className="flex-1 border-white/10 hover:bg-white/10">
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleAddAlert} disabled={creating} className="flex-1 bg-primary hover:bg-primary/90">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('createAlert') || 'Create Alert'}
            </Button>
          </div>
        </div>
      </SimpleModal>

      {/* Info Box - How Price Alerts Work */}
      <Card className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
        <div className="flex gap-3">
          <div className="icon-container-small flex-shrink-0 mt-0.5">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-white text-sm mb-1">{t('howAlertsWork') || 'How Price Alerts Work'}</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {t('alertCheck') || 'Alerts check prices automatically every 5 minutes'}
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {t('alertNotification') || 'You\'ll receive a notification when the threshold is reached'}
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {t('alertDisable') || 'Disable alerts temporarily without deleting them'}
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {t('alertMultiple') || 'Set alerts for specific products or all products'}
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {t('alertFrequency') || 'Alerts trigger at most once per hour to prevent spam'}
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}