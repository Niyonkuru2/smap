// src/services/anomalyService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ANOMALY_URL = `${API_BASE_URL}/anomalies`;

// Types for Anomaly Alerts
export interface AnomalyAlert {
  id: string;
  type: 'price_spike' | 'price_drop' | 'unusual_pattern' | 'data_inconsistency' | 'suspicious_vendor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  product: string;
  product_id?: number;
  market: string;
  market_id?: string;
  vendor?: string;
  vendor_id?: number;
  currentPrice: number;
  vendor_price?: number;
  expectedPrice: number;
  reference_price?: number;
  deviation: number;
  deviation_percentage?: number;
  timestamp: string;
  created_at?: string;
  details: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
  assignedTo?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  resolution_notes?: string;
  resolved_at?: string;
  anomaly_type?: string;
  reference_price_value?: number;
  product_info?: {
    id: number;
    name: string;
    unit: string;
  };
  market_info?: {
    id: string;
    name: string;
    province: string;
    district: string;
  };
  vendor_info?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AnomalyStats {
  total_anomalies: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  resolved_count: number;
  investigating_count: number;
  new_count: number;
  avg_resolution_time_hours: number;
}

export interface AnomalyFilters {
  severity?: string;
  status?: string;
  anomalyType?: string;
  vendorId?: number;
  productId?: number;
  marketId?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse {
  anomalies: AnomalyAlert[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Map backend anomaly data to frontend AnomalyAlert format
 */
const mapAnomaly = (anomaly: any): AnomalyAlert => {
  // Determine anomaly type based on backend data
  let type: AnomalyAlert['type'] = 'unusual_pattern';
  if (anomaly.anomaly_type === 'price_spike') type = 'price_spike';
  else if (anomaly.anomaly_type === 'price_drop') type = 'price_drop';
  else if (anomaly.anomaly_type === 'suspicious_vendor') type = 'suspicious_vendor';
  else if (anomaly.anomaly_type === 'data_inconsistency') type = 'data_inconsistency';
  
  // Determine severity
  let severity: AnomalyAlert['severity'] = 'medium';
  if (anomaly.severity === 'critical') severity = 'critical';
  else if (anomaly.severity === 'high') severity = 'high';
  else if (anomaly.severity === 'medium') severity = 'medium';
  else if (anomaly.severity === 'low') severity = 'low';
  
  // Determine status
  let status: AnomalyAlert['status'] = 'new';
  if (anomaly.status === 'new') status = 'new';
  else if (anomaly.status === 'investigating') status = 'investigating';
  else if (anomaly.status === 'resolved') status = 'resolved';
  else if (anomaly.status === 'dismissed') status = 'dismissed';
  
  return {
    id: anomaly.id?.toString(),
    type,
    severity,
    product: anomaly.product_name || anomaly.product_info?.name || 'Unknown Product',
    product_id: anomaly.product_id || anomaly.product_info?.id,
    market: anomaly.market_name || anomaly.market_info?.name || 'Unknown Market',
    market_id: anomaly.market_id || anomaly.market_info?.id,
    vendor: anomaly.vendor_name || anomaly.vendor_info?.name,
    vendor_id: anomaly.vendor_id || anomaly.vendor_info?.id,
    currentPrice: parseFloat(anomaly.vendor_price || anomaly.currentPrice || 0),
    vendor_price: parseFloat(anomaly.vendor_price),
    expectedPrice: parseFloat(anomaly.reference_price || anomaly.expectedPrice || 0),
    reference_price: parseFloat(anomaly.reference_price_value || anomaly.reference_price),
    deviation: Math.abs(parseFloat(anomaly.deviation_percentage || anomaly.deviation || 0)),
    deviation_percentage: parseFloat(anomaly.deviation_percentage),
    timestamp: anomaly.created_at || anomaly.timestamp,
    created_at: anomaly.created_at,
    details: anomaly.details || anomaly.flag_reason || 'Price anomaly detected',
    status,
    assignedTo: anomaly.assigned_to_name || anomaly.assignedTo,
    assigned_to: anomaly.assigned_to,
    assigned_to_name: anomaly.assigned_to_name,
    resolution_notes: anomaly.resolution_notes,
    resolved_at: anomaly.resolved_at,
    anomaly_type: anomaly.anomaly_type,
    reference_price_value: parseFloat(anomaly.reference_price_value),
    product_info: anomaly.product_info,
    market_info: anomaly.market_info,
    vendor_info: anomaly.vendor_info,
  };
};

/**
 * Helper to get auth headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * GET ALL ANOMALIES with filters
 */
export const getAnomalies = async (filters?: AnomalyFilters): Promise<PaginatedResponse> => {
  try {
    const params: any = {};
    if (filters?.severity && filters.severity !== 'all') params.severity = filters.severity;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.anomalyType && filters.anomalyType !== 'all') params.anomalyType = filters.anomalyType;
    if (filters?.vendorId) params.vendorId = filters.vendorId;
    if (filters?.productId) params.productId = filters.productId;
    if (filters?.marketId) params.marketId = filters.marketId;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.offset) params.offset = filters.offset;
    
    const response = await axios.get(ANOMALY_URL, { 
      params,
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success) {
      return {
        anomalies: (response.data.anomalies || []).map(mapAnomaly),
        pagination: response.data.pagination || {
          total: 0,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0
        }
      };
    }
    
    return { anomalies: [], pagination: { total: 0, limit: 50, offset: 0 } };
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    throw error;
  }
};

/**
 * GET ANOMALY BY ID
 */
export const getAnomalyById = async (id: string): Promise<AnomalyAlert | null> => {
  try {
    const response = await axios.get(`${ANOMALY_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.anomaly) {
      return mapAnomaly(response.data.anomaly);
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching anomaly:', error);
    throw error;
  }
};

/**
 * UPDATE ANOMALY STATUS
 */
export const updateAnomalyStatus = async (
  id: string, 
  status: string, 
  resolutionNotes?: string
): Promise<AnomalyAlert> => {
  const response = await axios.patch(
    `${ANOMALY_URL}/${id}/status`,
    { status, resolutionNotes },
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.anomaly) {
    return mapAnomaly(response.data.anomaly);
  }
  
  throw new Error(response.data?.message || 'Failed to update anomaly status');
};

/**
 * ASSIGN ANOMALY TO ADMIN
 */
export const assignAnomaly = async (id: string, assignedTo: number): Promise<AnomalyAlert> => {
  const response = await axios.patch(
    `${ANOMALY_URL}/${id}/assign`,
    { assignedTo },
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.anomaly) {
    return mapAnomaly(response.data.anomaly);
  }
  
  throw new Error(response.data?.message || 'Failed to assign anomaly');
};

/**
 * GET ANOMALY STATISTICS
 */
export const getAnomalyStats = async (): Promise<{
  stats: AnomalyStats;
  breakdown: Array<{
    severity: string;
    status: string;
    anomaly_type: string;
    count: number;
  }>;
  topVendors: Array<{
    name: string;
    total_anomalies: number;
    trust_score: number;
    critical_anomalies: number;
    high_anomalies: number;
  }>;
}> => {
  try {
    const response = await axios.get(`${ANOMALY_URL}/stats`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success) {
      return {
        stats: response.data.stats || {
          total_anomalies: 0,
          critical_count: 0,
          high_count: 0,
          medium_count: 0,
          low_count: 0,
          resolved_count: 0,
          investigating_count: 0,
          new_count: 0,
          avg_resolution_time_hours: 0
        },
        breakdown: response.data.breakdown || [],
        topVendors: response.data.topVendors || []
      };
    }
    
    return {
      stats: {
        total_anomalies: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        resolved_count: 0,
        investigating_count: 0,
        new_count: 0,
        avg_resolution_time_hours: 0
      },
      breakdown: [],
      topVendors: []
    };
  } catch (error) {
    console.error('Error fetching anomaly stats:', error);
    throw error;
  }
};

/**
 * GET VENDOR ANOMALY SUMMARY
 */
export const getVendorAnomalySummary = async (vendorId: string): Promise<{
  vendor_name: string;
  total_anomalies: number;
  trust_score: number;
  recent_anomalies: AnomalyAlert[];
}> => {
  try {
    const response = await axios.get(`${ANOMALY_URL}/vendor/${vendorId}/summary`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return {
        vendor_name: response.data.data.vendor_name,
        total_anomalies: parseInt(response.data.data.total_anomalies) || 0,
        trust_score: parseFloat(response.data.data.trust_score) || 100,
        recent_anomalies: (response.data.data.recent_anomalies || []).map(mapAnomaly)
      };
    }
    
    return {
      vendor_name: '',
      total_anomalies: 0,
      trust_score: 100,
      recent_anomalies: []
    };
  } catch (error) {
    console.error('Error fetching vendor anomaly summary:', error);
    throw error;
  }
};

/**
 * RESOLVE ANOMALY (Shortcut method)
 */
export const resolveAnomaly = async (id: string, notes?: string): Promise<AnomalyAlert> => {
  return updateAnomalyStatus(id, 'resolved', notes);
};

/**
 * DISMISS ANOMALY (Shortcut method)
 */
export const dismissAnomaly = async (id: string, notes?: string): Promise<AnomalyAlert> => {
  return updateAnomalyStatus(id, 'dismissed', notes);
};

/**
 * START INVESTIGATION (Shortcut method)
 */
export const startInvestigation = async (id: string, assignedTo?: number): Promise<AnomalyAlert> => {
  if (assignedTo) {
    return assignAnomaly(id, assignedTo);
  }
  return updateAnomalyStatus(id, 'investigating');
};

/**
 * BULK UPDATE ANOMALIES (For batch operations)
 */
export const bulkUpdateAnomalies = async (
  ids: string[],
  status: string,
  notes?: string
): Promise<{ success: boolean; updated: number; failed: string[] }> => {
  const results = {
    success: true,
    updated: 0,
    failed: [] as string[]
  };
  
  for (const id of ids) {
    try {
      await updateAnomalyStatus(id, status, notes);
      results.updated++;
    } catch (error) {
      results.failed.push(id);
    }
  }
  
  results.success = results.failed.length === 0;
  return results;
};

/**
 * GET ANOMALY SUMMARY FOR DASHBOARD
 */
export const getAnomalyDashboardSummary = async (): Promise<{
  totalActive: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentAnomalies: AnomalyAlert[];
}> => {
  const stats = await getAnomalyStats();
  const recent = await getAnomalies({ limit: 10, offset: 0 });
  
  const bySeverity: Record<string, number> = {
    critical: stats.stats.critical_count,
    high: stats.stats.high_count,
    medium: stats.stats.medium_count,
    low: stats.stats.low_count
  };
  
  const byStatus: Record<string, number> = {
    new: stats.stats.new_count,
    investigating: stats.stats.investigating_count,
    resolved: stats.stats.resolved_count,
    dismissed: 0 
  };
  
  // Calculate dismissed from breakdown if needed
  if (stats.breakdown) {
    const dismissedCount = stats.breakdown
      .filter(b => b.status === 'dismissed')
      .reduce((sum, b) => sum + b.count, 0);
    byStatus.dismissed = dismissedCount;
  }
  
  return {
    totalActive: stats.stats.total_anomalies,
    criticalCount: stats.stats.critical_count,
    highCount: stats.stats.high_count,
    mediumCount: stats.stats.medium_count,
    lowCount: stats.stats.low_count,
    bySeverity,
    byStatus,
    recentAnomalies: recent.anomalies
  };
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  getAnomalies,
  getAnomalyById,
  updateAnomalyStatus,
  assignAnomaly,
  getAnomalyStats,
  getVendorAnomalySummary,
  resolveAnomaly,
  dismissAnomaly,
  startInvestigation,
  bulkUpdateAnomalies,
  getAnomalyDashboardSummary,
};