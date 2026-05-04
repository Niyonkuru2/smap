// Anomaly Detection Module for Price Data
// Detects unusual price spikes and suspicious patterns

export interface AnomalyAlert {
  id: string;
  type: 'price_spike' | 'price_drop' | 'unusual_pattern' | 'data_inconsistency' | 'suspicious_vendor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  product: string;
  market: string;
  vendor?: string;
  currentPrice: number;
  expectedPrice: number;
  deviation: number;
  timestamp: string;
  details: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
  assignedTo?: string;
}

export interface AnomalyConfig {
  priceChangeThreshold: number; // % change that triggers alert
  stdDeviationThreshold: number; // Number of std deviations
  minDataPoints: number; // Minimum historical data points needed
  timeWindowDays: number; // Time window for analysis
}

const DEFAULT_CONFIG: AnomalyConfig = {
  priceChangeThreshold: 20, // 20% change triggers alert
  stdDeviationThreshold: 2.5, // 2.5 standard deviations
  minDataPoints: 7, // Need at least 7 data points
  timeWindowDays: 30, // Look at last 30 days
};

// Calculate mean of array
function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Calculate standard deviation
function standardDeviation(arr: number[]): number {
  const avg = mean(arr);
  const squaredDiffs = arr.map(x => Math.pow(x - avg, 2));
  return Math.sqrt(mean(squaredDiffs));
}

// Calculate Z-score
function zScore(value: number, arr: number[]): number {
  const avg = mean(arr);
  const std = standardDeviation(arr);
  if (std === 0) return 0;
  return (value - avg) / std;
}

// Detect price anomalies
export function detectPriceAnomaly(
  currentPrice: number,
  historicalPrices: number[],
  config: AnomalyConfig = DEFAULT_CONFIG
): { isAnomaly: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let anomalyScore = 0;

  if (historicalPrices.length < config.minDataPoints) {
    return { isAnomaly: false, score: 0, reasons: ['Insufficient historical data'] };
  }

  const avgPrice = mean(historicalPrices);
  const std = standardDeviation(historicalPrices);
  const z = zScore(currentPrice, historicalPrices);
  const previousPrice = historicalPrices[historicalPrices.length - 1];
  const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;

  // Check for sudden price spike/drop
  if (Math.abs(percentChange) > config.priceChangeThreshold) {
    anomalyScore += 30;
    reasons.push(`Price ${percentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% (threshold: ${config.priceChangeThreshold}%)`);
  }

  // Check for statistical outlier
  if (Math.abs(z) > config.stdDeviationThreshold) {
    anomalyScore += 40;
    reasons.push(`Price is ${Math.abs(z).toFixed(1)} standard deviations from mean`);
  }

  // Check for price outside historical range
  const minHistorical = Math.min(...historicalPrices);
  const maxHistorical = Math.max(...historicalPrices);
  const rangeBuffer = (maxHistorical - minHistorical) * 0.2;
  
  if (currentPrice > maxHistorical + rangeBuffer) {
    anomalyScore += 20;
    reasons.push(`Price exceeds historical maximum by ${((currentPrice - maxHistorical) / maxHistorical * 100).toFixed(1)}%`);
  } else if (currentPrice < minHistorical - rangeBuffer) {
    anomalyScore += 20;
    reasons.push(`Price below historical minimum by ${((minHistorical - currentPrice) / minHistorical * 100).toFixed(1)}%`);
  }

  // Check for rapid consecutive increases
  if (historicalPrices.length >= 3) {
    const recentPrices = historicalPrices.slice(-3);
    const allIncreasing = recentPrices.every((p, i) => i === 0 || p > recentPrices[i - 1]);
    if (allIncreasing && currentPrice > recentPrices[recentPrices.length - 1]) {
      const totalIncrease = ((currentPrice - recentPrices[0]) / recentPrices[0]) * 100;
      if (totalIncrease > config.priceChangeThreshold * 1.5) {
        anomalyScore += 15;
        reasons.push(`Consecutive price increases totaling ${totalIncrease.toFixed(1)}%`);
      }
    }
  }

  return {
    isAnomaly: anomalyScore >= 30,
    score: Math.min(100, anomalyScore),
    reasons,
  };
}

