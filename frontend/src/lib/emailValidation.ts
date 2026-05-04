// Email Validation and Security Utilities

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (password.length >= 12 && errors.length === 0) {
    strength = 'strong';
  } else if (password.length >= 8 && errors.length <= 2) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Sanitizes email input
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks if email is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'fakeinbox.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

/**
 * Validates phone number (Rwanda format)
 */
export function isValidRwandaPhone(phone: string): boolean {
  // Rwanda phone numbers: +250 7XX XXX XXX or 07XX XXX XXX
  const phoneRegex = /^(\+250|0)?7[0-9]{8}$/;
  const cleanPhone = phone.replace(/\s/g, '');
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Formats Rwanda phone number
 */
export function formatRwandaPhone(phone: string): string {
  const cleanPhone = phone.replace(/\s/g, '').replace(/^\+250/, '0');
  
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`;
  }
  
  return phone;
}

/**
 * Generates a verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a secure token
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates verification code
 */
export function isValidVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Check if email domain exists (basic check)
 */
export function getEmailDomain(email: string): string {
  return email.split('@')[1] || '';
}

/**
 * Common Rwanda email domains
 */
export const commonRwandaDomains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'ac.rw', // Rwandan academic institutions
  'gov.rw', // Rwandan government
  'rw' // General Rwanda domain
];

/**
 * Security question validation
 */
export interface SecurityQuestion {
  question: string;
  answer: string;
}

export const securityQuestions = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What is your favorite food?",
  "What was the name of your primary school?"
];

export function validateSecurityAnswer(answer: string): boolean {
  return answer.trim().length >= 3;
}
