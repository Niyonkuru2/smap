import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MapPin, Navigation, Phone, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { 
  getCurrentLocation, 
  findNearbyMarkets, 
  formatDistance,
  getDirectionsUrl,
  type Coordinates,
  type Market
} from '../lib/geolocation';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export function NearbyMarkets() {
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [nearbyMarkets, setNearbyMarkets] = useState<Array<Market & { distance: number }>>([]);
  const { t } = useLanguage();

  const findMyLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      
      if (!location) {
        toast.error(t('couldNotGetLocation'));
        setLoading(false);
        return;
      }

      setUserLocation(location);
      const markets = findNearbyMarkets(location, 100); // 100km radius
      
      setNearbyMarkets(markets);
      toast.success(`${t('found')} ${markets.length} ${t('marketsFoundNear')}`);
    } catch (error) {
      console.error('Location error:', error);
      toast.error(t('couldNotGetLocation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('nearbyMarkets')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('findMarketsNear')}
          </p>
        </div>
        <Button onClick={findMyLocation} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('finding')}
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              {t('findNearMe')}
            </>
          )}
        </Button>
      </div>

      {nearbyMarkets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nearbyMarkets.map((market) => (
            <Card key={market.id} className="p-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-start justify-between">
                    <h4>{market.name}</h4>
                    <span className="text-sm bg-green-900 text-green-100 px-2 py-1 rounded">
                      {formatDistance(market.distance)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {market.province} • {market.district}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{market.address}</span>
                  </div>

                  {market.operatingHours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{market.operatingHours}</span>
                    </div>
                  )}

                  {market.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{market.contactPhone}</span>
                    </div>
                  )}
                </div>

                {userLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const url = getDirectionsUrl(userLocation, market);
                      window.open(url, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('getDirections')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && nearbyMarkets.length === 0 && (
        <Card className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="mb-2">{t('noMarketsFound')}</h4>
          <p className="text-sm text-muted-foreground mb-4">
            {t('clickFindNearMe')}
          </p>
        </Card>
      )}
    </div>
  );
}
