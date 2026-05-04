// Geolocation Services for Smart Market Price Monitoring and Prediction System (SMPMPS)

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Market {
  id: string;
  name: string;
  province: string;
  district: string;
  coordinates: Coordinates;
  address: string;
  operatingHours?: string;
  contactPhone?: string;
}

// Rwanda's provinces and major markets with real coordinates
export const RWANDA_MARKETS: Market[] = [
  // KIGALI CITY - 3 Markets
  {
    id: 'kimironko-market',
    name: 'Kimironko Market',
    province: 'Kigali City',
    district: 'Gasabo',
    coordinates: { latitude: -1.9432, longitude: 30.1045 },
    address: 'KG 9 Ave, Kigali',
    operatingHours: '6:00 AM - 6:00 PM',
    contactPhone: '+250 788 123 456'
  },
  {
    id: 'nyabugogo-market',
    name: 'Nyabugogo Market',
    province: 'Kigali City',
    district: 'Nyarugenge',
    coordinates: { latitude: -1.9578, longitude: 30.0447 },
    address: 'Nyabugogo Bus Park, Kigali',
    operatingHours: '7:00 AM - 5:00 PM',
    contactPhone: '+250 788 654 321'
  },
  {
    id: 'kimisagara-market',
    name: 'Kimisagara Market',
    province: 'Kigali City',
    district: 'Nyarugenge',
    coordinates: { latitude: -1.9667, longitude: 30.0667 },
    address: 'Kimisagara, Kigali',
    operatingHours: '6:30 AM - 5:30 PM',
    contactPhone: '+250 788 987 654'
  },
  
  // NORTHERN PROVINCE - 2 Markets
  {
    id: 'musanze-market',
    name: 'Musanze Market',
    province: 'Northern Province',
    district: 'Musanze',
    coordinates: { latitude: -1.4992, longitude: 29.6353 },
    address: 'KN 2 Ave, Musanze',
    operatingHours: '6:00 AM - 6:00 PM',
    contactPhone: '+250 788 555 666'
  },
  {
    id: 'gicumbi-market',
    name: 'Gicumbi Market',
    province: 'Northern Province',
    district: 'Gicumbi',
    coordinates: { latitude: -1.5833, longitude: 30.0667 },
    address: 'Byumba Town, Gicumbi',
    operatingHours: '6:00 AM - 6:00 PM',
    contactPhone: '+250 788 222 444'
  },
  
  // EASTERN PROVINCE - 2 Markets
  {
    id: 'kayonza-market',
    name: 'Kayonza Market',
    province: 'Eastern Province',
    district: 'Kayonza',
    coordinates: { latitude: -1.8833, longitude: 30.4167 },
    address: 'Kayonza Town Center',
    operatingHours: '6:00 AM - 7:00 PM',
    contactPhone: '+250 788 555 666'
  },
  {
    id: 'rwamagana-market',
    name: 'Rwamagana Market',
    province: 'Eastern Province',
    district: 'Rwamagana',
    coordinates: { latitude: -1.9486, longitude: 30.4347 },
    address: 'Rwamagana Town',
    operatingHours: '6:00 AM - 6:00 PM',
    contactPhone: '+250 788 444 555'
  },
  
  // SOUTHERN PROVINCE - 2 Markets
  {
    id: 'muhanga-market',
    name: 'Muhanga Market',
    province: 'Southern Province',
    district: 'Muhanga',
    coordinates: { latitude: -2.0833, longitude: 29.7500 },
    address: 'Muhanga Town Center',
    operatingHours: '6:00 AM - 5:30 PM',
    contactPhone: '+250 788 888 999'
  },
  {
    id: 'huye-market',
    name: 'Huye Market',
    province: 'Southern Province',
    district: 'Huye',
    coordinates: { latitude: -2.5959, longitude: 29.7389 },
    address: 'Butare Town, Huye',
    operatingHours: '6:00 AM - 6:00 PM',
    contactPhone: '+250 788 777 888'
  },
  
  // WESTERN PROVINCE - 2 Markets
  {
    id: 'rubavu-market',
    name: 'Rubavu Market',
    province: 'Western Province',
    district: 'Rubavu',
    coordinates: { latitude: -1.6769, longitude: 29.2600 },
    address: 'Gisenyi, Rubavu',
    operatingHours: '6:00 AM - 7:00 PM',
    contactPhone: '+250 788 333 444'
  },
  {
    id: 'rusizi-market',
    name: 'Rusizi Market',
    province: 'Western Province',
    district: 'Rusizi',
    coordinates: { latitude: -2.4667, longitude: 28.9000 },
    address: 'Kamembe, Rusizi',
    operatingHours: '6:00 AM - 5:30 PM',
    contactPhone: '+250 788 444 555'
  }
];

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
    Math.cos(toRad(coord2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Get user's current location
export async function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Find markets near a location
export function findNearbyMarkets(
  userLocation: Coordinates,
  maxDistance: number = 50 // km
): Array<Market & { distance: number }> {
  return RWANDA_MARKETS
    .map(market => ({
      ...market,
      distance: calculateDistance(userLocation, market.coordinates)
    }))
    .filter(market => market.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

// Get market by ID
export function getMarketById(marketId: string): Market | undefined {
  return RWANDA_MARKETS.find(m => m.id === marketId);
}

// Get markets by province
export function getMarketsByProvince(province: string): Market[] {
  return RWANDA_MARKETS.filter(m => m.province === province);
}

// Get all provinces
export function getAllProvinces(): string[] {
  return [...new Set(RWANDA_MARKETS.map(m => m.province))];
}

// Get Google Maps directions URL
export function getDirectionsUrl(
  userLocation: Coordinates,
  market: Market
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${market.coordinates.latitude},${market.coordinates.longitude}&travelmode=driving`;
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)} km`;
}

// Check if location is in Rwanda
export function isInRwanda(coordinates: Coordinates): boolean {
  // Rwanda boundaries (approximate)
  const rwandaBounds = {
    north: -1.0,
    south: -2.84,
    east: 30.9,
    west: 28.85
  };
  
  return (
    coordinates.latitude <= rwandaBounds.north &&
    coordinates.latitude >= rwandaBounds.south &&
    coordinates.longitude <= rwandaBounds.east &&
    coordinates.longitude >= rwandaBounds.west
  );
}

// Get nearest market
export function getNearestMarket(
  userLocation: Coordinates
): (Market & { distance: number }) | null {
  const nearbyMarkets = findNearbyMarkets(userLocation, 200); // 200km max
  return nearbyMarkets.length > 0 ? nearbyMarkets[0] : null;
}