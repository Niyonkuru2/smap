// src/services/subscriptionService.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SUBSCRIPTION_URL = `${API_BASE_URL}/subscriptions`;

// ============================================
// TYPES
// ============================================

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  max_products: number | null;
  max_price_submissions: number | null;
  priority_support: boolean;
  featured_listing: boolean;
  analytics_access: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  payment_method: string;
  amount_paid: number;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  activated_by: number | null;
  activated_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  plan_name?: string;
  plan_description?: string;
  plan_price?: number;
  duration_days?: number;
  priority_support?: boolean;
  featured_listing?: boolean;
  analytics_access?: boolean;
  max_products?: number;
  max_price_submissions?: number;
}

export interface SubscriptionWithDetails extends UserSubscription {
  plan_name: string;
  plan_price: number;
  duration_days: number;
  priority_support: boolean;
  featured_listing: boolean;
  analytics_access: boolean;
  max_products: number;
  max_price_submissions: number;
}

export interface PendingSubscription extends UserSubscription {
  user_name: string;
  user_email: string;
  user_phone: string;
  plan_name: string;
}

export interface SubscriptionStats {
  total_subscriptions: number;
  active_count: number;
  pending_count: number;
  expired_count: number;
  cancelled_count: number;
  total_revenue: number;
}

export interface SubscribeRequest {
  planId: number;
  paymentMethod?: string;
  paymentReference?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map backend subscription data to frontend format
 */
const mapSubscription = (subscription: any): UserSubscription => {
  return {
    id: subscription.id,
    user_id: subscription.user_id,
    plan_id: subscription.plan_id,
    status: subscription.status,
    payment_method: subscription.payment_method,
    amount_paid: parseFloat(subscription.amount_paid),
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    auto_renew: subscription.auto_renew,
    activated_by: subscription.activated_by,
    activated_at: subscription.activated_at,
    cancelled_at: subscription.cancelled_at,
    created_at: subscription.created_at,
    updated_at: subscription.updated_at,
    plan_name: subscription.plan_name,
    plan_description: subscription.plan_description,
    plan_price: subscription.plan_price ? parseFloat(subscription.plan_price) : undefined,
    duration_days: subscription.duration_days,
    priority_support: subscription.priority_support,
    featured_listing: subscription.featured_listing,
    analytics_access: subscription.analytics_access,
    max_products: subscription.max_products,
    max_price_submissions: subscription.max_price_submissions
  };
};

// ============================================
// PLAN MANAGEMENT API
// ============================================

/**
 * Get all subscription plans
 */
export const getAllPlans = async (includeInactive = false): Promise<SubscriptionPlan[]> => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_URL}/plans`, {
      params: { includeInactive }
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
};

/**
 * Get plan by ID
 */
export const getPlanById = async (planId: number): Promise<SubscriptionPlan | null> => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_URL}/plans/${planId}`);
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching plan:', error);
    throw error;
  }
};

/**
 * Create new plan (Admin only)
 */
