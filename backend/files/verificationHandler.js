/**
 * Comprehensive Verification Handler
 * Manages email, SMS, and code verification with proper error handling
 */
import { generateVerificationEmailHTML, getEmailSubject } from './emailTemplates.js';

export class VerificationHandler {
  constructor(db, transporter) {
    this.db = db;
    this.transporter = transporter;
    // In-memory storage for verification codes as fallback
    this.emailCodes = new Map();
  }

  /**
   * Send Email Verification
   */
  async sendEmailVerification(email, userName, verificationCode, language = 'en') {
    console.log(`[VERIFICATION] Starting email verification for: ${email}`);
    console.log(`[VERIFICATION] Transporter configured: ${this.transporter ? 'YES' : 'NO'}`);
    
    if (!email || !verificationCode) {
      throw new Error('Email and verification code are required');
    }

    try {
      // Try to store code in database, but don't fail if it doesn't work
      let dbStored = false;
      try {
        const expiresAt = new Date(Date.now() + 60 * 1000);  // 60 seconds (1 minute)
        await this.db.verificationCodes.create(email, verificationCode, expiresAt);
        console.log(`[VERIFICATION] ✅ Code stored in DB for ${email}`);
        dbStored = true;
      } catch (dbError) {
        console.warn(`[VERIFICATION] ⚠️ Database storage failed: ${dbError.message}`);
      }
      
      // Always store in memory as fallback
      const expiresAt = Date.now() + 60 * 1000;  // 60 seconds (1 minute)
      this.emailCodes.set(email, {
        code: verificationCode,
        expiresAt,
        createdAt: new Date()
      });
      console.log(`[VERIFICATION] ✅ Code stored in memory for ${email}`);

      // Check if transporter is configured
      if (!this.transporter) {
        console.warn(`[VERIFICATION] ⚠️ EMAIL TRANSPORTER IS NULL - Email not configured`);
        return { 
          success: false, 
          message: 'Email service is not configured. Please contact support.',
          error: 'Email service unavailable'
        };
      }

      console.log(`[VERIFICATION] 📧 Attempting to send email to: ${email}`);
      console.log(`[VERIFICATION] From: SMPMPS <${process.env.EMAIL_USER}>`);

      try {
        // Send email with better error handling
        const info = await this.transporter.sendMail({
          from: `"SMPMPS" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: getEmailSubject('verification', language),
          html: generateVerificationEmailHTML({
            userName,
            code: verificationCode,
            language,
            expiryMinutes: 10
          }),
          text: `Your verification code is: ${verificationCode}`
        });

        console.log(`[VERIFICATION] ✅ EMAIL SENT SUCCESSFULLY!`);
        console.log(`[VERIFICATION] Message ID: ${info.messageId}`);
        console.log(`[VERIFICATION] Response: ${JSON.stringify(info.response)}`);
        
        return { 
          success: true, 
          message: 'Verification email sent successfully',
          messageId: info.messageId
        };
      } catch (sendError) {
        console.error(`[VERIFICATION] ❌ NODEMAILER SEND ERROR:`);
        console.error(`[VERIFICATION] Error Code: ${sendError.code}`);
        console.error(`[VERIFICATION] Error Message: ${sendError.message}`);
        console.error(`[VERIFICATION] Error Response: ${sendError.response}`);
        console.error(`[VERIFICATION] Full Error:`, sendError);
        
        // Still store code for verification even if email fails
        return { 
          success: false, 
          message: 'Email delivery failed. Please try again or contact support.',
          error: 'Email service error'
        };
      }
    } catch (error) {
      console.error(`[VERIFICATION] ❌ UNEXPECTED ERROR:`, error);
      
      // Still try to store code in memory for verification
      try {
        const expiresAt = Date.now() + 10 * 60 * 1000;
        this.emailCodes.set(email, {
          code: verificationCode,
          expiresAt,
          createdAt: new Date()
        });
        console.log(`[VERIFICATION] ✅ Code stored in memory (email failed) for ${email}`);
      } catch (storageError) {
        console.error(`[VERIFICATION] Failed to store in memory:`, storageError.message);
      }
      
      // Always return success if we have a code (for resilience)
      return { 
        success: false, 
        message: 'Email verification failed. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Verify Email Code
   */
  async verifyEmailCode(email, code) {
    console.log(`[VERIFICATION] Verifying email code for: ${email}`);
    
    if (!email || !code) {
      return { success: false, error: 'Email and code are required' };
    }

    try {
      // First try database
      try {
        const isValid = await this.db.verificationCodes.verify(email, code);
        if (isValid) {
          console.log(`[VERIFICATION] ✅ Code verified in database for ${email}`);
          // Mark user as verified
          const user = await this.db.users.findByEmail(email);
          if (user) {
            await this.db.users.update(user.id, { verified: true });
            console.log(`[VERIFICATION] ✅ User ${email} marked as verified`);
          }
          return { success: true, message: 'Email verified successfully' };
        }
      } catch (dbError) {
        console.warn(`[VERIFICATION] Database check failed: ${dbError.message}`);
      }
      
      // Check in-memory storage as fallback
      const stored = this.emailCodes.get(email);
      if (!stored) {
        console.warn(`[VERIFICATION] ❌ No code found for ${email}`);
        return { success: false, error: 'No verification code found. Please request a new one.' };
      }
      
      if (Date.now() > stored.expiresAt) {
        this.emailCodes.delete(email);
        console.warn(`[VERIFICATION] ❌ Code expired for ${email}`);
        return { success: false, error: 'Code expired. Please request a new one.' };
      }
      
      if (stored.code !== code) {
        console.warn(`[VERIFICATION] ❌ Invalid code for ${email}`);
        return { success: false, error: 'Invalid verification code. Please try again.' };
      }
      
      // Code is valid - delete it
      this.emailCodes.delete(email);
      console.log(`[VERIFICATION] ✅ Code verified in memory for ${email}`);
      
      // Mark user as verified
      try {
        const user = await this.db.users.findByEmail(email);
        if (user) {
          await this.db.users.update(user.id, { verified: true });
          console.log(`[VERIFICATION] ✅ User ${email} marked as verified`);
        }
      } catch (userError) {
        console.warn(`[VERIFICATION] Could not mark user as verified: ${userError.message}`);
      }
      
      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      console.error(`[VERIFICATION] Verification error:`, error.message);
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  }

  /**
   * Send SMS Verification
   */
  async sendSMSVerification(phone, userName, verificationCode) {
    console.log(`[VERIFICATION] Starting SMS verification for: ${phone}`);
    
    if (!phone || !verificationCode) {
      throw new Error('Phone and verification code are required');
    }

    // Format phone number for Rwanda
    const formattedPhone = this._formatPhoneNumber(phone);
    
    try {
      // Validate phone format
      if (!/^\+250[0-9]{9}$/.test(formattedPhone)) {
        throw new Error('Invalid phone number format. Expected: 0781234567 or +250781234567');
      }

      // Store code (expires in 10 minutes)
      const expiresAt = Date.now() + 10 * 60 * 1000;
      
      // In-memory storage for SMS codes (consider moving to DB in production)
      global.smsVerificationCodes = global.smsVerificationCodes || new Map();
      global.smsVerificationCodes.set(formattedPhone, { 
        code: verificationCode, 
        expiresAt,
        createdAt: new Date()
      });
      
      console.log(`[VERIFICATION] ✅ SMS code stored for ${formattedPhone}`);

      // Check if SMS provider is configured
      if (!process.env.SMS_PROVIDER) {
        console.warn(`[VERIFICATION] SMS provider not configured`);
        return { 
          success: false, 
          message: 'SMS service is not configured. Please use email verification instead.',
          error: 'SMS service unavailable'
        };
      }

      // In production, you would call actual SMS provider (Twilio, Africa's Talking, etc.)
      // For now, just log it
      console.log(`[VERIFICATION] ✅ SMS would be sent to ${formattedPhone}: Your code is ${verificationCode}`);

      return { 
        success: true, 
        message: 'SMS verification code sent successfully' 
      };
    } catch (error) {
      console.error(`[VERIFICATION] ❌ SMS error:`, error.message);
      
      // Always try to return success if we stored the code
      // SMS sending failure shouldn't prevent verification flow
      try {
        global.smsVerificationCodes = global.smsVerificationCodes || new Map();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        global.smsVerificationCodes.set(this._formatPhoneNumber(phone), { 
          code: verificationCode, 
          expiresAt,
          createdAt: new Date()
        });
        
        return { 
          success: false, 
          message: 'SMS delivery failed. Please try email verification or contact support.',
          error: error.message
        };
      } catch (fallbackError) {
        console.error(`[VERIFICATION] ❌ Even fallback failed:`, fallbackError.message);
        throw error;
      }
    }
  }

  /**
   * Verify SMS Code
   */
  async verifySMSCode(phone, code) {
    console.log(`[VERIFICATION] Verifying SMS code for: ${phone}`);
    
    if (!phone || !code) {
      throw new Error('Phone and code are required');
    }

    const formattedPhone = this._formatPhoneNumber(phone);
    
    global.smsVerificationCodes = global.smsVerificationCodes || new Map();
    const stored = global.smsVerificationCodes.get(formattedPhone);

    if (!stored) {
      console.warn(`[VERIFICATION] No SMS code found for ${formattedPhone}`);
      throw new Error('No verification code found. Please request a new one.');
    }

    if (Date.now() > stored.expiresAt) {
      global.smsVerificationCodes.delete(formattedPhone);
      console.warn(`[VERIFICATION] SMS code expired for ${formattedPhone}`);
      throw new Error('Code expired. Please request a new one.');
    }

    if (stored.code !== code) {
      console.warn(`[VERIFICATION] Invalid SMS code for ${formattedPhone}`);
      throw new Error('Invalid code. Please try again.');
    }

    // Code is valid - delete it
    global.smsVerificationCodes.delete(formattedPhone);
    console.log(`[VERIFICATION] ✅ SMS code verified for ${formattedPhone}`);
    
    return { success: true, message: 'Phone verified successfully' };
  }

  // Helper methods
  _formatPhoneNumber(phone) {
    let formatted = phone.trim();
    if (formatted.startsWith('0')) {
      formatted = '+250' + formatted.substring(1);
    } else if (!formatted.startsWith('+')) {
      formatted = '+250' + formatted;
    }
    return formatted;
  }

}

export default VerificationHandler;
