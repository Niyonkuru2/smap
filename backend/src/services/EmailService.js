import nodemailer from 'nodemailer';
import {
    getVerificationTemplate,
    getPasswordResetTemplate,
    getPriceAlertTemplate,
    getWelcomeTemplate
} from './email/templates.js';

// ============================================
// TRANSPORTER SETUP
// ============================================

let transporter = null;
let isConfiguredFlag = false;

function initializeTransporter() {
    // =========================
    // SENDGRID (priority)
    // =========================
    if (process.env.SENDGRID_API_KEY) {
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
        verifyTransporter('SendGrid');
        return transporter;
    }

    // =========================
    // SMTP / GMAIL (FIXED)
    // =========================
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const isGmail =
            process.env.EMAIL_USER.includes('gmail.com') ||
            process.env.SMTP_HOST?.includes('gmail');

        // 🔥 FIX: NEVER use `service: gmail`
        const config = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };

        transporter = nodemailer.createTransport({
            ...config,
            connectionTimeout: 30000,
            socketTimeout: 30000,

            // 🔥 CRITICAL FIX FOR RENDER (IPv4)
            family: 4,
            requireTLS: true,
            tls: {
                rejectUnauthorized: false
            }
        });

        isConfiguredFlag = true;
        verifyTransporter(isGmail ? 'Gmail' : 'SMTP');
        return transporter;
    }

    // =========================
    // NO CONFIG
    // =========================
    console.warn('⚠️ Email service not configured');
    isConfiguredFlag = false;
    transporter = null;
    return null;
}

// ============================================
// VERIFY CONNECTION
// ============================================

function verifyTransporter(name) {
    transporter.verify((error) => {
        if (error) {
            console.error(`❌ ${name} verification failed:`, error.message);
            isConfiguredFlag = false;
        } else {
            console.log(`✅ ${name} SMTP ready`);
        }
    });
}

// Initialize
initializeTransporter();

// ============================================
// HELPERS
// ============================================

export const isConfigured = () => isConfiguredFlag && transporter !== null;
export const getTransporter = () => transporter;
export const isEmailConfigured = () => isConfigured();

// ============================================
// RETRY LOGIC (VERY IMPORTANT)
// ============================================

const sendWithRetry = async (mailOptions, retries = 2) => {
    try {
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        if (retries > 0) {
            console.warn(`Retrying email... (${retries} left)`);
            await new Promise(res => setTimeout(res, 2000));
            return sendWithRetry(mailOptions, retries - 1);
        }
        throw error;
    }
};

// ============================================
// SEND EMAIL
// ============================================

export const sendEmail = async ({ to, subject, html, text }) => {
    if (!isConfigured()) {
        console.warn(`Email skipped → ${to}`);
        return {
            success: false,
            skipped: true,
            error: 'Email service not configured'
        };
    }

    try {
        const from =
            process.env.EMAIL_FROM ||
            process.env.EMAIL_USER ||
            'noreply@smpmps.com';

        const info = await sendWithRetry({
            from: `"SMPMPS" <${from}>`,
            to,
            subject,
            html,
            text: text || html?.replace(/<[^>]*>/g, '') || ''
        });

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        // CLEAN ERROR HANDLING
        if (error.code === 'EAUTH') {
            console.error('Auth failed (check App Password)');
        } else if (error.code === 'ENETUNREACH') {
            console.error('Network unreachable (SMTP blocked)');
        } else if (error.message?.includes('timeout')) {
            console.error('SMTP timeout');
        }

        return {
            success: false,
            error: error.message
        };
    }
};

// ============================================
// EMAIL TYPES
// ============================================

export const sendVerificationEmail = async (to, name, code, lang = 'en') => {
    const { subject, html } = getVerificationTemplate(name, code, lang);
    return sendEmail({ to, subject, html });
};

export const sendPasswordResetEmail = async (to, name, token, code, lang = 'en') => {
    const { subject, html } = getPasswordResetTemplate(name, token, code, lang);
    return sendEmail({ to, subject, html });
};

export const sendPriceAlertEmail = async (to, name, data) => {
    const { subject, html } = getPriceAlertTemplate(name, data);
    return sendEmail({ to, subject, html });
};

export const sendWelcomeEmail = async (to, name, lang = 'en') => {
    const { subject, html } = getWelcomeTemplate(name, lang);
    return sendEmail({ to, subject, html });
};

// SERVICE EXPORT

export default {
    isConfigured,
    getTransporter,
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendPriceAlertEmail,
    sendWelcomeEmail
};