/**
 * SECURITY MIDDLEWARE
 * ===================
 * 1. IP-based rate limiting
 * 2. Phone verification
 * 3. CAPTCHA validation
 * 4. Location verification
 * 5. Account lockout
 */

// ============================================
// 1. IP-BASED RATE LIMITING
// ============================================

const ipRequestCounts = new Map();
const blockedIPs = new Map();

// Rate limit configuration - higher limits for development
const isDevelopment = process.env.NODE_ENV === 'development';
const IP_RATE_LIMIT = {
    maxRequests: isDevelopment ? 1000 : 100,        // Max requests per window (1000 in dev, 100 in prod)
    windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min in dev, 15 min in prod
    blockDuration: isDevelopment ? 1 * 60 * 1000 : 30 * 60 * 1000 // 1 min block in dev, 30 min in prod
};

// Function to clear all blocked IPs (useful for development/testing)
function clearBlockedIPs() {
    blockedIPs.clear();
    ipRequestCounts.clear();
    console.log('✅ All rate limit blocks cleared');
    return { success: true, message: 'All rate limit blocks cleared' };
}

// Function to unblock a specific IP
function unblockIP(ip) {
    blockedIPs.delete(ip);
    ipRequestCounts.delete(ip);
    console.log(`✅ Unblocked IP: ${ip}`);
    return { success: true, message: `Unblocked IP: ${ip}` };
}

function ipRateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Check if IP is blocked
    const blockExpiry = blockedIPs.get(ip);
    if (blockExpiry && blockExpiry > now) {
        const minutesLeft = Math.ceil((blockExpiry - now) / 60000);
        return res.status(429).json({
            error: 'Too many requests',
            message: `Your IP is temporarily blocked. Try again in ${minutesLeft} minutes.`,
            retryAfter: minutesLeft
        });
    } else if (blockExpiry) {
        blockedIPs.delete(ip);
    }
    
    // Track requests
    const ipData = ipRequestCounts.get(ip) || { count: 0, windowStart: now };
    
    // Reset window if expired
    if (now - ipData.windowStart > IP_RATE_LIMIT.windowMs) {
        ipData.count = 0;
        ipData.windowStart = now;
    }
    
    ipData.count++;
    ipRequestCounts.set(ip, ipData);
    
    // Check if limit exceeded
    if (ipData.count > IP_RATE_LIMIT.maxRequests) {
        blockedIPs.set(ip, now + IP_RATE_LIMIT.blockDuration);
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP. You have been temporarily blocked.',
            retryAfter: 30
        });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', IP_RATE_LIMIT.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, IP_RATE_LIMIT.maxRequests - ipData.count));
    res.setHeader('X-RateLimit-Reset', ipData.windowStart + IP_RATE_LIMIT.windowMs);
    
    next();
}

// Stricter rate limit for sensitive endpoints
function strictRateLimiter(maxRequests = 5, windowMs = 60000) {
    const requestCounts = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        
        const data = requestCounts.get(ip) || { count: 0, windowStart: now };
        
        if (now - data.windowStart > windowMs) {
            data.count = 0;
            data.windowStart = now;
        }
        
        data.count++;
        requestCounts.set(ip, data);
        
        if (data.count > maxRequests) {
            return res.status(429).json({
                error: 'Too many attempts',
                message: `Maximum ${maxRequests} attempts allowed. Please wait.`,
                retryAfter: Math.ceil((data.windowStart + windowMs - now) / 1000)
            });
        }
        
        next();
    };
}

// ============================================
// 2. PHONE VERIFICATION
// ============================================

const phoneVerificationCodes = new Map();
const PHONE_CONFIG = {
    codeLength: 6,
    expiryMinutes: 10,
    maxAttempts: 3
};

function generatePhoneCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendPhoneVerification(phoneNumber) {
    // Validate Rwanda phone format
    const rwandaPhoneRegex = /^(\+250|0)?7[2389]\d{7}$/;
    if (!rwandaPhoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        return {
            success: false,
            error: 'Invalid Rwanda phone number. Use format: 07XXXXXXXX or +2507XXXXXXXX'
        };
    }
    
    // Normalize phone number
    let normalized = phoneNumber.replace(/\s/g, '');
    if (normalized.startsWith('0')) {
        normalized = '+250' + normalized.substring(1);
    } else if (!normalized.startsWith('+')) {
        normalized = '+250' + normalized;
    }
    
    const code = generatePhoneCode();
    const expiry = Date.now() + (PHONE_CONFIG.expiryMinutes * 60 * 1000);
    
    phoneVerificationCodes.set(normalized, {
        code,
        expiry,
        attempts: 0,
        verified: false
    });
    
    // In production, integrate with SMS provider like:
    // - Twilio
    // - Africa's Talking
    // - Pindo (Rwanda local)
    console.log(`📱 SMS to ${normalized}: Your verification code is ${code}`);
    
    return {
        success: true,
        message: 'Verification code sent to your phone',
        phone: normalized.replace(/(\+250)(\d{2})(\d{3})(\d{4})/, '$1 $2 *** $4'), // Masked
        expiresIn: PHONE_CONFIG.expiryMinutes + ' minutes',
        // For testing only - remove in production!
        _testCode: process.env.NODE_ENV === 'development' ? code : undefined
    };
}

function verifyPhoneCode(phoneNumber, code) {
    let normalized = phoneNumber.replace(/\s/g, '');
    if (normalized.startsWith('0')) {
        normalized = '+250' + normalized.substring(1);
    } else if (!normalized.startsWith('+')) {
        normalized = '+250' + normalized;
    }
    
    const data = phoneVerificationCodes.get(normalized);
    
    if (!data) {
        return { success: false, error: 'No verification code sent to this number' };
    }
    
    if (Date.now() > data.expiry) {
        phoneVerificationCodes.delete(normalized);
        return { success: false, error: 'Verification code expired. Request a new one.' };
    }
    
    if (data.attempts >= PHONE_CONFIG.maxAttempts) {
        phoneVerificationCodes.delete(normalized);
        return { success: false, error: 'Too many failed attempts. Request a new code.' };
    }
    
    if (data.code !== code) {
        data.attempts++;
        return { 
            success: false, 
            error: 'Invalid code',
            attemptsRemaining: PHONE_CONFIG.maxAttempts - data.attempts
        };
    }
    
    // Success!
    data.verified = true;
    phoneVerificationCodes.set(normalized, data);
    
    return {
        success: true,
        message: 'Phone number verified successfully!',
        phone: normalized
    };
}

// ============================================
// 3. CAPTCHA VALIDATION
// ============================================

const captchaChallenges = new Map();
const CAPTCHA_CONFIG = {
    expiryMinutes: 5,
    difficulty: 'medium' // easy, medium, hard
};

// Simple math CAPTCHA (no external service needed)
function generateCaptcha() {
    const id = Math.random().toString(36).substring(2, 15);
    let num1, num2, operator, answer;
    
    switch (CAPTCHA_CONFIG.difficulty) {
        case 'easy':
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            operator = '+';
            answer = num1 + num2;
            break;
        case 'hard':
            num1 = Math.floor(Math.random() * 50) + 10;
            num2 = Math.floor(Math.random() * 20) + 5;
            operator = ['+', '-', '×'][Math.floor(Math.random() * 3)];
            if (operator === '+') answer = num1 + num2;
            else if (operator === '-') answer = num1 - num2;
            else answer = num1 * num2;
            break;
        default: // medium
            num1 = Math.floor(Math.random() * 20) + 5;
            num2 = Math.floor(Math.random() * 10) + 1;
            operator = ['+', '-'][Math.floor(Math.random() * 2)];
            answer = operator === '+' ? num1 + num2 : num1 - num2;
    }
    
    const expiry = Date.now() + (CAPTCHA_CONFIG.expiryMinutes * 60 * 1000);
    
    captchaChallenges.set(id, { answer: answer.toString(), expiry });
    
    // Clean up old challenges
    setTimeout(() => captchaChallenges.delete(id), CAPTCHA_CONFIG.expiryMinutes * 60 * 1000);
    
    return {
        id,
        challenge: `What is ${num1} ${operator} ${num2}?`,
        expiresIn: CAPTCHA_CONFIG.expiryMinutes + ' minutes'
    };
}

