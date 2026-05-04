// Email Verification System

import { 
  generateVerificationEmailHTML,
  generateWelcomeEmailHTML,
  type EmailLanguage
} from './emailTemplates';

export interface VerificationEmail {
  to: string;
  subject: string;
  code: string;
  userName: string;
  expiresAt: Date;
}

export interface VerificationRecord {
  email: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

// In-memory storage for demo (in production, use database)
const verificationCodes = new Map<string, VerificationRecord>();

/**
 * Simulate email sending (for demo)
 */
async function simulateEmailSending(
  email: string,
  userName: string,
  code: string,
  language: EmailLanguage = 'en'
): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log email content (in production, this would be actual email)
  const emailContent = `
    ═══════════════════════════════════════════════
    🇷🇼 Smart Market Price Monitoring and Prediction System
    ═══════════════════════════════════════════════
    
    Hello ${userName}!
    
    Welcome to SMPMPS! 
    
    Your verification code is:
    
    ╔═══════════════╗
    ║               ║
    ║     ${code}     ║
    ║               ║
    ╚═══════════════╝
    
    This code will expire in 1 minute.
    
    If you didn't create this account, please ignore this email.
    
    Best regards,
    SMPMPS Team
    
    ═══════════════════════════════════════════════
  `;
  
  console.log(emailContent);
  
  // In production, replace with actual email service:
  /*
  await emailService.send({
    to: email,
    subject: 'Verify Your Email - SMPMPS',
    html: generateVerificationEmailHTML(userName, code, language),
    text: emailContent
  });
  */
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  code: string,
  language: EmailLanguage = 'en'
): Promise<boolean> {
  try {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log('[EMAIL] Sending verification email to:', email);
    console.log('Verification Code:', code);
    
    // Store verification record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1); // Expires in 1 minute
    
    verificationCodes.set(email, {
      email,
      code,
      createdAt: new Date(),
      expiresAt,
      attempts: 0,
      verified: false
    });
    
    // Simulate email sending
    // In production, call actual email service API
    await simulateEmailSending(email, userName, code, language);
    
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Verify email code
 */
export function verifyEmailCode(email: string, code: string): {
  success: boolean;
  message: string;
} {
  const record = verificationCodes.get(email);
  
  if (!record) {
    return {
      success: false,
      message: 'No verification code found for this email'
    };
  }
  
  // Check if already verified
  if (record.verified) {
    return {
      success: false,
      message: 'Email already verified'
    };
  }
  
  // Check if expired
  if (new Date() > record.expiresAt) {
    return {
      success: false,
      message: 'Verification code has expired. Please request a new one.'
    };
  }
  
  // Check attempts
  if (record.attempts >= 3) {
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new code.'
    };
  }
  
  // Increment attempts
  record.attempts++;
  
  // Verify code
  if (record.code === code) {
    record.verified = true;
    return {
      success: true,
      message: 'Email verified successfully!'
    };
  }
  
  return {
    success: false,
    message: `Invalid verification code. ${3 - record.attempts} attempts remaining.`
  };
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(
  email: string,
  userName: string,
  newCode: string,
  language: EmailLanguage = 'en'
): Promise<boolean> {
  // Delete old record
  verificationCodes.delete(email);
  
  // Send new code
  return await sendVerificationEmail(email, userName, newCode, language);
}

/**
 * Check if email is verified
 */
export function isEmailVerified(email: string): boolean {
  const record = verificationCodes.get(email);
  return record?.verified ?? false;
}

/**
 * Get verification status
 */
export function getVerificationStatus(email: string): {
  exists: boolean;
  verified: boolean;
  expiresAt?: Date;
  attemptsRemaining?: number;
} {
  const record = verificationCodes.get(email);
  
  if (!record) {
    return { exists: false, verified: false };
  }
  
  return {
    exists: true,
    verified: record.verified,
    expiresAt: record.expiresAt,
    attemptsRemaining: 3 - record.attempts
  };
}

/**
 * Clean up expired codes
 */
export function cleanupExpiredCodes(): void {
  const now = new Date();
  
  for (const [email, record] of verificationCodes.entries()) {
    if (now > record.expiresAt && !record.verified) {
      verificationCodes.delete(email);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string, userName: string, language: EmailLanguage = 'en'): Promise<void> {
  console.log(`[EMAIL] Sending welcome email to ${userName} <${email}>`);
  
  const welcomeMessage = `
    ═══════════════════════════════════════════════
    🎉 Welcome to SMPMPS! 🎉
    ═══════════════════════════════════════════════
    
    Hello ${userName}!
    
    Your email has been verified successfully!
    
    You can now access all features:
    ✅ Real-time price comparison
    ✅ Market insights and analytics
    ✅ Price alerts and notifications
    ✅ Shopping list planning
    ✅ Offline functionality
    
    Get started: Log in to your account
    
    Need help? Contact our support team
    
    Happy shopping!
    
    Best regards,
    SMPMPS Team
    ═══════════════════════════════════════════════
  `;
  
  console.log(welcomeMessage);
  
  // In production, replace with actual email service:
  /*
  await emailService.send({
    to: email,
    subject: 'Welcome to SMPMPS!',
    html: generateWelcomeEmailHTML(userName, language),
    text: welcomeMessage
  });
  */
}