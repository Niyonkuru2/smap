// ============================================
// API CONFIGURATION
// ============================================
const API_BASE_URL = (() => {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Render deployment detection
  if (host.includes('onrender.com')) {
    if (host === 'smpmps-test.onrender.com' || host === 'smpmps-frontend.onrender.com') {
      return 'https://smpmps-backend.onrender.com';
    }
    if (host.endsWith('-frontend.onrender.com')) {
      const baseName = host.replace('-frontend.onrender.com', '-backend.onrender.com');
      return `https://${baseName}`;
    }
    return `${protocol}//${host}`;
  }
  
  // Local development
  return `${protocol}//${host}:3001`;
})();

console.log('🔗 API_BASE_URL:', API_BASE_URL);

// ============================================
// UTILITY FUNCTIONS
// ============================================
export async function getAccessToken(): Promise<string | null> {
  const session = localStorage.getItem('auth_session');
  if (session) {
    try {
      const { access_token } = JSON.parse(session);
      return access_token;
    } catch {
      return null;
    }
  }
  return null;
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
        errorMessage = errorData.error || errorMessage;
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
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// ============================================
// AUTHENTICATION API
// ============================================
export async function login(email: string, password: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  
  if (payload.error) {
    throw new Error(payload.error);
  }
  
  if (payload.session) {
    localStorage.setItem('auth_session', JSON.stringify(payload.session));
  }
  if (payload.user) {
    localStorage.setItem(`profile_${payload.user.id}`, JSON.stringify(payload.user));
  }
  
  return payload;
}

export async function register(userData: any) {
  const response = await fetchWithRetry(`${API_BASE_URL}/auth/complete-signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const payload = await response.json();
  
  if (payload.error) {
    throw new Error(payload.error);
  }
  
  if (payload.session) {
    localStorage.setItem('auth_session', JSON.stringify(payload.session));
  }
  if (payload.user) {
    localStorage.setItem(`profile_${payload.user.id}`, JSON.stringify(payload.user));
  }
  
  return payload;
}

export async function logout() {
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

export async function getSession() {
  const session = localStorage.getItem('auth_session');
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export async function sendVerificationEmail(email: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/auth/send-verification-email`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const payload = await response.json();
  
  if (payload.error) {
    throw new Error(payload.error);
  }
  
  return payload;
}

export async function verifyEmailForSignup(email: string, code: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/auth/verify-email-code`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const payload = await response.json();
  
  if (payload.error) {
    throw new Error(payload.error);
  }
  
  return payload;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return authFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function requestPasswordReset(email: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  return response.json();
}

export async function verifyResetToken(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token/${token}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Invalid reset token');
  }
  
  return response.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to reset password');
  }
  
  return data;
}

// ============================================
// PROFILE API
// ============================================
export async function getProfile() {
  return authFetch('/profile');
}

export async function updateProfile(data: any) {
  return authFetch('/profile/update', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// ADMIN API
// ============================================
export async function adminGetUsers() {
  return authFetch('/admin/users');
}

export async function adminUpdateRole(userId: string, role: string) {
  return authFetch(`/admin/users/${userId}/role`, {
    method: 'POST',
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
// MOCKED COMPATIBILITY
// ============================================
export const supabase = {
  auth: {
    onAuthStateChange: () => ({ 
      data: { 
        subscription: { 
          unsubscribe: () => {} 
        } 
      } 
    })
  }
};

// Legacy exports for backward compatibility
export { login as signIn, register as signUp, logout as signOut };