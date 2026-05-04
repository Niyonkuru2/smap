/**
 * Route Planning & Heat Maps Module
 * For market navigation and price zone visualization
 */

// Haversine formula for distance calculation
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface Market {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface PricePoint {
  marketId: string;
  price: number;
  latitude: number;
  longitude: number;
}

// Find optimal route to visit multiple markets
export function findOptimalRoute(
  startLat: number,
  startLon: number,
  markets: Market[]
): Market[] {
  if (markets.length <= 1) return markets;

  // Nearest neighbor algorithm for route optimization
  const visited: Market[] = [];
  const remaining = [...markets];
  let currentLat = startLat;
  let currentLon = startLon;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateDistance(
        currentLat,
        currentLon,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nearest = remaining.splice(nearestIndex, 1)[0];
    nearest.distance = nearestDistance;
    visited.push(nearest);
    currentLat = nearest.latitude;
    currentLon = nearest.longitude;
  }

  return visited;
}

// Calculate total route distance
export function calculateTotalRouteDistance(route: Market[]): number {
  return route.reduce((total, market) => total + (market.distance || 0), 0);
}

// Generate heat map data for price visualization
export function generateHeatMapData(
  pricePoints: PricePoint[],
  productId?: number
): { lat: number; lng: number; intensity: number }[] {
  if (pricePoints.length === 0) return [];

  // Calculate price statistics
  const prices = pricePoints.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Convert to heat map format
  // Lower prices = higher intensity (green zones)
  // Higher prices = lower intensity (red zones)
  return pricePoints.map(point => ({
    lat: point.latitude,
    lng: point.longitude,
    // Invert so lower prices have higher intensity
    intensity: 1 - (point.price - minPrice) / priceRange
  }));
}

// Get price zones (clusters of similar prices)
export function getPriceZones(
  pricePoints: PricePoint[],
  zoneCount: number = 3
): { zone: string; minPrice: number; maxPrice: number; markets: string[] }[] {
  if (pricePoints.length === 0) return [];

  const sortedPoints = [...pricePoints].sort((a, b) => a.price - b.price);
  const zones: { zone: string; minPrice: number; maxPrice: number; markets: string[] }[] = [];
  const zoneNames = ['Budget-Friendly', 'Mid-Range', 'Premium'];
  const zoneSize = Math.ceil(sortedPoints.length / zoneCount);

  for (let i = 0; i < zoneCount; i++) {
    const start = i * zoneSize;
    const end = Math.min(start + zoneSize, sortedPoints.length);
    const zonePoints = sortedPoints.slice(start, end);

    if (zonePoints.length > 0) {
      zones.push({
        zone: zoneNames[i] || `Zone ${i + 1}`,
        minPrice: zonePoints[0].price,
        maxPrice: zonePoints[zonePoints.length - 1].price,
        markets: zonePoints.map(p => p.marketId)
      });
    }
  }

  return zones;
}

// Estimate travel time (rough estimate based on distance)
export function estimateTravelTime(
  distanceKm: number,
  transportMode: 'walk' | 'bike' | 'moto' | 'car' = 'moto'
): { minutes: number; formatted: string } {
  const speeds: Record<string, number> = {
    walk: 5,    // 5 km/h
    bike: 15,   // 15 km/h
    moto: 25,   // 25 km/h (motorcycle taxi)
    car: 30     // 30 km/h (accounting for traffic)
  };

  const speed = speeds[transportMode];
  const hours = distanceKm / speed;
  const minutes = Math.round(hours * 60);

  let formatted: string;
  if (minutes < 60) {
    formatted = `${minutes} min`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    formatted = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  return { minutes, formatted };
}

// Get directions URL for Google Maps
export function getGoogleMapsDirectionsUrl(
  startLat: number,
  startLon: number,
  waypoints: { lat: number; lon: number }[]
): string {
  if (waypoints.length === 0) return '';

  const destination = waypoints[waypoints.length - 1];
  const waypointStr = waypoints
    .slice(0, -1)
    .map(w => `${w.lat},${w.lon}`)
    .join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLon}&destination=${destination.lat},${destination.lon}`;
  
  if (waypointStr) {
    url += `&waypoints=${waypointStr}`;
  }

  return url;
}

// Find markets with best prices within distance
export function findBestPricesNearby(
  userLat: number,
  userLon: number,
  pricePoints: PricePoint[],
  maxDistanceKm: number = 5
): (PricePoint & { distance: number })[] {
  return pricePoints
    .map(point => ({
      ...point,
      distance: calculateDistance(userLat, userLon, point.latitude, point.longitude)
    }))
    .filter(point => point.distance <= maxDistanceKm)
    .sort((a, b) => a.price - b.price);
}

// Calculate savings by traveling to cheaper market
export function calculateSavingsByTravel(
  currentPrice: number,
  cheaperPrice: number,
  quantity: number,
  travelCost: number = 0
): { savings: number; worthIt: boolean; breakEvenQuantity: number } {
  const priceDiff = currentPrice - cheaperPrice;
  const totalSavings = priceDiff * quantity - travelCost;
  const breakEvenQuantity = travelCost > 0 ? Math.ceil(travelCost / priceDiff) : 0;

  return {
    savings: totalSavings,
    worthIt: totalSavings > 0,
    breakEvenQuantity
  };
}

export default {
  calculateDistance,
  findOptimalRoute,
  calculateTotalRouteDistance,
  generateHeatMapData,
  getPriceZones,
  estimateTravelTime,
  getGoogleMapsDirectionsUrl,
  findBestPricesNearby,
  calculateSavingsByTravel
};
