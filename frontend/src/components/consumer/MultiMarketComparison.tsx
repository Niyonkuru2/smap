import { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Map,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Star,
  Navigation,
  DollarSign,
  Award,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const markets = [
  { id: 'musanze', name: 'Musanze Market', district: 'Musanze', province: 'Northern', lat: -1.4997, lng: 29.6347 },
  { id: 'kimironko', name: 'Kimironko Market', district: 'Gasabo', province: 'Kigali City', lat: -1.9403, lng: 30.1120 },
  { id: 'nyabugogo', name: 'Nyabugogo Market', district: 'Nyarugenge', province: 'Kigali City', lat: -1.9361, lng: 30.0467 },
  { id: 'muhanga', name: 'Muhanga Market', district: 'Muhanga', province: 'Southern', lat: -2.0844, lng: 29.7564 },
  { id: 'huye', name: 'Huye Market', district: 'Huye', province: 'Southern', lat: -2.5969, lng: 29.7397 },
  { id: 'rubavu', name: 'Rubavu Market', district: 'Rubavu', province: 'Western', lat: -1.6745, lng: 29.2557 },
];

const productPrices = [
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    prices: {
      musanze: { price: 800, change: -5, trend: 'down' },
      kimironko: { price: 850, change: 2, trend: 'up' },
      nyabugogo: { price: 750, change: 0, trend: 'stable' },
      muhanga: { price: 780, change: -3, trend: 'down' },
      huye: { price: 720, change: 4, trend: 'up' },
      rubavu: { price: 900, change: 8, trend: 'up' },
    },
  },
  {
    id: 'onions',
    name: 'Onions',
    category: 'Vegetables',
    unit: 'kg',
    prices: {
      musanze: { price: 600, change: 3, trend: 'up' },
      kimironko: { price: 650, change: 5, trend: 'up' },
      nyabugogo: { price: 550, change: -2, trend: 'down' },
      muhanga: { price: 580, change: 0, trend: 'stable' },
      huye: { price: 520, change: -4, trend: 'down' },
      rubavu: { price: 680, change: 7, trend: 'up' },
    },
  },
  {
    id: 'rice',
    name: 'Rice',
    category: 'Grains',
    unit: 'kg',
    prices: {
      musanze: { price: 1500, change: 2, trend: 'up' },
      kimironko: { price: 1450, change: 0, trend: 'stable' },
      nyabugogo: { price: 1400, change: -3, trend: 'down' },
      muhanga: { price: 1480, change: 1, trend: 'up' },
      huye: { price: 1380, change: -2, trend: 'down' },
      rubavu: { price: 1550, change: 4, trend: 'up' },
    },
  },
  {
    id: 'beans',
    name: 'Beans',
    category: 'Grains',
    unit: 'kg',
    prices: {
      musanze: { price: 900, change: -1, trend: 'down' },
      kimironko: { price: 950, change: 3, trend: 'up' },
      nyabugogo: { price: 880, change: 0, trend: 'stable' },
      muhanga: { price: 920, change: 2, trend: 'up' },
      huye: { price: 850, change: -4, trend: 'down' },
      rubavu: { price: 980, change: 5, trend: 'up' },
    },
  },
  {
    id: 'bananas',
    name: 'Bananas',
    category: 'Fruits',
    unit: 'bunch',
    prices: {
      musanze: { price: 1000, change: 5, trend: 'up' },
      kimironko: { price: 1100, change: 3, trend: 'up' },
      nyabugogo: { price: 950, change: -2, trend: 'down' },
      muhanga: { price: 1050, change: 0, trend: 'stable' },
      huye: { price: 900, change: -5, trend: 'down' },
      rubavu: { price: 1150, change: 8, trend: 'up' },
    },
  },
  {
    id: 'avocados',
    name: 'Avocados',
    category: 'Fruits',
    unit: 'piece',
    prices: {
      musanze: { price: 200, change: 10, trend: 'up' },
      kimironko: { price: 250, change: 0, trend: 'stable' },
      nyabugogo: { price: 180, change: -5, trend: 'down' },
      muhanga: { price: 220, change: 3, trend: 'up' },
      huye: { price: 150, change: -8, trend: 'down' },
      rubavu: { price: 280, change: 12, trend: 'up' },
    },
  },
];

const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Meat', 'Dairy'];

