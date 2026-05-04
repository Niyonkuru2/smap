/**
 * Custom App Error class for consistent error handling
 */
export class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async handler wrapper to avoid try-catch in controllers
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Format success response
 */
export const formatSuccess = (data, message = 'Success', statusCode = 200) => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

/**
 * Format error response
 */
export const formatError = (message, statusCode = 400, details = null) => {
    return {
        success: false,
        error: message,
        details,
        timestamp: new Date().toISOString()
    };
};

/**
 * Sanitize user object (remove sensitive data)
 */
export const sanitizeUser = (user) => {
    if (!user) return null;
    
    const { password_hash, ...sanitized } = user;
    return sanitized;
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate 6-digit verification code
 */
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Rwanda format)
 */
export const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^(\+250|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
        isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecial,
        requirements: {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecial
        }
    };
};

/**
 * Mask email (e.g., u***r@example.com)
 */
export const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    const maskedLocal = local[0] + '***' + local[local.length - 1];
    return `${maskedLocal}@${domain}`;
};

/**
 * Mask phone number (e.g., +250***123)
 */
export const maskPhone = (phone) => {
    if (!phone) return '';
    if (phone.length <= 6) return phone;
    return phone.slice(0, 4) + '***' + phone.slice(-3);
};

/**
 * Sleep/delay function
 */
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await sleep(delay * Math.pow(2, i));
            }
        }
    }
    
    throw lastError;
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Truncate string to maximum length
 */
export const truncate = (str, maxLength = 100, suffix = '...') => {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Extract pagination parameters from request
 */
export const getPaginationParams = (query, defaultLimit = 20, maxLimit = 100) => {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || defaultLimit;
    
    page = Math.max(1, page);
    limit = Math.min(maxLimit, Math.max(1, limit));
    
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
};

/**
 * Format date to ISO string with timezone
 */
export const formatDate = (date, format = 'iso') => {
    const d = new Date(date);
    
    switch (format) {
        case 'date':
            return d.toISOString().split('T')[0];
        case 'time':
            return d.toTimeString().split(' ')[0];
        case 'datetime':
            return d.toISOString().replace('T', ' ').substring(0, 19);
        default:
            return d.toISOString();
    }
};

/**
 * Calculate percentage change between two numbers
 */
export const percentChange = (oldValue, newValue) => {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

/**
 * Remove null/undefined values from object
 */
export const cleanObject = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
            result[key] = value;
        }
    }
    return result;
};

/**
 * Parse JSON safely
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return defaultValue;
    }
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

// Default export for backward compatibility
export default {
    AppError,
    catchAsync,
    formatSuccess,
    formatError,
    sanitizeUser,
    generateRandomString,
    generateVerificationCode,
    isValidEmail,
    isValidPhoneNumber,
    isStrongPassword,
    maskEmail,
    maskPhone,
    sleep,
    retry,
    deepClone,
    truncate,
    getPaginationParams,
    formatDate,
    percentChange,
    groupBy,
    cleanObject,
    safeJsonParse,
    isEmpty
};