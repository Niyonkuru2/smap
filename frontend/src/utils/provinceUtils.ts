// Province color schemes for visual differentiation
export const provinceColors = {
  'Kigali City': {
    bg: 'bg-green-950',
    text: 'text-green-100',
    border: 'border-green-700',
    badge: 'bg-green-700',
    badgeText: 'text-white',
    gradient: 'from-green-700 to-green-800',
    icon: '🏙️',
    emoji: '🏙️'
  },
  'Northern Province': {
    bg: 'bg-green-950',
    text: 'text-green-100',
    border: 'border-green-700',
    badge: 'bg-green-700',
    badgeText: 'text-white',
    gradient: 'from-green-700 to-green-800',
    icon: '🌄',
    emoji: '🌄'
  },
  'Eastern Province': {
    bg: 'bg-green-900',
    text: 'text-green-50',
    border: 'border-green-700',
    badge: 'bg-green-600',
    badgeText: 'text-white',
    gradient: 'from-green-600 to-green-700',
    icon: '🌅',
    emoji: '🌅'
  },
  'Southern Province': {
    bg: 'bg-green-900',
    text: 'text-green-50',
    border: 'border-green-700',
    badge: 'bg-green-600',
    badgeText: 'text-white',
    gradient: 'from-green-600 to-green-700',
    icon: '🏞️',
    emoji: '🏞️'
  },
  'Western Province': {
    bg: 'bg-green-950',
    text: 'text-green-100',
    border: 'border-green-700',
    badge: 'bg-green-700',
    badgeText: 'text-white',
    gradient: 'from-green-700 to-green-800',
    icon: '🌊',
    emoji: '🌊'
  }
};

export function getProvinceColor(province?: string) {
  if (!province) return provinceColors['Kigali City'];
  return provinceColors[province as keyof typeof provinceColors] || provinceColors['Kigali City'];
}

export function getProvinceIcon(province?: string): string {
  const color = getProvinceColor(province);
  return color.emoji;
}

// Helper to get all provinces for filters
export const allProvinces = [
  'Kigali City',
  'Northern Province',
  'Eastern Province',
  'Southern Province',
  'Western Province'
] as const;

export type Province = typeof allProvinces[number];
