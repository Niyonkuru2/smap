import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { 
  MapPin, 
  Navigation, 
  Route as RouteIcon, 
  Clock, 
  DollarSign,
  ExternalLink,
  Bike,
  Car,
  Footprints,
  Loader2
} from 'lucide-react';
import { 
  calculateDistance, 
  findOptimalRoute, 
  estimateTravelTime,
  getGoogleMapsDirectionsUrl,
  findBestPricesNearby,
  getPriceZones
} from '../../lib/routePlanning';
import { toast } from 'sonner';

interface Market {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  province?: string;
  district?: string;
  distance?: number; // Distance from user or previous point in route
}

interface PricePoint {
  marketId: string;
  marketName: string;
  price: number;
  latitude: number;
  longitude: number;
}

interface RoutePlannerProps {
  markets: Market[];
  pricePoints?: PricePoint[];
  productName?: string;
}

export function RoutePlanner({ markets, pricePoints = [], productName }: RoutePlannerProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedMarkets, setSelectedMarkets] = useState<Market[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<Market[]>([]);
  const [maxDistance, setMaxDistance] = useState(5);
  const [transportMode, setTransportMode] = useState<'walk' | 'bike' | 'moto' | 'car'>('moto');
  const [loading, setLoading] = useState(false);
  const [nearbyMarkets, setNearbyMarkets] = useState<(Market & { distance: number })[]>([]);

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to Kigali center
          setUserLocation({ lat: -1.9403, lon: 29.8739 });
        }
      );
    }
  }, []);

  // Find nearby markets when location or max distance changes
  useEffect(() => {
    if (userLocation && markets.length > 0) {
      const nearby = markets
        .map(market => ({
          ...market,
          distance: calculateDistance(userLocation.lat, userLocation.lon, market.latitude, market.longitude)
        }))
        .filter(m => m.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
      
      setNearbyMarkets(nearby);
    }
  }, [userLocation, markets, maxDistance]);

  const handleOptimizeRoute = () => {
    if (!userLocation || selectedMarkets.length === 0) {
      toast.error('Please select at least one market');
      return;
    }

    setLoading(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const route = findOptimalRoute(userLocation.lat, userLocation.lon, selectedMarkets);
      setOptimizedRoute(route);
      setLoading(false);
      toast.success('Route optimized!');
    }, 500);
  };

  const handleOpenInMaps = () => {
    if (!userLocation || optimizedRoute.length === 0) return;

    const waypoints = optimizedRoute.map(m => ({ lat: m.latitude, lon: m.longitude }));
    const url = getGoogleMapsDirectionsUrl(userLocation.lat, userLocation.lon, waypoints);
    window.open(url, '_blank');
  };

  const toggleMarketSelection = (market: Market) => {
    setSelectedMarkets(prev => {
      const isSelected = prev.some(m => m.id === market.id);
      if (isSelected) {
        return prev.filter(m => m.id !== market.id);
      } else {
        return [...prev, market];
      }
    });
    setOptimizedRoute([]);
  };

  const totalDistance = optimizedRoute.reduce((sum, m) => sum + (m.distance || 0), 0);
  const totalTime = estimateTravelTime(totalDistance, transportMode);

  const priceZones = pricePoints.length > 0 ? getPriceZones(pricePoints) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5 text-green-500" />
            Route Planner
            {productName && (
              <Badge variant="secondary">{productName}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transport Mode */}
          <div className="flex gap-2">
            <Button
              variant={transportMode === 'walk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransportMode('walk')}
            >
              <Footprints className="h-4 w-4 mr-1" />
              Walk
            </Button>
            <Button
              variant={transportMode === 'bike' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransportMode('bike')}
            >
              <Bike className="h-4 w-4 mr-1" />
              Bike
            </Button>
            <Button
              variant={transportMode === 'moto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransportMode('moto')}
            >
              <Navigation className="h-4 w-4 mr-1" />
              Moto
            </Button>
            <Button
              variant={transportMode === 'car' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransportMode('car')}
            >
              <Car className="h-4 w-4 mr-1" />
              Car
            </Button>
          </div>

          {/* Distance Slider */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Search radius: {maxDistance} km
            </label>
            <Slider
              value={[maxDistance]}
              onValueChange={(value) => setMaxDistance(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {userLocation ? (
              <span>Your location detected</span>
            ) : (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Getting location...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Nearby Markets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nearby Markets ({nearbyMarkets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {nearbyMarkets.map(market => {
              const isSelected = selectedMarkets.some(m => m.id === market.id);
              const pricePoint = pricePoints.find(p => p.marketId === market.id);
              
              return (
                <div
                  key={market.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-green-500 bg-green-950 dark:bg-green-900' 
                      : 'border-border hover:border-green-400'
                  }`}
                  onClick={() => toggleMarketSelection(market)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{market.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {market.distance.toFixed(1)} km away
                      </p>
                    </div>
                    <div className="text-right">
                      {pricePoint && (
                        <p className="font-semibold text-green-600">
                          {pricePoint.price.toLocaleString()} RWF
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {estimateTravelTime(market.distance, transportMode).formatted}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {nearbyMarkets.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No markets found within {maxDistance} km
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Zones */}
      {priceZones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceZones.map((zone, idx) => (
                <div
                  key={zone.zone}
                  className={`p-3 rounded-lg ${
                    idx === 0 
                      ? 'bg-green-950 border-green-700 dark:bg-green-900' 
                      : idx === priceZones.length - 1 
                        ? 'bg-green-900 border-green-600 dark:bg-green-950'
                        : 'bg-green-800 border-green-600 dark:bg-green-900'
                  } border`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{zone.zone}</span>
                    <span className="text-sm">
                      {zone.minPrice.toLocaleString()} - {zone.maxPrice.toLocaleString()} RWF
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {zone.markets.length} market{zone.markets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Markets & Route */}
      {selectedMarkets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Selected ({selectedMarkets.length}) 
              {optimizedRoute.length > 0 && ' - Optimized Route'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optimizedRoute.length > 0 ? (
              <>
                <div className="space-y-2">
                  {optimizedRoute.map((market, idx) => (
                    <div key={market.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{market.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {market.distance?.toFixed(1)} km from previous
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Route Summary */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total Distance:</span>
                    <span className="font-medium">{totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Estimated Time:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {totalTime.formatted}
                    </span>
                  </div>
                </div>

                <Button className="w-full" onClick={handleOpenInMaps}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              </>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleOptimizeRoute}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <RouteIcon className="h-4 w-4 mr-2" />
                    Optimize Route
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RoutePlanner;
