/**
 * Email validation utilities
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.com',
    'mailinator.com',
    'guerrillamail.com',
    '10minutemail.com',
    'temp-mail.org',
    'fakeinbox.com',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.some(d => domain?.includes(d));
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (password.length > 50) {
    errors.push('Password must be less than 50 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}