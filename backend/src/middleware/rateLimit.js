import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants.js';

// Store for custom rate limiting (in-memory, use Redis in production)
const requestCounts = new Map();
const loginAttempts = new Map();
const accountLocks = new Map();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
    const now = Date.now();
    
    for (const [key, data] of requestCounts.entries()) {
        if (data.resetTime < now) {
            requestCounts.delete(key);
        }
    }
    
    for (const [key, data] of loginAttempts.entries()) {
        if (data.resetTime < now) {
            loginAttempts.delete(key);
        }
    }
    
    for (const [key, data] of accountLocks.entries()) {
        if (data.expiresAt < now) {
            accountLocks.delete(key);
        }
    }
}, 60000); // Clean up every minute

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
    windowMs: RATE_LIMITS.API.windowMs,
    max: RATE_LIMITS.API.max,
    message: {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again later.`,
        retryAfter: Math.ceil(RATE_LIMITS.API.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    }
});

/**
 * Login rate limiter - stricter
 */
export const loginLimiter = rateLimit({
    windowMs: RATE_LIMITS.LOGIN.windowMs,
    max: RATE_LIMITS.LOGIN.max,
    message: {
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes',
        retryAfter: 900
    },
    skipSuccessfulRequests: true
});

/**
 * Signup rate limiter
 */
export const signupLimiter = rateLimit({
    windowMs: RATE_LIMITS.SIGNUP.windowMs,
    max: RATE_LIMITS.SIGNUP.max,
    message: {
        error: 'Too many signup attempts',
        message: 'Please try again after an hour'
    },
    keyGenerator: (req) => req.body.email || req.ip
});

/**
 * Forgot password rate limiter
 */
export const forgotPasswordLimiter = rateLimit({
    windowMs: RATE_LIMITS.FORGOT_PASSWORD.windowMs,
    max: RATE_LIMITS.FORGOT_PASSWORD.max,
    message: {
        error: 'Too many password reset requests',
        message: 'Please try again after 15 minutes'
    }
});

/**
 * Price submission rate limiter
 */
export const priceSubmitLimiter = rateLimit({
    windowMs: RATE_LIMITS.PRICE_SUBMIT.windowMs,
    max: RATE_LIMITS.PRICE_SUBMIT.max,
    message: {
        error: 'Too many price submissions',
        message: 'You have exceeded the hourly submission limit'
    },
    keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Strict rate limiter for sensitive endpoints
 * @param {number} max - Maximum requests
 * @param {number} windowMs - Time window in milliseconds
 */
export const strictRateLimiter = (max = 10, windowMs = 60000) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: 'Rate limit exceeded',
            message: `Too many requests. Please try again after ${Math.ceil(windowMs / 1000)} seconds.`
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

/**
 * Account lockout middleware
 * Locks account after too many failed login attempts
 */
export const accountLockout = () => {
    return async (req, res, next) => {
        const email = req.body.email;
        
        if (!email) {
            return next();
        }
        
        const lockData = accountLocks.get(email);
        
        if (lockData && lockData.expiresAt > Date.now()) {
            const minutesLeft = Math.ceil((lockData.expiresAt - Date.now()) / 60000);
            return res.status(423).json({
                error: 'Account locked',
                message: `Too many failed attempts. Account locked for ${minutesLeft} minutes.`,
                minutesLeft
            });
        }
        
        next();
    };
};

/**
 * Record failed login attempt
 */
export const recordFailedLogin = (email) => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    let attempts = loginAttempts.get(email);
    
    if (!attempts || attempts.resetTime < now) {
        attempts = {
            count: 1,
            resetTime: now + windowMs
        };
    } else {
        attempts.count++;
    }
    
    loginAttempts.set(email, attempts);
    
    // Lock account after 5 failed attempts
    if (attempts.count >= 5) {
        accountLocks.set(email, {
            expiresAt: now + (15 * 60 * 1000) // Lock for 15 minutes
        });
    }
    
    return {
        remainingAttempts: Math.max(0, 5 - attempts.count),
        lockoutAt: attempts.count >= 5
    };
};

/**
 * Clear login attempts on successful login
 */
export const clearLoginAttempts = (email) => {
    loginAttempts.delete(email);
    accountLocks.delete(email);
};

/**
 * IP-based rate limiter for anonymous endpoints
 */
export const ipLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: {
        error: 'Too many requests',
        message: 'Please slow down and try again'
    },
    keyGenerator: (req) => req.ip
});

/**
 * Custom rate limiter factory
 * @param {Object} options - Rate limit options
 */
export const createRateLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs || 60000,
        max: options.max || 100,
        message: options.message || { error: 'Rate limit exceeded' },
        keyGenerator: options.keyGenerator || ((req) => req.user?.id || req.ip),
        skip: options.skip || (() => false)
    });
};

export default {
    apiLimiter,
    loginLimiter,
    signupLimiter,
    forgotPasswordLimiter,
    priceSubmitLimiter,
    strictRateLimiter,
    accountLockout,
    ipLimiter,
    createRateLimiter,
    recordFailedLogin,
    clearLoginAttempts
};