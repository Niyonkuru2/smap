// Advanced Security Enhancements for Authentication

/**
 * Rate Limiting System
 */
interface RateLimitEntry {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blocked: boolean;
  blockUntil?: Date;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string, // email or IP
  maxAttempts: number = 5,
  windowMinutes: number = 15
): {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
  blockedUntil?: Date;
} {
  const now = new Date();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Check if block period has expired
  if (entry.blocked && entry.blockUntil) {
    if (now > entry.blockUntil) {
      // Reset after block period
      rateLimitStore.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      });
      return { allowed: true, remaining: maxAttempts - 1 };
    }
    return { 
      allowed: false, 
      remaining: 0, 
      blockedUntil: entry.blockUntil 
    };
  }

  // Check if window has expired
  const windowMs = windowMinutes * 60 * 1000;
  const timeSinceFirst = now.getTime() - entry.firstAttempt.getTime();

  if (timeSinceFirst > windowMs) {
    // Reset window
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Increment count
  entry.count++;
  entry.lastAttempt = now;

  if (entry.count > maxAttempts) {
    // Block for 30 minutes
    entry.blocked = true;
    entry.blockUntil = new Date(now.getTime() + 30 * 60 * 1000);
    return { 
      allowed: false, 
      remaining: 0, 
      blockedUntil: entry.blockUntil 
    };
  }

  const resetAt = new Date(entry.firstAttempt.getTime() + windowMs);
  return { 
    allowed: true, 
    remaining: maxAttempts - entry.count,
    resetAt
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Device Fingerprinting
 */
export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  timestamp: Date;
}

export function generateDeviceFingerprint(): DeviceFingerprint {
  const id = generateFingerprintHash();
  
  return {
    id,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timestamp: new Date()
  };
}

function generateFingerprintHash(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    new Date().getTimezoneOffset()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Suspicious Activity Detection
 */
export interface ActivityLog {
  timestamp: Date;
  action: 'signup' | 'login' | 'verification' | 'password_reset';
  email: string;
  ipAddress: string;
  deviceFingerprint: string;
  success: boolean;
  reason?: string;
}

const activityLogs: ActivityLog[] = [];

export function logActivity(activity: Omit<ActivityLog, 'timestamp'>): void {
  activityLogs.push({
    ...activity,
    timestamp: new Date()
  });
  
  // Keep only last 1000 logs
  if (activityLogs.length > 1000) {
    activityLogs.shift();
  }
}

export function detectSuspiciousActivity(
  email: string,
  ipAddress: string
): {
  suspicious: boolean;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const reasons: string[] = [];
  const recentLogs = activityLogs.filter(
    log => log.email === email && 
    (new Date().getTime() - log.timestamp.getTime()) < 24 * 60 * 60 * 1000 // Last 24 hours
  );

  // Check for multiple failed attempts
  const failedAttempts = recentLogs.filter(log => !log.success).length;
  if (failedAttempts >= 3) {
    reasons.push(`${failedAttempts} failed attempts in 24 hours`);
  }

  // Check for multiple IP addresses
  const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress));
  if (uniqueIPs.size >= 3) {
    reasons.push(`Login attempts from ${uniqueIPs.size} different locations`);
  }

  // Check for rapid succession attempts
  if (recentLogs.length >= 5) {
    const lastFive = recentLogs.slice(-5);
    const timeSpan = lastFive[lastFive.length - 1].timestamp.getTime() - 
                     lastFive[0].timestamp.getTime();
    if (timeSpan < 5 * 60 * 1000) { // 5 minutes
      reasons.push('Multiple attempts in short time period');
    }
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (reasons.length >= 3) {
    riskLevel = 'high';
  } else if (reasons.length >= 1) {
    riskLevel = 'medium';
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
    riskLevel
  };
}

/**
 * Phone Number Validation (International)
 */
export interface PhoneValidation {
  isValid: boolean;
  country: string;
  formatted: string;
  type: 'mobile' | 'landline' | 'unknown';
}

export function validatePhoneNumber(phone: string): PhoneValidation {
  const cleaned = phone.replace(/\D/g, '');
  
  // Rwanda mobile: +250 7XX XXX XXX
  if (/^(?:\+?250)?7[0-9]{8}$/.test(cleaned)) {
    return {
      isValid: true,
      country: 'Rwanda',
      formatted: formatRwandaPhone(phone),
      type: 'mobile'
    };
  }
  
  // International format (basic check)
  if (/^\+?[1-9]\d{9,14}$/.test(cleaned)) {
    return {
      isValid: true,
      country: 'International',
      formatted: phone,
      type: 'unknown'
    };
  }
  
  return {
    isValid: false,
    country: 'Unknown',
    formatted: phone,
    type: 'unknown'
  };
}

function formatRwandaPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('250')) {
    return `+250 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * SMS Verification System
 */
interface SMSVerification {
  phone: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

const smsVerifications = new Map<string, SMSVerification>();

export function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSMSVerification(
  phone: string,
  userName: string
): Promise<{ success: boolean; code: string; expiresIn: number }> {
  const code = generateSMSCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 1000); // 1 minute
  
  smsVerifications.set(phone, {
    phone,
    code,
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false
  });
  
  // Simulate SMS sending (in production, use Twilio, AWS SNS, etc.)
  console.log(`
╔════════════════════════════════════════════╗
║     [SMS] VERIFICATION CODE (DEMO)        ║
╠════════════════════════════════════════════╣
║  To: ${phone.padEnd(38)} ║
║  Name: ${userName.padEnd(36)} ║
║  Code: ${code.padEnd(36)} ║
║  Expires: 1 minute                         ║
╚════════════════════════════════════════════╝
  `);
  
  return {
    success: true,
    code, // Remove in production
    expiresIn: 1
  };
}

export function verifySMSCode(
  phone: string,
  code: string
): { success: boolean; error?: string } {
  const verification = smsVerifications.get(phone);
  
  if (!verification) {
    return { success: false, error: 'No verification found for this phone number' };
  }
  
  if (verification.verified) {
    return { success: false, error: 'Phone number already verified' };
  }
  
  if (new Date() > verification.expiresAt) {
    return { success: false, error: 'Verification code has expired' };
  }
  
  if (verification.attempts >= 3) {
    return { success: false, error: 'Too many attempts. Request a new code.' };
  }
  
  verification.attempts++;
  
  if (verification.code !== code) {
    return { success: false, error: 'Invalid verification code' };
  }
  
  verification.verified = true;
  return { success: true };
}

/**
 * Two-Factor Authentication (2FA)
 */
export interface TwoFactorSetup {
  enabled: boolean;
  method: 'email' | 'sms' | 'app';
  backupCodes: string[];
}

export function generate2FABackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Account Recovery
 */
export interface RecoveryOptions {
  email: string;
  phone?: string;
  securityQuestion?: {
    question: string;
    answer: string;
  };
  backupEmail?: string;
}

export function generateRecoveryToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Session Security
 */
export interface SessionInfo {
  id: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export function createSecureSession(
  userId: string,
  deviceFingerprint: string,
  ipAddress: string
): SessionInfo {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  
  return {
    id: generateRecoveryToken(),
    userId,
    deviceFingerprint,
    ipAddress,
    createdAt: now,
    lastActivity: now,
    expiresAt
  };
}

export function validateSession(session: SessionInfo): {
  valid: boolean;
  reason?: string;
} {
  const now = new Date();
  
  if (now > session.expiresAt) {
    return { valid: false, reason: 'Session expired' };
  }
  
  // Check for session hijacking (device fingerprint mismatch)
  const currentFingerprint = generateDeviceFingerprint();
  if (currentFingerprint.id !== session.deviceFingerprint) {
    return { valid: false, reason: 'Device fingerprint mismatch' };
  }
  
  // Auto-logout after 30 minutes of inactivity
  const inactiveTime = now.getTime() - session.lastActivity.getTime();
  if (inactiveTime > 30 * 60 * 1000) {
    return { valid: false, reason: 'Session inactive' };
  }
  
  return { valid: true };
}

/**
 * Password Reset Security
 */
export interface PasswordResetRequest {
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  ipAddress: string;
}

const passwordResetRequests = new Map<string, PasswordResetRequest>();

export function createPasswordResetRequest(
  email: string,
  ipAddress: string
): { token: string; expiresIn: number } {
  const token = generateRecoveryToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
  
  passwordResetRequests.set(token, {
    email,
    token,
    createdAt: now,
    expiresAt,
    used: false,
    ipAddress
  });
  
  return {
    token,
    expiresIn: 60
  };
}

export function validatePasswordResetToken(
  token: string
): { valid: boolean; email?: string; error?: string } {
  const request = passwordResetRequests.get(token);
  
  if (!request) {
    return { valid: false, error: 'Invalid reset token' };
  }
  
  if (request.used) {
    return { valid: false, error: 'Reset token already used' };
  }
  
  if (new Date() > request.expiresAt) {
    return { valid: false, error: 'Reset token expired' };
  }
  
  return { valid: true, email: request.email };
}

export function markPasswordResetTokenUsed(token: string): void {
  const request = passwordResetRequests.get(token);
  if (request) {
    request.used = true;
  }
}

/**
 * IP Address Utilities
 */
export async function getClientIPAddress(): Promise<string> {
  // In production, get from server or API
  // For demo, return a mock IP
  return '192.168.1.1';
}

export function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);
  
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first === 127
  );
}

/**
 * Email Domain Verification
 */
export async function verifyEmailDomain(email: string): Promise<{
  valid: boolean;
  mxRecords?: boolean;
  score: number;
}> {
  const domain = email.split('@')[1];
  
  // In production, verify MX records via API
  // For now, basic validation
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 
    'hotmail.com', 'icloud.com'
  ];
  
  const isCommon = commonDomains.includes(domain);
  const score = isCommon ? 100 : 50;
  
  return {
    valid: true,
    mxRecords: isCommon,
    score
  };
}

/**
 * CAPTCHA Integration (Mock)
 */
export interface CaptchaChallenge {
  token: string;
  challenge: string;
  answer: string;
}

export function generateCaptchaChallenge(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const token = generateRecoveryToken();
  
  return {
    token,
    challenge: `What is ${num1} + ${num2}?`,
    answer: (num1 + num2).toString()
  };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  // In production, verify with service like reCAPTCHA, hCaptcha
  // For demo, just validate it's a number
  return /^\d+$/.test(answer);
}