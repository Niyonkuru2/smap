import nodemailer from 'nodemailer';
import {
    getVerificationTemplate,
    getPasswordResetTemplate,
    getPriceAlertTemplate,
    getWelcomeTemplate
} from './email/templates.js';

// Email transporter setup
let transporter = null;
let isConfiguredFlag = false;

/**
 * Initialize email transporter based on available configuration
 * Priority: SendGrid > Custom SMTP > Gmail > No email service
 */
function initializeTransporter() {
    // Check for SendGrid API key (primary for production)
    if (process.env.SENDGRID_API_KEY) {
        console.log('🔌 Configuring SendGrid email transporter...');
        
        transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            },
            connectionTimeout: 30000,
            socketTimeout: 30000,
            family: 4
        });
        
        isConfiguredFlag = true;
        
        transporter.verify((error) => {
            if (error) {
                console.error('❌ SendGrid verification failed:', error.message);
                isConfiguredFlag = false;
            } else {
                console.log('✅ SendGrid SMTP verified and ready!');
            }
        });
        
        return transporter;
    }
    
    // Check for custom SMTP configuration (including Gmail)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Determine if this is Gmail
        const isGmail = process.env.EMAIL_USER.includes('gmail.com') || 
                       process.env.SMTP_HOST?.includes('gmail');
        
        console.log(`🔌 Configuring ${isGmail ? 'Gmail' : 'Custom SMTP'} email transporter...`);
        
        const config = isGmail ? {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        } : {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };
        
        transporter = nodemailer.createTransport({
            ...config,
            connectionTimeout: 30000,
            socketTimeout: 30000,
            family: 4
        });
        
        isConfiguredFlag = true;
        
        transporter.verify((error) => {
            if (error) {
                console.error(`❌ ${isGmail ? 'Gmail' : 'Custom SMTP'} verification failed:`, error.message);
                if (isGmail && error.message.includes('Invalid login')) {
                    console.error('   For Gmail, you must use an App Password, not your regular password');
                    console.error('   Generate one at: https://myaccount.google.com/apppasswords');
                }
                isConfiguredFlag = false;
            } else {
                console.log(`✅ ${isGmail ? 'Gmail' : 'Custom SMTP'} verified and ready!`);
            }
        });
        
        return transporter;
    }
    
    // No email configuration found
    console.warn('⚠️ Email not configured');
    console.warn('   Options:');
    console.warn('   1. Set SENDGRID_API_KEY for SendGrid (recommended for production)');
    console.warn('   2. Set EMAIL_USER and EMAIL_PASS for Gmail or custom SMTP');
    isConfiguredFlag = false;
    transporter = null;
    
    return null;
}

// Initialize on module load
initializeTransporter();

/**
 * Check if email service is configured (property style - for backward compatibility)
 */
export const isConfigured = () => isConfiguredFlag && transporter !== null;

/**
 * Check if email service is configured (function style - for direct property access)
 */
isConfigured.isConfigured = isConfiguredFlag && transporter !== null;

/**
 * Get email transporter instance
 */
export const getTransporter = () => transporter;

/**
 * Check if email service is configured and ready (legacy method name)
 */
export const isEmailConfigured = () => isConfiguredFlag && transporter !== null;

/**
 * Get email configuration status for diagnostics
 */
export const getEmailStatus = () => {
    const config = {
        sendgrid: process.env.SENDGRID_API_KEY ? '✅ SET' : '❌ NOT SET',
        email_user: process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET',
        email_pass: process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET'
    };
    
    let activeProvider = 'NONE';
    if (process.env.SENDGRID_API_KEY) activeProvider = 'SendGrid';
    else if (process.env.EMAIL_USER) activeProvider = 'Custom SMTP';
    
    return {
        configured: isConfiguredFlag && transporter !== null,
        isConfigured: isConfiguredFlag && transporter !== null, // For backward compatibility
        transporterInitialized: transporter !== null,
        emailProvider: activeProvider,
        configuration: config,
        action: !transporter ? 'Email service not configured' : 'Email service ready!'
    };
};

/**
 * Get health status for email service
 */
export const getHealthStatus = () => {
    return {
        configured: isConfiguredFlag && transporter !== null,
        provider: process.env.SENDGRID_API_KEY ? 'SendGrid' : 
                 (process.env.EMAIL_USER ? 'SMTP' : 'None'),
        timestamp: new Date().toISOString()
    };
};

/**
 * Send email with proper error handling
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    if (!isConfiguredFlag || !transporter) {
        console.warn(`⚠️ Email not sent to ${to}: Service not configured`);
        return {
            success: false,
            error: 'Email service not configured',
            skipped: true
        };
    }
    
    try {
        const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@smpmps.com';
        
        const info = await transporter.sendMail({
            from: `"SMPMPS" <${from}>`,
            to,
            subject,
            html,
            text: text || html?.replace(/<[^>]*>/g, '') || ''
        });
        
        console.log(`✅ Email sent to ${to}, Message ID: ${info.messageId}`);
        
        return {
            success: true,
            messageId: info.messageId,
            sentTo: to
        };
    } catch (error) {
        console.error(`❌ Email send failed to ${to}:`, error.message);
        
        // Enhanced error logging
        if (error.code === 'EAUTH') {
            console.error('   🔴 Authentication failed - check credentials');
            if (process.env.EMAIL_USER?.includes('gmail.com')) {
                console.error('   For Gmail, you must use an App Password: https://myaccount.google.com/apppasswords');
            }
        } else if (error.code === 'ENETUNREACH' || error.message?.includes('ENETUNREACH')) {
            console.error('   🔴 Cannot reach SMTP server - network issue');
        } else if (error.message?.includes('timeout')) {
            console.error('   🔴 Connection timeout - check firewall settings');
        }
        
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
};

/**
 * Send verification email with OTP code
 */
export const sendVerificationEmail = async (to, userName, verificationCode, language = 'en') => {
    const { subject, html } = getVerificationTemplate(userName, verificationCode, language);
    return sendEmail({ to, subject, html });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to, userName, resetToken, resetCode, language = 'en') => {
    const { subject, html } = getPasswordResetTemplate(userName, resetToken, resetCode, language);
    return sendEmail({ to, subject, html });
};

/**
 * Send price alert notification email
 */
export const sendPriceAlertEmail = async (to, userName, alertData) => {
    const { subject, html } = getPriceAlertTemplate(userName, alertData);
    return sendEmail({ to, subject, html });
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (to, userName, language = 'en') => {
    const { subject, html } = getWelcomeTemplate(userName, language);
    return sendEmail({ to, subject, html });
};

// Create the EmailService object for default export (backward compatible)
const EmailService = {
    isConfigured: () => isConfiguredFlag && transporter !== null,
    isConfiguredFlag: isConfiguredFlag && transporter !== null,
    getTransporter: () => transporter,
    getEmailStatus,
    getHealthStatus,
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendPriceAlertEmail,
    sendWelcomeEmail,
    transporter
};

export default EmailService;