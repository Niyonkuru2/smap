// Application-wide constants

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    VENDOR: 'vendor',
    CONSUMER: 'consumer',
    BUSINESS: 'business'
};

// User role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
    [USER_ROLES.CONSUMER]: 1,
    [USER_ROLES.BUSINESS]: 2,
    [USER_ROLES.VENDOR]: 3,
    [USER_ROLES.ADMIN]: 4
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
    BASIC: {
        name: 'Basic',
        price: 29.99,
        durationDays: 30,
        maxProducts: 50,
        maxPriceSubmissions: 100,
        prioritySupport: false,
        featuredListing: false,
        analyticsAccess: false
    },
    PREMIUM: {
        name: 'Premium',
        price: 99.99,
        durationDays: 30,
        maxProducts: 200,
        maxPriceSubmissions: 500,
        prioritySupport: true,
        featuredListing: true,
        analyticsAccess: false
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: 299.99,
        durationDays: 30,
        maxProducts: null, // Unlimited
        maxPriceSubmissions: null, // Unlimited
        prioritySupport: true,
        featuredListing: true,
        analyticsAccess: true
    }
};

// Price Status
export const PRICE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    FLAGGED: 'flagged'
};

// Advertisement Types
export const AD_TYPES = {
    BANNER: 'banner',
    SPONSORED: 'sponsored',
    FEATURED: 'featured',
    POPUP: 'popup'
};

// Advertisement Status
export const AD_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ACTIVE: 'active',
    EXPIRED: 'expired'
};

// Notification Types
export const NOTIFICATION_TYPES = {
    PRICE_APPROVAL: 'price_approval',
    PRICE_REJECTION: 'price_rejection',
    SUBSCRIPTION_ACTIVATION: 'subscription_activation',
    SUBSCRIPTION_EXPIRY: 'subscription_expiry',
    AD_APPROVAL: 'ad_approval',
    AD_REJECTION: 'ad_rejection',
    PRICE_ALERT: 'price_alert',
    SYSTEM: 'system',
    PRICE_SUBMITTED: 'price_submitted',
    PAYMENT_RECEIVED: 'payment_received'
};

// Notification Priority
export const NOTIFICATION_PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
};

// Alert Conditions
export const ALERT_CONDITIONS = {
    BELOW: 'below',
    ABOVE: 'above',
    EQUALS: 'equals',
    PERCENTAGE_CHANGE: 'percentage_change'
};

// Report Types
export const REPORT_TYPES = {
    PRICE_TRENDS: 'price_trends',
    VENDOR_PERFORMANCE: 'vendor_performance',
    SUBSCRIPTION_REVENUE: 'subscription_revenue',
    AD_PERFORMANCE: 'ad_performance',
    MARKET_ANALYSIS: 'market_analysis',
    USER_ACTIVITY: 'user_activity'
};

// Report Formats
export const REPORT_FORMATS = {
    PDF: 'pdf',
    CSV: 'csv',
    EXCEL: 'excel',
    JSON: 'json'
};

// Payment Methods
export const PAYMENT_METHODS = {
    MTN_MOMO: 'mtn_momo',
    AIRTEL_MONEY: 'airtel_money',
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer'
};

// Payment Status
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// API Response Codes
export const RESPONSE_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
};

// Rate Limits (requests per time window)
export const RATE_LIMITS = {
    LOGIN: { windowMs: 15 * 60 * 1000, max: 5 },      // 5 attempts per 15 minutes
    SIGNUP: { windowMs: 60 * 60 * 1000, max: 3 },      // 3 attempts per hour
    FORGOT_PASSWORD: { windowMs: 15 * 60 * 1000, max: 3 }, // 3 attempts per 15 minutes
    PRICE_SUBMIT: { windowMs: 60 * 60 * 1000, max: 20 },    // 20 submissions per hour
    API: { windowMs: 60 * 1000, max: 100 }             // 100 requests per minute
};

// Cache Durations (seconds)
export const CACHE_DURATIONS = {
    PRODUCTS: 3600,      // 1 hour
    MARKETS: 3600,       // 1 hour
    PRICES: 300,         // 5 minutes
    CATEGORIES: 86400,   // 24 hours
    STATS: 300           // 5 minutes
};

// Pagination Defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// Email Templates
export const EMAIL_TEMPLATES = {
    VERIFICATION: 'verification',
    PASSWORD_RESET: 'password_reset',
    PRICE_ALERT: 'price_alert',
    SUBSCRIPTION_CONFIRMATION: 'subscription_confirmation',
    AD_APPROVAL: 'ad_approval'
};

// File Upload Limits
export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    MAX_FILES: 5
};

// Supported Languages
export const LANGUAGES = {
    ENGLISH: 'en',
    FRENCH: 'fr',
    KINYARWANDA: 'rw'
};

// Currency
export const CURRENCY = {
    CODE: 'RWF',
    SYMBOL: 'FRw',
    NAME: 'Rwandan Franc',
    DECIMALS: 0
};

// Timezone
export const TIMEZONE = 'Africa/Kigali';

// Session Configuration
export const SESSION_CONFIG = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours in seconds
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 // 7 days
};

// Verification Code Settings
export const VERIFICATION_CONFIG = {
    CODE_LENGTH: 6,
    EXPIRY_MINUTES: 10,
    RESEND_COOLDOWN: 60 // seconds
};

// Password Requirements
export const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true
};

// Database Connection Settings
export const DB_CONFIG = {
    MAX_POOL_SIZE: 20,
    IDLE_TIMEOUT_MS: 30000,
    CONNECTION_TIMEOUT_MS: 10000
};

// Notification Settings
export const NOTIFICATION_SETTINGS = {
    MAX_PER_USER: 100,
    BATCH_SIZE: 50,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 5000
};

// Export all constants as single object
export default {
    USER_ROLES,
    ROLE_HIERARCHY,
    SUBSCRIPTION_PLANS,
    PRICE_STATUS,
    AD_TYPES,
    AD_STATUS,
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITY,
    ALERT_CONDITIONS,
    REPORT_TYPES,
    REPORT_FORMATS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    RESPONSE_CODES,
    RATE_LIMITS,
    CACHE_DURATIONS,
    PAGINATION,
    EMAIL_TEMPLATES,
    FILE_UPLOAD,
    LANGUAGES,
    CURRENCY,
    TIMEZONE,
    SESSION_CONFIG,
    VERIFICATION_CONFIG,
    PASSWORD_REQUIREMENTS,
    DB_CONFIG,
    NOTIFICATION_SETTINGS
};