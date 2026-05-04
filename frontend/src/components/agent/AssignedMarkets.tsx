import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { MapPin, Navigation, Clock, Users, Package, TrendingUp, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AssignedMarketsProps {
  agentId: string;
}

// Sample assigned markets data
const assignedMarkets = [
  {
    id: 'musanze',
    name: 'Musanze Market',
    district: 'Musanze',
    province: 'Northern Province',
    coordinates: { lat: -1.4997, lng: 29.6347 },
    vendorCount: 245,
    productCount: 156,
    lastCollection: '2026-02-12 09:30 AM',
    todayCollections: 2,
    weeklyTarget: 7,
    weeklyCompleted: 5,
    status: 'active',
  },
  {
    id: 'kimironko',
    name: 'Kimironko Market',
    district: 'Gasabo',
    province: 'Kigali City',
    coordinates: { lat: -1.9403, lng: 30.1120 },
    vendorCount: 380,
    productCount: 210,
    lastCollection: '2026-02-12 11:45 AM',
    todayCollections: 1,
    weeklyTarget: 7,
    weeklyCompleted: 4,
    status: 'active',
  },
  {
    id: 'nyabugogo',
    name: 'Nyabugogo Market',
    district: 'Nyarugenge',
    province: 'Kigali City',
    coordinates: { lat: -1.9361, lng: 30.0467 },
    vendorCount: 520,
    productCount: 185,
    lastCollection: '2026-02-11 02:30 PM',
    todayCollections: 0,
    weeklyTarget: 7,
    weeklyCompleted: 3,
    status: 'pending_today',
  },
];

export default function AssignedMarkets({ agentId }: AssignedMarketsProps) {
  const { t } = useLanguage();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  const getProgressColor = (completed: number, target: number) => {
    const percentage = (completed / target) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-green-600';
    return 'bg-green-700';
  };

  const getStatusBadge = (status: string, todayCollections: number) => {
    if (todayCollections > 0) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
          ✓ {t('collectedToday') || 'Collected Today'}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200 border border-green-700">
        ⏳ {t('pendingToday') || 'Pending Today'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('assignedMarkets') || 'Assigned Markets'}</h2>
            <p className="text-sm text-muted-foreground">
              {t('assignedMarketsDesc') || 'Your designated markets for price data collection'}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-950 rounded-lg">
            <p className="text-2xl font-bold text-green-400">{assignedMarkets.length}</p>
            <p className="text-xs text-muted-foreground">{t('totalMarkets') || 'Total Markets'}</p>
          </div>
          <div className="text-center p-3 bg-green-900 rounded-lg">
            <p className="text-2xl font-bold text-green-300">
              {assignedMarkets.filter(m => m.todayCollections > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">{t('completedToday') || 'Completed Today'}</p>
          </div>
          <div className="text-center p-3 bg-green-950 rounded-lg">
            <p className="text-2xl font-bold text-green-300">
              {assignedMarkets.filter(m => m.todayCollections === 0).length}
            </p>
            <p className="text-xs text-muted-foreground">{t('pendingToday') || 'Pending Today'}</p>
          </div>
        </div>
      </Card>

      {/* Markets List */}
      <div className="space-y-4">
        {assignedMarkets.map((market) => (
          <Card 
            key={market.id}
            className={`p-5 glass-card transition-all cursor-pointer hover:shadow-lg ${
              selectedMarket === market.id ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setSelectedMarket(selectedMarket === market.id ? null : market.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  market.todayCollections > 0 
                    ? 'bg-gradient-to-br from-green-400 to-green-500' 
                    : 'bg-gradient-to-br from-orange-400 to-orange-500'
                }`}>
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{market.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {market.district}, {market.province}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {market.vendorCount} vendors
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" /> {market.productCount} products
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(market.status, market.todayCollections)}
                <ChevronRight className={`h-5 w-5 mt-2 text-gray-400 transition-transform ${
                  selectedMarket === market.id ? 'rotate-90' : ''
                }`} />
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('weeklyProgress') || 'Weekly Progress'}</span>
                <span className="font-medium">{market.weeklyCompleted}/{market.weeklyTarget} days</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(market.weeklyCompleted, market.weeklyTarget)} transition-all`}
                  style={{ width: `${(market.weeklyCompleted / market.weeklyTarget) * 100}%` }}
                />
              </div>
            </div>

            {/* Expanded Details */}
            {selectedMarket === market.id && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-900 rounded-lg">
                    <p className="text-xs text-muted-foreground">{t('lastCollection') || 'Last Collection'}</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {market.lastCollection}
                    </p>
                  </div>
                  <div className="p-3 bg-green-900 rounded-lg">
                    <p className="text-xs text-muted-foreground">{t('todayCollections') || "Today's Collections"}</p>
                    <p className="font-medium">{market.todayCollections}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500"
                    onClick={() => window.location.href = '/agent/collection'}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {t('startCollection') || 'Start Collection'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`https://maps.google.com/?q=${market.name}`, '_blank')}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {t('getDirections') || 'Get Directions'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