export const createPlan = async (planData: Omit<SubscriptionPlan, 'id' | 'created_at' | 'is_active'>): Promise<SubscriptionPlan> => {
  const response = await axios.post(
    `${SUBSCRIPTION_URL}/admin/plans`,
    planData,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  
  throw new Error(response.data?.message || 'Failed to create plan');
};

/**
 * Update plan (Admin only)
 */
export const updatePlan = async (planId: number, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  const response = await axios.put(
    `${SUBSCRIPTION_URL}/admin/plans/${planId}`,
    planData,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  
  throw new Error(response.data?.message || 'Failed to update plan');
};

/**
 * Delete plan (Admin only)
 */
export const deletePlan = async (planId: number): Promise<void> => {
  const response = await axios.delete(
    `${SUBSCRIPTION_URL}/admin/plans/${planId}`,
    { headers: getAuthHeaders() }
  );
  
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete plan');
  }
};

// ============================================
// USER SUBSCRIPTION API
// ============================================

/**
 * Subscribe to a plan
 */
export const subscribeToPlan = async (data: SubscribeRequest): Promise<{ success: boolean; message: string; subscription?: UserSubscription }> => {
  const response = await axios.post(
    `${SUBSCRIPTION_URL}/subscribe`,
    {
      planId: data.planId,
      paymentMethod: data.paymentMethod || 'bank_transfer',
      paymentReference: data.paymentReference || null
    },
    { headers: getAuthHeaders() }
  );
  
  return response.data;
};

/**
 * Get user's active subscription
 */
export const getMyActiveSubscription = async (): Promise<UserSubscription | null> => {
  try {
    const response = await axios.get(
      `${SUBSCRIPTION_URL}/me/active`,
      { headers: getAuthHeaders() }
    );
    
    if (response.data && response.data.success) {
      return response.data.data ? mapSubscription(response.data.data) : null;
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Get user's subscription history
 */
export const getMySubscriptions = async (limit = 10): Promise<UserSubscription[]> => {
  try {
    const response = await axios.get(
      `${SUBSCRIPTION_URL}/me/history`,
      { 
        headers: getAuthHeaders(),
        params: { limit }
      }
    );
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapSubscription);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (subscriptionId: number): Promise<{ success: boolean; message: string }> => {
  const response = await axios.delete(
    `${SUBSCRIPTION_URL}/cancel/${subscriptionId}`,
    { headers: getAuthHeaders() }
  );
  
  return response.data;
};

// ============================================
// ADMIN SUBSCRIPTION API
// ============================================

/**
 * Get pending subscriptions (Admin only)
 */
export const getPendingSubscriptions = async (): Promise<PendingSubscription[]> => {
  const response = await axios.get(
    `${SUBSCRIPTION_URL}/admin/pending`,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  return [];
};

/**
 * Approve subscription (Admin only)
 */
export const approveSubscription = async (subscriptionId: number): Promise<{ success: boolean; message: string; subscription?: UserSubscription }> => {
  const response = await axios.post(
    `${SUBSCRIPTION_URL}/admin/approve/${subscriptionId}`,
    {},
    { headers: getAuthHeaders() }
  );
  
  return response.data;
};

/**
 * Reject subscription (Admin only)
 */
export const rejectSubscription = async (subscriptionId: number, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(
    `${SUBSCRIPTION_URL}/admin/reject/${subscriptionId}`,
    { reason },
    { headers: getAuthHeaders() }
  );
  
  return response.data;
};

/**
 * Get subscription stats (Admin only)
 */
export const getSubscriptionStats = async (): Promise<SubscriptionStats> => {
  const response = await axios.get(
    `${SUBSCRIPTION_URL}/admin/stats`,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return {
      total_subscriptions: parseInt(response.data.data.total_subscriptions) || 0,
      active_count: parseInt(response.data.data.active_count) || 0,
      pending_count: parseInt(response.data.data.pending_count) || 0,
      expired_count: parseInt(response.data.data.expired_count) || 0,
      cancelled_count: parseInt(response.data.data.cancelled_count) || 0,
      total_revenue: parseFloat(response.data.data.total_revenue) || 0
    };
  }
  
  return {
    total_subscriptions: 0,
    active_count: 0,
    pending_count: 0,
    expired_count: 0,
    cancelled_count: 0,
    total_revenue: 0
  };
};

// ============================================
// CRON JOB ENDPOINTS (Admin only)
// ============================================

/**
 * Check expiring subscriptions (Admin only)
 */
export const checkExpiringSubscriptions = async (): Promise<{ success: boolean; expiringCount: number }> => {
  const response = await axios.post(
    `${SUBSCRIPTION_URL}/admin/check-expiring`,
    {},
    { headers: getAuthHeaders() }
  );
  
  return response.data;
};

/**
 * Expire subscriptions (Admin only)
 */
export const expireSubscriptions = async (): Promise<{ success: boolean; expiredCount: number }> => {
  const response = await axios.post(
    `${SUBSCRIPTION_URL}/admin/expire`,
    {},
    { headers: getAuthHeaders() }
  );
  
  return response.data;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  const subscription = await getMyActiveSubscription();
  return !!subscription && subscription.status === 'active';
};

/**
 * Get user's subscription benefits
 */
export const getSubscriptionBenefits = async (): Promise<{
  hasActiveSubscription: boolean;
  planName?: string;
  maxProducts?: number;
  maxPriceSubmissions?: number;
  prioritySupport?: boolean;
  featuredListing?: boolean;
  analyticsAccess?: boolean;
  expiresAt?: string;
}> => {
  const subscription = await getMyActiveSubscription();
  
  if (!subscription || subscription.status !== 'active') {
    return {
      hasActiveSubscription: false
    };
  }
  
  return {
    hasActiveSubscription: true,
    planName: subscription.plan_name,
    maxProducts: subscription.max_products,
    maxPriceSubmissions: subscription.max_price_submissions,
    prioritySupport: subscription.priority_support,
    featuredListing: subscription.featured_listing,
    analyticsAccess: subscription.analytics_access,
    expiresAt: subscription.end_date
  };
};

/**
 * Format plan price
 */
export const formatPlanPrice = (price: number): string => {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Format date
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get days remaining in subscription
 */
export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  // Plans
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  // User subscription
  subscribeToPlan,
  getMyActiveSubscription,
  getMySubscriptions,
  cancelSubscription,
  // Admin
  getPendingSubscriptions,
  approveSubscription,
  rejectSubscription,
  getSubscriptionStats,
  // Cron
  checkExpiringSubscriptions,
  expireSubscriptions,
  // Utilities
  hasActiveSubscription,
  getSubscriptionBenefits,
  formatPlanPrice,
  formatDate,
  getDaysRemaining
};