function verifyCaptcha(id, answer) {
    const data = captchaChallenges.get(id);
    
    if (!data) {
        return { success: false, error: 'CAPTCHA expired or invalid. Get a new one.' };
    }
    
    if (Date.now() > data.expiry) {
        captchaChallenges.delete(id);
        return { success: false, error: 'CAPTCHA expired. Get a new one.' };
    }
    
    if (data.answer !== answer.toString().trim()) {
        return { success: false, error: 'Wrong answer. Try again.' };
    }
    
    captchaChallenges.delete(id);
    return { success: true, message: 'CAPTCHA verified!' };
}

// Middleware to require CAPTCHA
function requireCaptcha(req, res, next) {
    const { captchaId, captchaAnswer } = req.body;
    
    if (!captchaId || !captchaAnswer) {
        return res.status(400).json({
            error: 'CAPTCHA required',
            captcha: generateCaptcha()
        });
    }
    
    const result = verifyCaptcha(captchaId, captchaAnswer);
    if (!result.success) {
        return res.status(400).json({
            error: result.error,
            captcha: generateCaptcha()
        });
    }
    
    next();
}

// ============================================
// 4. LOCATION VERIFICATION
// ============================================

// Rwanda market coordinates
const MARKET_LOCATIONS = {
    'Kimironko Market': { lat: -1.9403, lng: 30.1108, radiusKm: 0.5 },
    'Nyabugogo Market': { lat: -1.9339, lng: 30.0456, radiusKm: 0.5 },
    'Kicukiro Center': { lat: -1.9847, lng: 30.0989, radiusKm: 0.5 },
    'Remera Market': { lat: -1.9550, lng: 30.1050, radiusKm: 0.3 },
    'Nyamirambo Market': { lat: -1.9750, lng: 30.0400, radiusKm: 0.4 },
    'Musanze Market': { lat: -1.4997, lng: 29.6347, radiusKm: 1.0 },
    'Huye Market': { lat: -2.5967, lng: 29.7400, radiusKm: 0.8 },
    'Rubavu Market': { lat: -1.6800, lng: 29.2500, radiusKm: 0.8 },
    'Rwamagana Market': { lat: -1.9500, lng: 30.4300, radiusKm: 0.8 },
    'Muhanga Market': { lat: -2.0800, lng: 29.7500, radiusKm: 0.8 }
};

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function verifyLocation(userLat, userLng, marketName) {
    const market = MARKET_LOCATIONS[marketName];
    
    if (!market) {
        // Unknown market - allow but flag
        return {
            verified: false,
            status: 'unknown_market',
            message: 'Market location not in database',
            trustBonus: 0
        };
    }
    
    const distance = calculateDistance(userLat, userLng, market.lat, market.lng);
    
    if (distance <= market.radiusKm) {
        return {
            verified: true,
            status: 'at_market',
            message: `Location verified! You are at ${marketName}`,
            distance: Math.round(distance * 1000) + 'm',
            trustBonus: 10 // Bonus trust points for verified location
        };
    } else if (distance <= market.radiusKm * 3) {
        return {
            verified: false,
            status: 'nearby',
            message: `You are ${distance.toFixed(1)}km from ${marketName}`,
            distance: distance.toFixed(1) + 'km',
            trustBonus: 0
        };
    } else {
        return {
            verified: false,
            status: 'far_away',
            message: `You appear to be far from ${marketName} (${distance.toFixed(1)}km away)`,
            distance: distance.toFixed(1) + 'km',
            trustBonus: -5, // Penalty for submitting prices from far away
            warning: 'Submitting prices for markets you are not at may affect your trust score'
        };
    }
}