// Get severity based on anomaly score
export function getAnomalySeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// Sample anomaly alerts for demo
export const SAMPLE_ANOMALIES: AnomalyAlert[] = [
  {
    id: 'alert1',
    type: 'price_spike',
    severity: 'critical',
    product: 'Beef',
    market: 'Muhima Market',
    vendor: 'Emmanuel',
    currentPrice: 4500,
    expectedPrice: 3200,
    deviation: 40.6,
    timestamp: '2026-02-12 08:45:00',
    details: 'Sudden price increase of 40.6% detected. This exceeds the normal market variation and requires immediate verification.',
    status: 'new',
  },
  {
    id: 'alert2',
    type: 'unusual_pattern',
    severity: 'high',
    product: 'Rice',
    market: 'Nyabugogo Market',
    currentPrice: 1800,
    expectedPrice: 1450,
    deviation: 24.1,
    timestamp: '2026-02-12 07:30:00',
    details: 'Price is 2.8 standard deviations above the 30-day average. Multiple vendors reporting similar increases.',
    status: 'investigating',
    assignedTo: 'Agent Mukiza',
  },
  {
    id: 'alert3',
    type: 'suspicious_vendor',
    severity: 'medium',
    product: 'Tomatoes',
    market: 'Kimironko Market',
    vendor: 'Unknown Vendor',
    currentPrice: 1200,
    expectedPrice: 850,
    deviation: 41.2,
    timestamp: '2026-02-11 16:20:00',
    details: 'New vendor submitting prices significantly above market average. Verification required.',
    status: 'new',
  },
  {
    id: 'alert4',
    type: 'price_drop',
    severity: 'low',
    product: 'Bananas',
    market: 'Kicukiro Market',
    currentPrice: 300,
    expectedPrice: 450,
    deviation: -33.3,
    timestamp: '2026-02-11 14:00:00',
    details: 'Price dropped below expected range. Could be seasonal adjustment or data entry error.',
    status: 'resolved',
  },
  {
    id: 'alert5',
    type: 'data_inconsistency',
    severity: 'medium',
    product: 'Milk',
    market: 'Multiple Markets',
    currentPrice: 500,
    expectedPrice: 680,
    deviation: -26.5,
    timestamp: '2026-02-12 09:00:00',
    details: 'Price reported is inconsistent with other markets in the same region. Possible data entry error.',
    status: 'new',
  },
];

// Analyze batch of price submissions
export function analyzeBatchForAnomalies(
  submissions: Array<{
    product: string;
    market: string;
    price: number;
    historicalPrices: number[];
  }>
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  
  for (const sub of submissions) {
    const analysis = detectPriceAnomaly(sub.price, sub.historicalPrices);
    
    if (analysis.isAnomaly) {
      const expectedPrice = mean(sub.historicalPrices);
      const deviation = ((sub.price - expectedPrice) / expectedPrice) * 100;
      
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: deviation > 0 ? 'price_spike' : 'price_drop',
        severity: getAnomalySeverity(analysis.score),
        product: sub.product,
        market: sub.market,
        currentPrice: sub.price,
        expectedPrice: Math.round(expectedPrice),
        deviation: Math.round(deviation * 10) / 10,
        timestamp: new Date().toISOString(),
        details: analysis.reasons.join('. '),
        status: 'new',
      });
    }
  }
  
  return alerts;
}

// Get anomaly statistics
export function getAnomalyStats(alerts: AnomalyAlert[]): {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  avgDeviation: number;
} {
  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = { new: 0, investigating: 0, resolved: 0, dismissed: 0 };
  
  let totalDeviation = 0;
  
  for (const alert of alerts) {
    bySeverity[alert.severity]++;
    byType[alert.type] = (byType[alert.type] || 0) + 1;
    byStatus[alert.status]++;
    totalDeviation += Math.abs(alert.deviation);
  }
  
  return {
    total: alerts.length,
    bySeverity,
    byType,
    byStatus,
    avgDeviation: alerts.length > 0 ? totalDeviation / alerts.length : 0,
  };
}
