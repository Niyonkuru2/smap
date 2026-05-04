import { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Loader2,
  Info,
  Sparkles,
  Globe
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Sample prediction data
const predictions = [
  {
    id: 'tomatoes',
    product: 'Tomatoes',
    category: 'Vegetables',
    currentPrice: 800,
    unit: 'kg',
    predictions: [
      { days: 7, price: 780, confidence: 85, trend: 'down' },
      { days: 14, price: 750, confidence: 78, trend: 'down' },
      { days: 30, price: 820, confidence: 65, trend: 'up' },
    ],
    factors: ['Seasonal harvest incoming', 'Increased local production', 'Lower transport costs'],
    recommendation: 'Wait 1-2 weeks for lower prices before bulk buying.',
  },
  {
    id: 'rice',
    product: 'Rice',
    category: 'Grains',
    currentPrice: 1450,
    unit: 'kg',
    predictions: [
      { days: 7, price: 1480, confidence: 82, trend: 'up' },
      { days: 14, price: 1520, confidence: 75, trend: 'up' },
      { days: 30, price: 1500, confidence: 68, trend: 'stable' },
    ],
    factors: ['Import delays expected', 'Currency fluctuation', 'Steady demand'],
    recommendation: 'Consider buying now before prices increase further.',
  },
  {
    id: 'beans',
    product: 'Beans',
    category: 'Grains',
    currentPrice: 920,
    unit: 'kg',
    predictions: [
      { days: 7, price: 910, confidence: 80, trend: 'down' },
      { days: 14, price: 890, confidence: 73, trend: 'down' },
      { days: 30, price: 950, confidence: 60, trend: 'up' },
    ],
    factors: ['New harvest arriving', 'Good crop yield expected', 'School term ending'],
    recommendation: 'Best time to buy will be in 2-3 weeks.',
  },
  {
    id: 'onions',
    product: 'Onions',
    category: 'Vegetables',
    currentPrice: 600,
    unit: 'kg',
    predictions: [
      { days: 7, price: 620, confidence: 78, trend: 'up' },
      { days: 14, price: 650, confidence: 72, trend: 'up' },
      { days: 30, price: 580, confidence: 65, trend: 'down' },
    ],
    factors: ['Short-term shortage', 'Import from neighboring countries', 'Local harvest in 3 weeks'],
    recommendation: 'If urgent, buy now. Otherwise, wait for local harvest.',
  },
  {
    id: 'bananas',
    product: 'Bananas',
    category: 'Fruits',
    currentPrice: 1000,
    unit: 'bunch',
    predictions: [
      { days: 7, price: 1000, confidence: 88, trend: 'stable' },
      { days: 14, price: 980, confidence: 82, trend: 'down' },
      { days: 30, price: 950, confidence: 75, trend: 'down' },
    ],
    factors: ['Consistent supply', 'Peak season approaching', 'Stable demand'],
    recommendation: 'Prices expected to remain stable or decrease slightly.',
  },
  {
    id: 'avocados',
    product: 'Avocados',
    category: 'Fruits',
    currentPrice: 220,
    unit: 'piece',
    predictions: [
      { days: 7, price: 250, confidence: 85, trend: 'up' },
      { days: 14, price: 280, confidence: 80, trend: 'up' },
      { days: 30, price: 200, confidence: 70, trend: 'down' },
    ],
    factors: ['End of current season', 'High export demand', 'New season starting in 4 weeks'],
    recommendation: 'Expect price spike. New season will bring lower prices.',
  },
];

const categories = ['All', 'Vegetables', 'Fruits', 'Grains'];
const timeframes = [
  { value: '7', label: '7 Days' },
  { value: '14', label: '14 Days' },
  { value: '30', label: '30 Days' },
];

export default function PriceForecast() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => 
      selectedCategory === 'All' || p.category === selectedCategory
    );
  }, [selectedCategory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const getTrendIcon = (trend: string, size = 'h-5 w-5') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={`${size} text-amber-400`} />;
      case 'down':
        return <TrendingDown className={`${size} text-emerald-400`} />;
      default:
        return <Minus className={`${size} text-gray-500`} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (confidence >= 65) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getPriceChange = (current: number, predicted: number) => {
    const change = ((predicted - current) / current) * 100;
    return change.toFixed(1);
  };

  const getTrendText = (trend: string) => {
    if (trend === 'up') return t('increase') || 'increase';
    if (trend === 'down') return t('decrease') || 'decrease';
    return t('remainStable') || 'remain stable';
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="icon-container">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text">{t('priceForecast') || 'AI Price Forecast'}</h2>
              <p className="text-sm text-muted-foreground">
                {t('forecastDesc') || 'Machine learning predictions for future market prices'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-outline-premium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? (t('updating') || 'Updating...') : (t('refresh') || 'Refresh')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">{t('category') || 'Category'}</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">{t('forecastPeriod') || 'Forecast Period'}</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {timeframes.map(tf => (
                  <SelectItem key={tf.value} value={tf.value} className="text-white">{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Model Info Card */}
      <Card className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
        <div className="flex items-start gap-3">
          <div className="icon-container-small flex-shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-white mb-1">{t('howAIWorks') || 'How our AI predictions work:'}</p>
            <p className="text-xs">
              {t('aiDescription') || 'Our model analyzes historical price data, seasonal patterns, supply chain factors, and market trends using statistical regression and machine learning algorithms. Confidence scores indicate prediction reliability based on data availability and market stability.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Predictions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPredictions.map((prediction) => {
          const forecastData = prediction.predictions.find(p => p.days === parseInt(selectedTimeframe));
          const priceChange = forecastData ? getPriceChange(prediction.currentPrice, forecastData.price) : '0';
          const isSelected = selectedProduct === prediction.id;

          return (
            <Card
              key={prediction.id}
              className={`rounded-xl dark-glass border-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 cursor-pointer ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedProduct(isSelected ? null : prediction.id)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{prediction.product}</h3>
                    <p className="text-xs text-muted-foreground">{prediction.category}</p>
                  </div>
                  {forecastData && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(forecastData.confidence)}`}>
                      {forecastData.confidence}% {t('confidence') || 'confidence'}
                    </div>
                  )}
                </div>

                {/* Price Comparison */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">{t('current') || 'Current'}</p>
                    <p className="text-xl font-bold text-white">{prediction.currentPrice.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">RWF/{prediction.unit}</p>
                  </div>
                  {forecastData && (
                    <div className={`p-3 rounded-lg border ${
                      forecastData.trend === 'down' ? 'bg-emerald-500/10 border-emerald-500/30' :
                      forecastData.trend === 'up' ? 'bg-amber-500/10 border-amber-500/30' :
                      'bg-gray-500/10 border-gray-500/30'
                    }`}>
                      <p className="text-xs text-muted-foreground">{selectedTimeframe}-{t('day') || 'Day'}</p>
                      <p className="text-xl font-bold text-white flex items-center gap-1">
                        {forecastData.price.toLocaleString()}
                        {getTrendIcon(forecastData.trend, 'h-4 w-4')}
                      </p>
                      <p className={`text-xs font-medium ${
                        parseFloat(priceChange) > 0 ? 'text-amber-400' :
                        parseFloat(priceChange) < 0 ? 'text-emerald-400' :
                        'text-gray-400'
                      }`}>
                        {parseFloat(priceChange) > 0 ? '+' : ''}{priceChange}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Trend Indicator */}
                <div className="flex items-center gap-2 mb-3">
                  {getTrendIcon(forecastData?.trend || 'stable')}
                  <span className="text-sm text-muted-foreground">
                    {t('priceExpectedTo') || 'Price expected to'} {getTrendText(forecastData?.trend || 'stable')}
                  </span>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="pt-3 border-t border-white/10 mt-3 space-y-3 animate-fadeIn">
                    {/* All Timeframe Predictions */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {t('forecastTimeline') || 'Forecast Timeline:'}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {prediction.predictions.map((pred) => (
                          <div 
                            key={pred.days}
                            className={`p-2 rounded-lg text-center transition-all ${
                              pred.days === parseInt(selectedTimeframe) 
                                ? 'bg-primary/20 border border-primary/50' 
                                : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <p className="text-xs text-muted-foreground">{pred.days}d</p>
                            <p className="font-semibold text-sm text-white">{pred.price}</p>
                            <div className="flex justify-center mt-1">
                              {getTrendIcon(pred.trend, 'h-3 w-3')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Factors */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {t('keyFactors') || 'Key Factors:'}
                      </p>
                      <ul className="text-xs space-y-1">
                        {prediction.factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 mt-0.5 text-primary" />
                            <span className="text-muted-foreground">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendation */}
                    <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30">
                      <p className="text-xs font-medium text-primary flex items-center gap-1 mb-1">
                        <Lightbulb className="h-3 w-3" /> {t('aiRecommendation') || 'AI Recommendation:'}
                      </p>
                      <p className="text-sm text-white">{prediction.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 rounded-xl dark-glass border-white/10">
          <div className="flex items-center gap-3">
            <div className="icon-container-small">
              <TrendingDown className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('expectedToDecrease') || 'Expected to Decrease'}</p>
              <p className="font-bold text-xl text-white">
                {predictions.filter(p => p.predictions.find(pr => pr.days === parseInt(selectedTimeframe))?.trend === 'down').length}
              </p>
              <p className="text-xs text-emerald-400">{t('goodTimeToWait') || 'Good time to wait'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10">
          <div className="flex items-center gap-3">
            <div className="icon-container-small">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('expectedToIncrease') || 'Expected to Increase'}</p>
              <p className="font-bold text-xl text-white">
                {predictions.filter(p => p.predictions.find(pr => pr.days === parseInt(selectedTimeframe))?.trend === 'up').length}
              </p>
              <p className="text-xs text-amber-400">{t('considerBuyingNow') || 'Consider buying now'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10">
          <div className="flex items-center gap-3">
            <div className="icon-container-small">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('averageConfidence') || 'Average Confidence'}</p>
              <p className="font-bold text-xl text-white">
                {Math.round(predictions.reduce((acc, p) => acc + (p.predictions.find(pr => pr.days === parseInt(selectedTimeframe))?.confidence || 0), 0) / predictions.length)}%
              </p>
              <p className="text-xs text-primary">{t('modelAccuracy') || 'Model accuracy'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">{t('importantDisclaimer') || 'Important Disclaimer'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('disclaimerText') || 'These predictions are generated by AI models based on historical data and market patterns. Actual prices may vary due to unforeseen circumstances. Use this information as a guide, not a guarantee. Always verify current prices before making purchasing decisions.'}
            </p>
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}