import helmet from "helmet";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";

// ============================================
// In-memory blocked IPs (use Redis in production)
// ============================================
const blockedIPs = new Map();

// ============================================
// SAFE IP HELPER (FIX FOR IPV6 + PROXIES)
// ============================================
const getClientIP = (req) => {
    return (
        req.ip ||
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket?.remoteAddress ||
        "unknown"
    );
};

// ============================================
// GENERAL RATE LIMITER (FIXED IPV6 ISSUE)
// ============================================
export const rateLimitMiddleware = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,

    message: {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: 60,
    },

    standardHeaders: true,
    legacyHeaders: false,

    // ✅ FIXED: proper IPv6-safe generator
    keyGenerator: (req) => ipKeyGenerator(req),

    skip: (req) => {
        return req.path === "/health" || req.path === "/health/timing";
    },
});

// ============================================
// STRICT RATE LIMITER
// ============================================
export const strictRateLimiter = (max = 10, windowMs = 60000) =>
    rateLimit({
        windowMs,
        max,
        message: {
            error: "Rate limit exceeded",
            message: `Try again after ${Math.ceil(windowMs / 1000)} seconds`,
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => ipKeyGenerator(req),
    });

// ============================================
// LOGIN RATE LIMITER
// ============================================
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: "Too many login attempts",
        message: "Try again after 15 minutes",
        retryAfter: 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req),
    skipSuccessfulRequests: true,
});

// ============================================
// SIGNUP RATE LIMITER
// ============================================
export const signupRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        error: "Too many signup attempts",
        message: "Try again after 1 hour",
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIP(req),
});

// ============================================
// SECURITY HEADERS (HELMET)
// ============================================
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

// ============================================
// BASIC SECURITY MIDDLEWARES
// ============================================
export const xssProtection = xss();
export const parameterPollution = hpp();
export const compressionMiddleware = compression();

// ============================================
// IP BLOCKING SYSTEM
// ============================================
export const blockIP = (ip, duration = 60 * 60 * 1000) => {
    blockedIPs.set(ip, {
        expiresAt: Date.now() + duration,
    });

    setTimeout(() => {
        blockedIPs.delete(ip);
    }, duration);
};

export const isIPBlocked = (ip) => {
    const data = blockedIPs.get(ip);
    if (!data) return false;

    if (Date.now() > data.expiresAt) {
        blockedIPs.delete(ip);
        return false;
    }

    return true;
};

export const ipBlocker = (req, res, next) => {
    const ip = getClientIP(req);

    if (isIPBlocked(ip)) {
        return res.status(403).json({
            error: "Access denied",
            message: "Your IP is temporarily blocked",
        });
    }

    next();
};

// ============================================
// SECURITY HEADERS (EXTRA)
// ============================================
export const corsSecurity = (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()"
    );
    next();
};

// ============================================
// REQUEST SIZE LIMIT
// ============================================
export const requestSizeLimiter = (limit = "10kb") => (req, res, next) => {
    const size = parseInt(req.headers["content-length"] || "0");
    const max = typeof limit === "string" ? parseInt(limit) * 1024 : limit;

    if (size > max) {
        return res.status(413).json({
            error: "Request too large",
            message: `Max allowed size is ${limit}`,
        });
    }

    next();
};

// ============================================
// SQL INJECTION PROTECTION (BASIC)
// ============================================
export const sqlInjectionPrevention = (req, res, next) => {
    const patterns = [
        /(\bSELECT\b.*\bFROM\b)/i,
        /(\bDROP\b.*\bTABLE\b)/i,
        /(\bUNION\b.*\bSELECT\b)/i,
        /(--)/,
        /(;)/,
    ];

    const check = (val) => {
        if (typeof val !== "string") return false;
        return patterns.some((p) => p.test(val));
    };

    const scan = (obj) => {
        if (!obj) return false;
        return Object.values(obj).some(
            (v) =>
                check(v) ||
                (typeof v === "object" && scan(v))
        );
    };

    if (scan(req.body) || scan(req.query) || scan(req.params)) {
        console.warn("Blocked suspicious request:", {
            ip: getClientIP(req),
            path: req.path,
        });

        blockIP(getClientIP(req), 60 * 60 * 1000);

        return res.status(403).json({
            error: "Blocked request",
            message: "Security violation detected",
        });
    }

    next();
};

// ============================================
// NO CACHE
// ============================================
export const noCache = (req, res, next) => {
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
};

// ============================================
// TRUST PROXY (FOR PRODUCTION)
// ============================================
export const trustProxy = (app) => {
    if (process.env.NODE_ENV === "production") {
        app.set("trust proxy", 1);
        console.log("Trust proxy enabled");
    }
};

// ============================================
// COMBINE ALL SECURITY MIDDLEWARE
// ============================================
export const securityMiddleware = [
    securityHeaders,
    xssProtection,
    parameterPollution,
    compressionMiddleware,
    corsSecurity,
    ipBlocker,
    sqlInjectionPrevention,
    requestSizeLimiter("10kb"),
    rateLimitMiddleware,
];

// ============================================
// EXPORT DEFAULT
// ============================================
export default {
    securityHeaders,
    xssProtection,
    parameterPollution,
    compressionMiddleware,
    corsSecurity,
    ipBlocker,
    sqlInjectionPrevention,
    requestSizeLimiter,
    noCache,
    trustProxy,
    rateLimitMiddleware,
    strictRateLimiter,
    loginRateLimiter,
    signupRateLimiter,
    blockIP,
    isIPBlocked,
};