// Middleware to check location
function requireLocationVerification(req, res, next) {
    const { latitude, longitude, marketName } = req.body;
    
    if (!latitude || !longitude) {
        // Location not provided - allow but note it
        req.locationVerification = {
            verified: false,
            status: 'not_provided',
            message: 'Location not provided',
            trustBonus: 0
        };
        return next();
    }
    
    req.locationVerification = verifyLocation(latitude, longitude, marketName);
    next();
}

// ============================================
// 5. ACCOUNT LOCKOUT
// ============================================

const loginAttempts = new Map();
const lockedAccounts = new Map();
const LOCKOUT_CONFIG = {
    maxAttempts: 5,
    lockoutMinutes: 15,
    resetAfterMinutes: 30
};

function recordLoginAttempt(email, success) {
    const now = Date.now();
    
    // Check if account is locked
    const lockExpiry = lockedAccounts.get(email);
    if (lockExpiry && lockExpiry > now) {
        const minutesLeft = Math.ceil((lockExpiry - now) / 60000);
        return {
            locked: true,
            message: `Account locked. Try again in ${minutesLeft} minutes.`,
            minutesLeft
        };
    } else if (lockExpiry) {
        lockedAccounts.delete(email);
    }
    
    if (success) {
        // Clear attempts on successful login
        loginAttempts.delete(email);
        return { locked: false, message: 'Login successful' };
    }
    
    // Track failed attempt
    const attempts = loginAttempts.get(email) || { count: 0, firstAttempt: now };
    
    // Reset if window expired
    if (now - attempts.firstAttempt > LOCKOUT_CONFIG.resetAfterMinutes * 60 * 1000) {
        attempts.count = 0;
        attempts.firstAttempt = now;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(email, attempts);
    
    // Check if should lock
    if (attempts.count >= LOCKOUT_CONFIG.maxAttempts) {
        const lockExpiry = now + (LOCKOUT_CONFIG.lockoutMinutes * 60 * 1000);
        lockedAccounts.set(email, lockExpiry);
        loginAttempts.delete(email);
        
        return {
            locked: true,
            message: `Too many failed attempts. Account locked for ${LOCKOUT_CONFIG.lockoutMinutes} minutes.`,
            minutesLeft: LOCKOUT_CONFIG.lockoutMinutes
        };
    }
    
    return {
        locked: false,
        message: 'Invalid credentials',
        attemptsRemaining: LOCKOUT_CONFIG.maxAttempts - attempts.count,
        warning: attempts.count >= 3 ? 
            `Warning: ${LOCKOUT_CONFIG.maxAttempts - attempts.count} attempts remaining before lockout` : 
            undefined
    };
}

function isAccountLocked(email) {
    const lockExpiry = lockedAccounts.get(email);
    if (!lockExpiry) return { locked: false };
    
    if (lockExpiry > Date.now()) {
        const minutesLeft = Math.ceil((lockExpiry - Date.now()) / 60000);
        return {
            locked: true,
            message: `Account locked. Try again in ${minutesLeft} minutes.`,
            minutesLeft
        };
    }
    
    lockedAccounts.delete(email);
    return { locked: false };
}

function unlockAccount(email) {
    lockedAccounts.delete(email);
    loginAttempts.delete(email);
    return { success: true, message: 'Account unlocked' };
}

// ============================================
// EXPORTS
// ============================================

export default {
    // 1. IP Rate Limiting
    ipRateLimiter,
    strictRateLimiter,
    clearBlockedIPs,
    unblockIP,
    
    // 2. Phone Verification
    sendPhoneVerification,
    verifyPhoneCode,
    
    // 3. CAPTCHA
    generateCaptcha,
    verifyCaptcha,
    requireCaptcha,
    
    // 4. Location Verification
    verifyLocation,
    requireLocationVerification,
    MARKET_LOCATIONS,
    calculateDistance,
    
    // 5. Account Lockout
    recordLoginAttempt,
    isAccountLocked,
    unlockAccount
};
