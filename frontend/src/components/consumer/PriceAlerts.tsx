import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, BellOff, Trash2, Plus, TrendingUp, TrendingDown, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useProducts, useMarkets } from '../../hooks/useAppData';
import { getPriceAlerts, addPriceAlert, removePriceAlert, togglePriceAlert, type StoredPriceAlert } from '../../lib/localStorage';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface PriceAlertsProps {
  userId: string;
}

export default function PriceAlerts({ userId }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<StoredPriceAlert[]>([]);
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [alertType, setAlertType] = useState<'increase' | 'decrease' | 'any'>('any');
  const [threshold, setThreshold] = useState('10');
  const { t } = useLanguage();
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = () => {
    const storedAlerts = getPriceAlerts(userId);
    setAlerts(storedAlerts);
  };

  const handleAddAlert = () => {
    if (!selectedProduct || !selectedMarket || !threshold) {
      toast.error('Please fill all fields');
      return;
    }

    const newAlert: StoredPriceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct,
      marketId: selectedMarket,
      threshold: parseFloat(threshold),
      type: alertType,
      createdAt: new Date().toISOString(),
      userId,
      enabled: true,
    };

    addPriceAlert(newAlert);
    loadAlerts();
    
    toast.success('Price alert created successfully!');
    setIsAddAlertOpen(false);
    setSelectedProduct('');
    setSelectedMarket('');
    setThreshold('10');
    setAlertType('any');
  };

  const handleToggleAlert = (alertId: string) => {
    togglePriceAlert(userId, alertId);
    loadAlerts();
    
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      toast.success(alert.enabled ? 'Alert disabled' : 'Alert enabled');
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    removePriceAlert(userId, alertId);
    loadAlerts();
    toast.success('Alert deleted');
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getMarketName = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    return market?.name || 'Unknown Market';
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-3.5 w-3.5" />;
      case 'decrease':
        return <TrendingDown className="h-3.5 w-3.5" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'increase': return t('priceIncrease') || 'Price Increase';
      case 'decrease': return t('priceDecrease') || 'Price Decrease';
      default: return t('anyChange') || 'Any Change';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'increase': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'decrease': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold gradient-text">{t('priceAlerts') || 'Price Alerts'}</h2>
          <p className="text-sm text-muted-foreground">
            {t('alertsDescription') || 'Get notified when prices change'}
          </p>
        </div>
        
        <Dialog open={isAddAlertOpen} onOpenChange={setIsAddAlertOpen}>
          <Button onClick={() => setIsAddAlertOpen(true)} className="btn-premium">
            <Plus className="h-4 w-4 mr-2" />
            {t('newAlert') || 'New Alert'}
          </Button>
          
          <DialogContent className="max-w-md dark-glass border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">{t('createPriceAlert') || 'Create Price Alert'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('alertDescription') || 'Set up an alert to be notified when a product\'s price changes'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-white text-sm mb-1.5 block">{t('product') || 'Product'}</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder={t('selectProduct') || 'Select product'} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id} className="text-white">
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white text-sm mb-1.5 block">{t('market') || 'Market'}</Label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder={t('selectMarket') || 'Select market'} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                    {markets.map(market => (
                      <SelectItem key={market.id} value={market.id} className="text-white">
                        {market.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white text-sm mb-1.5 block">{t('alertType') || 'Alert Type'}</Label>
                <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                    <SelectItem value="any" className="text-white">{t('anyPriceChange') || 'Any price change'}</SelectItem>
                    <SelectItem value="increase" className="text-white">{t('priceIncreaseOnly') || 'Price increase only'}</SelectItem>
                    <SelectItem value="decrease" className="text-white">{t('priceDecreaseOnly') || 'Price decrease only'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white text-sm mb-1.5 block">{t('thresholdPercent') || 'Threshold (%)'}</Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="10"
                  min="1"
                  max="100"
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('thresholdMessage') || `Notify me when price changes by at least ${threshold}%`}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddAlertOpen(false)} className="btn-outline-premium flex-1">
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button onClick={handleAddAlert} className="btn-premium flex-1">
                  {t('createAlert') || 'Create Alert'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
          <Button onClick={() => setIsAddAlertOpen(true)} className="btn-premium">
            <Plus className="h-4 w-4 mr-2" />
            {t('createAlert') || 'Create Alert'}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {alerts.map(alert => {
            const isEnabled = alert.enabled !== false;
            return (
              <Card 
                key={alert.id} 
                className={`p-4 rounded-xl dark-glass border-white/10 transition-all duration-200 hover:-translate-y-0.5 ${
                  !isEnabled && 'opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-white">{getProductName(alert.productId)}</h3>
                      <Badge className={`${getAlertTypeColor(alert.type)} text-xs`}>
                        <span className="flex items-center gap-1">
                          {getAlertTypeIcon(alert.type)}
                          {getAlertTypeText(alert.type)}
                        </span>
                      </Badge>
                      {!isEnabled && (
                        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                          {t('disabled') || 'Disabled'}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                      {getMarketName(alert.marketId)}
                    </p>
                    
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {t('threshold') || 'Threshold'}: {alert.threshold}% {t('change') || 'change'}
                    </p>
                    
                    {alert.createdAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('created') || 'Created'}: {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAlert(alert.id)}
                      className="btn-outline-premium"
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
                {t('alertCheck') || 'Alerts check prices when new submissions are approved'}
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
                {t('alertMultiple') || 'Set different alerts for the same product across markets'}
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}