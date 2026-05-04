
// API functions for sending verification codes using the new PostgreSQL backend
import { type EmailLanguage } from './emailTemplates';

// Helper to retry failed requests (handles Render cold starts) with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, retries: number = 5, delayMs: number = 2000): Promise<Response> {
  try {
    console.log(`Fetching (attempt ${6 - retries}): ${url}`);
    const response = await fetch(url, {
      ...options,
      // Add longer timeout for cold server startup
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (err: any) {
    if (retries > 0 && (err.message.includes('Failed to fetch') || err.message.includes('timeout') || err.name === 'TimeoutError')) {
      console.log(`Request failed: ${err.message}. Retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      // Exponential backoff: increase delay for next retry
      return fetchWithRetry(url, options, retries - 1, Math.min(delayMs * 1.5, 10000));
    }
    
    console.error(`Final error after retries: ${err.message}`);
    throw err;
  }
}

// Dynamic API URL detection (same logic as main api.ts)
const API_BASE_URL = (() => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Render deployment detection
  if (host.includes('onrender.com')) {
    if (host === 'smpmps-test.onrender.com' || host === 'smpmps-frontend.onrender.com') {
      return 'https://smpmps-backend.onrender.com';
    }
    if (host.endsWith('-frontend.onrender.com')) {
      return `https://${host.replace('-frontend.onrender.com', '-backend.onrender.com')}`;
    }
    return `${protocol}//${host}`;
  }
  
  // Local development
  return import.meta.env.VITE_API_URL || `${protocol}//${host}:3001`;
})();

interface BaseApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  demoMode?: boolean;
}

export async function sendVerificationEmailAPI(
  email: string,
  userName: string,
  verificationCode: string,
  language: EmailLanguage = 'en'
): Promise<BaseApiResponse & { _devCode?: string }> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/verify/email`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName, verificationCode, language }),
    });

    const result = await response.json();
    
    // In development, if email fails, show the code in console
    if (result._devCode) {
      console.log(`📧 [DEV] Verification code for ${email}: ${result._devCode}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('sendVerificationEmailAPI error:', error.message);
    
    // Return more helpful error message
    let errorMessage = 'Failed to send verification email. Please try again.';
    
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorMessage = 'Server is starting up. Please try again in a moment.';
    } else if (error.message.includes('HTTP')) {
      errorMessage = 'Server error sending email. Please try again later.';
    }
    
    return { success: false, error: errorMessage };
  }
}

// Generate a random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationSMSAPI(
  phone: string,
  userName: string
): Promise<BaseApiResponse & { code?: string }> {
  try {
    // Generate code in frontend and send to backend
    const verificationCode = generateCode();
    
    const response = await fetchWithRetry(`${API_BASE_URL}/verify/sms`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, userName, verificationCode }),
    });

    const result = await response.json();
    
    if (result.success) {
      // Return the code so frontend can verify later
      // Note: In production, this verification should be done server-side
      return { ...result, code: verificationCode };
    }
    
    return result;
  } catch (error: any) {
    console.error('sendVerificationSMSAPI error:', error.message);
    
    // Return more helpful error message
    let errorMessage = 'Failed to send verification SMS. Please try again.';
    
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorMessage = 'Server is starting up. Please try again in a moment.';
    } else if (error.message.includes('HTTP')) {
      errorMessage = 'Server error sending SMS. Please try again later.';
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function verifySMSCodeAPI(
  phone: string,
  code: string
): Promise<BaseApiResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/verify/sms/check`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    return await response.json();
  } catch (error: any) {
    console.error('verifySMSCodeAPI error:', error.message);
    
    // Return more helpful error message
    let errorMessage = 'Failed to verify SMS code. Please try again.';
    
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorMessage = 'Server is starting up. Please try again in a moment.';
    }
    
    return { success: false, error: errorMessage };
  }
}

// Verify email code against the backend database
export async function verifyEmailCodeAPI(
  email: string,
  code: string
): Promise<BaseApiResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/verify/code`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    return await response.json();
  } catch (error: any) {
    console.error('verifyEmailCodeAPI error:', error.message);
    
    // Return more helpful error message
    let errorMessage = 'Failed to verify email code. Please try again.';
    
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorMessage = 'Server is starting up. Please try again in a moment.';
    }
    
    return { success: false, error: errorMessage };
  }
}