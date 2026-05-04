// ============================================
// API CONFIGURATION
// ============================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔗 API_BASE_URL:', API_BASE_URL);

// ============================================
// UTILITY FUNCTIONS
// ============================================
export async function getAccessToken(): Promise<string | null> {
  return localStorage.getItem('authToken');
}

export async function getSession() {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  if (!token || !user) return null;
  
  try {
    return {
      access_token: token,
      user: JSON.parse(user)
    };
  } catch {
    return null;
  }
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'API request failed');
    (error as any).status = response.status;
    (error as any).requiresVerification = data.requiresVerification;
    throw error;
  }

  return data as T;
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries: number = 3, 
  delayMs: number = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let hint = null;
      let requiresVerification = false;
      
      try {
        const errorData = await response.clone().json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        hint = errorData.hint;
        requiresVerification = errorData.requiresVerification;
      } catch {
        // Not JSON, use status text
      }
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        const error = new Error(errorMessage);
        (error as any).hint = hint;
        (error as any).status = response.status;
        (error as any).requiresVerification = requiresVerification;
        throw error;
      }
      
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (err: any) {
    // Don't retry client errors
    if (err.status && err.status >= 400 && err.status < 500) {
      throw err;
    }
    
    // Retry on network errors or server errors
    if (retries > 0 && (err.message.includes('Failed to fetch') || err.message.includes('timeout'))) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    
    throw err;
  }
}

async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

// ============================================
// AUTH TYPES
// ============================================
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'consumer' | 'vendor' | 'business' | 'agent' | 'admin';
  phone?: string;
  province?: string;
  district?: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
  last_login?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  loggedIn: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  registered: boolean;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  email: string;
  emailSent?: boolean;
  codeVerified?: boolean;
  expiresIn?: string;
}

// ============================================
// AUTHENTICATION API
// ============================================

/**
 * Step 1: Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string = 'User',
  language: string = 'en'
): Promise<VerificationResponse> {
  return apiCall<VerificationResponse>('/auth/send-verification', {
    method: 'POST',
    body: JSON.stringify({ email, name, language }),
  });
}

/**
 * Step 2: Verify OTP code
 */
export async function verifyEmailForSignup(
  email: string,
  code: string
): Promise<VerificationResponse> {
  return apiCall<VerificationResponse>('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/**
 * Step 3: Complete registration with password
 */
export async function signUp(userData: {
  email: string;
  password: string;
  name: string;
  role?: string;
  phone?: string;
  province?: string;
  district?: string;
  marketId?: number;
}): Promise<RegisterResponse> {
  return apiCall<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role || 'consumer',
      phone: userData.phone || null,
      province: userData.province || null,
      district: userData.district || null,
      marketId: userData.marketId || null,
    }),
  });
}

/**
 * Login user
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiCall<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Store token if login successful
  if (response.success && response.token) {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Also store in old format for compatibility
    const session = {
      access_token: response.token,
      user: response.user
    };
    localStorage.setItem('auth_session', JSON.stringify(session));
  }

  return response;
}

/**
 * Register user (alias for signUp for backward compatibility)
 */
export async function register(userData: {
  email: string;
  password: string;
  name: string;
  role?: string;
  phone?: string;
}): Promise<RegisterResponse> {
  return signUp(userData);
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_session');
  
  // Optional: Call logout endpoint
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore logout endpoint errors
  }
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(
  email: string,
  language: string = 'en'
): Promise<VerificationResponse> {
  return apiCall<VerificationResponse>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email, language }),
  });
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  email: string,
  language: string = 'en'
): Promise<{ success: boolean; message: string; emailSent: boolean }> {
  return apiCall('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, language }),
  });
}

/**
 * Verify reset token
 */
export async function verifyResetToken(
  token: string
): Promise<{ success: boolean; message: string; valid: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Invalid reset token');
  }
  
  return data;
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string; reset: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to reset password');
  }
  
  return data;
}

/**
 * Change password (authenticated)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string; changed: boolean }> {
  return apiCall('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * Get user profile
 */
export async function getProfile(): Promise<User> {
  const response = await apiCall<{ success: boolean; user: User }>('/auth/profile', {
    method: 'GET',
  });
  return response.user;
}

/**
 * Update user profile
 */
export async function updateProfile(
  updates: Partial<User>
): Promise<{ success: boolean; message: string; user: User }> {
  return apiCall('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

// ============================================
// PROFILE API (additional)
// ============================================
export async function getUserProfile() {
  return getProfile();
}

// ============================================
// SIGN IN/OUT ALIASES (defined once)
// ============================================
export const signIn = login;
export const signOut = logout;
export const signUpAlias = signUp;

// ============================================
// ADMIN API
// ============================================
export async function adminGetUsers() {
  return authFetch('/admin/users');
}

export async function adminUpdateRole(userId: string, role: string) {
  return authFetch(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function adminDeleteUser(userId: string) {
  return authFetch(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function getAllSubmissions() {
  return authFetch('/admin/submissions');
}

export async function approveSubmission(id: string) {
  return authFetch(`/admin/submissions/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectSubmission(id: string, reason: string) {
  return authFetch(`/admin/submissions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getAdminStats() {
  return authFetch('/admin/stats');
}

// ============================================
// PRICES API
// ============================================
export async function getAllPrices() {
  return authFetch('/prices');
}

export async function getLivePrices() {
  const response = await fetch(`${API_BASE_URL}/prices/live`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function getMarketPrices(marketName: string) {
  const response = await fetch(`${API_BASE_URL}/prices/market/${encodeURIComponent(marketName)}`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function comparePrices(productName: string) {
  const response = await fetch(`${API_BASE_URL}/prices/compare/${encodeURIComponent(productName)}`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function getPriceUpdate() {
  const response = await fetch(`${API_BASE_URL}/prices/update`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function getMarketsInfo() {
  const response = await fetch(`${API_BASE_URL}/markets/info`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function getProductsPrices() {
  const response = await fetch(`${API_BASE_URL}/products/prices`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function submitPrice(data: any) {
  return authFetch('/prices/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMySubmissions() {
  return authFetch('/prices/my-submissions');
}

// ============================================
// PRODUCTS & MARKETS API
// ============================================
export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function getMarkets() {
  const response = await fetch(`${API_BASE_URL}/markets`, { 
    credentials: 'include' 
  });
  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`, { 
    credentials: 'include' 
  });
  return response.json();
}

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  login,
  register,
  logout,
  signIn,
  signOut,
  getSession,
  getProfile,
  updateProfile,
  sendVerificationEmail,
  verifyEmailForSignup,
  resendVerificationCode,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  changePassword,
  getAccessToken,
  isAuthenticated,
  getStoredUser,
  // Admin
  adminGetUsers,
  adminUpdateRole,
  adminDeleteUser,
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  getAdminStats,
  // Prices
  getAllPrices,
  getLivePrices,
  getMarketPrices,
  comparePrices,
  submitPrice,
  getMySubmissions,
  // Products & Markets
  getProducts,
  getMarkets,
  getCategories,
};