export default function MultiMarketComparison() {
  const { t } = useLanguage();
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['musanze', 'kimironko', 'nyabugogo']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showMarketSelector, setShowMarketSelector] = useState(false);

  const toggleMarket = (marketId: string) => {
    if (selectedMarkets.includes(marketId)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter((m) => m !== marketId));
      }
    } else {
      setSelectedMarkets([...selectedMarkets, marketId]);
    }
  };

  const filteredProducts = useMemo(() => {
    return productPrices
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        const aPrice = Math.min(...selectedMarkets.map((m) => a.prices[m as keyof typeof a.prices]?.price || Infinity));
        const bPrice = Math.min(...selectedMarkets.map((m) => b.prices[m as keyof typeof b.prices]?.price || Infinity));
        return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      });
  }, [searchTerm, selectedCategory, sortBy, sortOrder, selectedMarkets]);

  const getBestPrice = (product: (typeof productPrices)[0]) => {
    let best = { market: '', price: Infinity };
    selectedMarkets.forEach((marketId) => {
      const priceData = product.prices[marketId as keyof typeof product.prices];
      if (priceData && priceData.price < best.price) {
        best = { market: marketId, price: priceData.price };
      }
    });
    return best;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-rose-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="icon-container">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text">{t('multiMarketComparison') || 'Multi-Market Price Comparison'}</h2>
              <p className="text-sm text-muted-foreground">
                {t('compareAcrossMarkets') || 'Compare prices across multiple markets to find the best deals'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowMarketSelector(!showMarketSelector)}
            className="btn-outline-premium h-9 px-3 text-sm"
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            {selectedMarkets.length} {t('markets') || 'Markets'}
            {showMarketSelector ? <ChevronUp className="h-4 w-4 ml-1.5" /> : <ChevronDown className="h-4 w-4 ml-1.5" />}
          </Button>
        </div>

        {/* Market Selector */}
        {showMarketSelector && (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <Label className="mb-3 block text-sm text-muted-foreground">{t('selectMarkets') || 'Select Markets to Compare'}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {markets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => toggleMarket(market.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedMarkets.includes(market.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Checkbox 
                      checked={selectedMarkets.includes(market.id)} 
                      className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="font-medium text-sm text-white">{market.name.replace(' Market', '')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">{market.district}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchProductsPlaceholder') || 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-white">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
              <SelectItem value="name" className="text-white">{t('sortByName') || 'Sort by Name'}</SelectItem>
              <SelectItem value="price" className="text-white">{t('sortByPrice') || 'Sort by Price'}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn-outline-premium"
          >
            {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </Card>

      {/* Comparison Table */}
      <Card className="overflow-hidden rounded-xl dark-glass border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground sticky left-0 bg-inherit z-10">
                  {t('product') || 'Product'}
                </th>
                {selectedMarkets.map((marketId) => {
                  const market = markets.find((m) => m.id === marketId);
                  return (
                    <th key={marketId} className="text-center p-3 text-xs font-semibold text-muted-foreground min-w-[130px]">
                      <div className="flex flex-col items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-white text-sm">{market?.name.replace(' Market', '')}</span>
                        <span className="text-[11px] text-muted-foreground">{market?.district}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="text-center p-3 text-xs font-semibold text-muted-foreground min-w-[110px]">
                  <div className="flex flex-col items-center gap-1">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span className="text-white text-sm">{t('bestPrice') || 'Best Price'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, idx) => {
                const bestPrice = getBestPrice(product);
                return (
                  <tr
                    key={product.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-white/5'
                    }`}
                  >
                    <td className="p-3 sticky left-0 bg-inherit z-10">
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category} • per {product.unit}</p>
                      </div>
                    </td>
                    {selectedMarkets.map((marketId) => {
                      const priceData = product.prices[marketId as keyof typeof product.prices];
                      const isBest = bestPrice.market === marketId;
                      return (
                        <td key={marketId} className="p-3 text-center">
                          {priceData ? (
                            <div className={`${isBest ? 'bg-primary/10 border border-primary/30 rounded-lg p-2' : 'rounded-lg p-2'}`}>
                              <div className="flex items-center justify-center gap-1">
                                <span className={`font-bold text-base ${isBest ? 'text-primary' : 'text-white'}`}>
                                  {priceData.price.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">RWF</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                {getTrendIcon(priceData.trend)}
                                <span className={`text-xs ${getTrendColor(priceData.trend)}`}>
                                  {priceData.change > 0 ? '+' : ''}
                                  {priceData.change}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center">
                      <div className="inline-block bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-lg p-2.5">
                        <p className="font-bold text-amber-400 text-base">{bestPrice.price.toLocaleString()} RWF</p>
                        <p className="text-xs text-amber-400/80">
                          @ {markets.find((m) => m.id === bestPrice.market)?.name.replace(' Market', '')}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights Cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 rounded-xl dark-glass border-white/10">
          <div className="flex items-center gap-3">
            <div className="icon-container-small">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('bestOverall') || 'Best Overall'}</p>
              <p className="font-semibold text-white">Huye Market</p>
              <p className="text-xs text-emerald-400">{t('lowestAveragePrices') || 'Lowest average prices'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10">
          <div className="flex items-center gap-3">
            <div className="icon-container-small">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('mostStable') || 'Most Stable'}</p>
              <p className="font-semibold text-white">Nyabugogo Market</p>
              <p className="text-xs text-amber-400">{t('fewestFluctuations') || 'Fewest price fluctuations'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10">
          <div className="flex items-center gap-3">
            <div className="icon-container-small">
              <Navigation className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('nearestToYou') || 'Nearest to You'}</p>
              <p className="font-semibold text-white">Kimironko Market</p>
              <p className="text-xs text-primary">{t('distanceAway') || '2.3 km away'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <Card className="p-3 rounded-xl dark-glass border-white/10">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">{t('legend') || 'Legend:'}</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-muted-foreground">{t('priceIncreasing') || 'Price Increasing'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-muted-foreground">{t('priceDecreasing') || 'Price Decreasing'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-muted-foreground">{t('stable') || 'Stable'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border border-primary/30 bg-primary/10"></div>
            <span className="text-muted-foreground">{t('bestPrice') || 'Best Price'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}