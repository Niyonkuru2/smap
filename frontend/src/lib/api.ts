import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AUTH_URL = `${API_BASE_URL}/auth`;
const ADMIN_URL = `${API_BASE_URL}/admin`;
const PRICES_URL = `${API_BASE_URL}/prices`;
const PRODUCTS_URL = `${API_BASE_URL}/products`;
const MARKETS_URL = `${API_BASE_URL}/markets`;
const CATEGORIES_URL = `${API_BASE_URL}/categories`;
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
// HELPER FUNCTIONS
// ============================================

/**
 * Get stored auth token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Get current session
 */
export const getSession = () => {
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
};

/**
 * Get stored user
 */
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

/**
 * Get auth headers for axios
 */
const getAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================
// AUTHENTICATION API
// ============================================

/**
 * Step 1: Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  name: string = 'User',
  language: string = 'en'
): Promise<VerificationResponse> => {
  const response = await axios.post(`${AUTH_URL}/send-verification`, {
    email,
    name,
    language
  });
  return response.data;
};

/**
 * Step 2: Verify OTP code
 */
export const verifyEmailForSignup = async (
  email: string,
  code: string
): Promise<VerificationResponse> => {
  const response = await axios.post(`${AUTH_URL}/verify-code`, {
    email,
    code
  });
  return response.data;
};

/**
 * Step 3: Complete registration with password
 */
export const signUp = async (userData: {
  email: string;
  password: string;
  name: string;
  role?: string;
  phone?: string;
  province?: string;
  district?: string;
  marketId?: number;
}): Promise<RegisterResponse> => {
  const response = await axios.post(`${AUTH_URL}/register`, {
    email: userData.email,
    password: userData.password,
    name: userData.name,
    role: userData.role || 'consumer',
    phone: userData.phone || null,
    province: userData.province || null,
    district: userData.district || null,
    marketId: userData.marketId || null,
  });

  // Store token if registration successful
  if (response.data.success && response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Also store in old format for compatibility
    const session = {
      access_token: response.data.token,
      user: response.data.user
    };
    localStorage.setItem('auth_session', JSON.stringify(session));
  }

  return response.data;
};

/**
 * Login user
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await axios.post(`${AUTH_URL}/login`, {
    email,
    password
  });

  // Store token if login successful
  if (response.data.success && response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Also store in old format for compatibility
    const session = {
      access_token: response.data.token,
      user: response.data.user
    };
    localStorage.setItem('auth_session', JSON.stringify(session));
  }

  return response.data;
};

/**
 * Register user (alias for signUp for backward compatibility)
 */
export const register = signUp;

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_session');
  
  // Optional: Call logout endpoint
  try {
    await axios.post(`${AUTH_URL}/logout`, {}, { withCredentials: true });
  } catch {
    // Ignore logout endpoint errors
  }
};

/**
 * Resend verification code
 */
export const resendVerificationCode = async (
  email: string,
  language: string = 'en'
): Promise<VerificationResponse> => {
  const response = await axios.post(`${AUTH_URL}/resend-verification`, {
    email,
    language
  });
  return response.data;
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (
  email: string,
  language: string = 'en'
): Promise<{ success: boolean; message: string; emailSent: boolean }> => {
  const response = await axios.post(`${AUTH_URL}/forgot-password`, {
    email,
    language
  });
  return response.data;
};

/**
 * Verify reset code
 */
export const verifyResetCode = async (
  email: string,
  code: string
): Promise<{ success: boolean; message: string; valid: boolean }> => {
  const response = await axios.post(`${AUTH_URL}/verify-reset-code`, {
    email,
    code
  });
  return response.data;
};

/**
 * Reset password with code
 */
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message: string; reset: boolean }> => {
  const response = await axios.post(`${AUTH_URL}/reset-password`, {
    email,
    code,
    newPassword
  });
  return response.data;
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string; changed: boolean }> => {
  const response = await axios.post(
    `${AUTH_URL}/change-password`,
    { currentPassword, newPassword },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Get user profile
 */
export const getProfile = async (): Promise<User> => {
  const response = await axios.get(`${AUTH_URL}/profile`, {
    headers: getAuthHeaders()
  });
  return response.data.user;
};

/**
 * Update user profile
 */
export const updateProfile = async (
  updates: Partial<User>
): Promise<{ success: boolean; message: string; user: User }> => {
  const response = await axios.put(`${AUTH_URL}/profile`, updates, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get user profile (alias)
 */
export const getUserProfile = getProfile;

// ============================================
// SIGN IN/OUT ALIASES
// ============================================
export const signIn = login;
export const signOut = logout;
export const signUpAlias = signUp;

// ============================================
// ADMIN API
// ============================================

/**
 * Get all users (admin only)
 */
export const adminGetUsers = async () => {
  const response = await axios.get(`${ADMIN_URL}/users`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Update user role (admin only)
 */
export const adminUpdateRole = async (userId: string, role: string) => {
  const response = await axios.put(
    `${ADMIN_URL}/users/${userId}/role`,
    { role },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Delete user (admin only)
 */
export const adminDeleteUser = async (userId: string) => {
  const response = await axios.delete(`${ADMIN_URL}/users/${userId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get all price submissions (admin only)
 */
export const getAllSubmissions = async () => {
  const response = await axios.get(`${ADMIN_URL}/submissions`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Approve a price submission (admin only)
 */
export const approveSubmission = async (id: string) => {
  const response = await axios.post(
    `${ADMIN_URL}/submissions/${id}/approve`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Reject a price submission (admin only)
 */
export const rejectSubmission = async (id: string, reason: string) => {
  const response = await axios.post(
    `${ADMIN_URL}/submissions/${id}/reject`,
    { reason },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Get admin dashboard stats (admin only)
 */
export const getAdminStats = async () => {
  const response = await axios.get(`${ADMIN_URL}/stats`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// PRICES API
// ============================================

/**
 * Get all prices
 */
export const getAllPrices = async () => {
  const response = await axios.get(`${PRICES_URL}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get live prices
 */
export const getLivePrices = async () => {
  const response = await axios.get(`${PRICES_URL}/live`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get market prices
 */
export const getMarketPrices = async (marketName: string) => {
  const response = await axios.get(`${PRICES_URL}/market/${encodeURIComponent(marketName)}`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Compare prices across markets
 */
export const comparePrices = async (productName: string) => {
  const response = await axios.get(`${PRICES_URL}/compare/${encodeURIComponent(productName)}`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get price updates
 */
export const getPriceUpdate = async () => {
  const response = await axios.get(`${PRICES_URL}/update`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Submit a new price (vendor only)
 */
export const submitPrice = async (data: any) => {
  const response = await axios.post(`${PRICES_URL}/submit`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get user's own price submissions
 */
export const getMySubmissions = async () => {
  const response = await axios.get(`${PRICES_URL}/my-submissions`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// PRODUCTS & MARKETS API
// ============================================

/**
 * Get all products
 */
export const getProducts = async () => {
  const response = await axios.get(`${PRODUCTS_URL}`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get product prices
 */
export const getProductsPrices = async () => {
  const response = await axios.get(`${PRODUCTS_URL}/prices`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get all markets
 */
export const getMarkets = async () => {
  const response = await axios.get(`${MARKETS_URL}`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get markets info
 */
export const getMarketsInfo = async () => {
  const response = await axios.get(`${MARKETS_URL}/info`, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get all categories
 */
export const getCategories = async () => {
  const response = await axios.get(`${CATEGORIES_URL}`, {
    withCredentials: true
  });
  return response.data;
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  // Auth
  login,
  register,
  logout,
  signIn,
  signOut,
  getSession,
  getProfile,
  getUserProfile,
  updateProfile,
  sendVerificationEmail,
  verifyEmailForSignup,
  resendVerificationCode,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  changePassword,
  getAccessToken,
  isAuthenticated,
  getStoredUser,
  signUp,
  signUpAlias,
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
  getPriceUpdate,
  submitPrice,
  getMySubmissions,
  // Products & Markets
  getProducts,
  getProductsPrices,
  getMarkets,
  getMarketsInfo,
  getCategories,
};