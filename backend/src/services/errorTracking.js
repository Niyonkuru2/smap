/**
 * Error Tracking Module
 * Centralized error handling and tracking (Sentry-like)
 */

// Error storage (in production, use Sentry or similar service)
const errors = [];
const MAX_ERRORS = 1000;

// Error severity levels
const SEVERITY = {
    DEBUG: 'debug',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

// Error configuration
let config = {
    enabled: true,
    captureUnhandled: true,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',
    sendAlerts: false,
    alertThreshold: SEVERITY.ERROR
};

/**
 * Configure error tracking
 */
function configure(options) {
    config = { ...config, ...options };
    return config;
}

/**
 * Capture an error
 */
function captureError(error, context = {}) {
    if (!config.enabled) return null;
    
    const errorData = {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        environment: config.environment,
        release: config.release,
        
        // Error details
        message: error.message || String(error),
        name: error.name || 'Error',
        stack: error.stack || null,
        code: error.code || null,
        
        // Context
        severity: context.severity || SEVERITY.ERROR,
        tags: context.tags || {},
        extra: context.extra || {},
        
        // User context
        user: context.user || null,
        
        // Request context
        request: context.request ? {
            method: context.request.method,
            url: context.request.originalUrl || context.request.url,
            headers: sanitizeHeaders(context.request.headers),
            query: context.request.query,
            ip: context.request.ip
        } : null,
        
        // Fingerprint for grouping
        fingerprint: generateFingerprint(error, context)
    };
    
    // Store error
    errors.push(errorData);
    
    // Maintain max size
    if (errors.length > MAX_ERRORS) {
        errors.shift();
    }
    
    // Log to console
    console.error(`[${errorData.severity.toUpperCase()}] ${errorData.message}`);
    if (errorData.stack && config.environment === 'development') {
        console.error(errorData.stack);
    }
    
    // Send alert if critical
    if (shouldAlert(errorData.severity)) {
        sendAlert(errorData);
    }
    
    return errorData.id;
}

/**
 * Capture a message (non-error)
 */
function captureMessage(message, context = {}) {
    const severity = context.severity || SEVERITY.INFO;
    
    const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        environment: config.environment,
        release: config.release,
        message,
        severity,
        tags: context.tags || {},
        extra: context.extra || {},
        user: context.user || null,
        fingerprint: `message:${message.slice(0, 100)}`
    };
    
    errors.push(messageData);
    
    if (errors.length > MAX_ERRORS) {
        errors.shift();
    }
    
    return messageData.id;
}

/**
 * Generate error fingerprint for grouping
 */
function generateFingerprint(error, context) {
    const parts = [
        error.name || 'Error',
        error.message?.slice(0, 50) || 'Unknown',
        context.request?.url || 'no-url'
    ];
    return parts.join(':').replace(/[^a-zA-Z0-9:-]/g, '');
}

/**
 * Sanitize headers (remove sensitive data)
 */
function sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(h => {
        if (sanitized[h]) {
            sanitized[h] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

/**
 * Check if alert should be sent
 */
function shouldAlert(severity) {
    if (!config.sendAlerts) return false;
    
    const severityOrder = [SEVERITY.DEBUG, SEVERITY.INFO, SEVERITY.WARNING, SEVERITY.ERROR, SEVERITY.CRITICAL];
    const currentIndex = severityOrder.indexOf(severity);
    const thresholdIndex = severityOrder.indexOf(config.alertThreshold);
    
    return currentIndex >= thresholdIndex;
}

/**
 * Send alert (placeholder - integrate with email/Slack/PagerDuty)
 */
function sendAlert(errorData) {
    console.log(`🚨 ALERT: ${errorData.severity.toUpperCase()} - ${errorData.message}`);
    // In production, send to Slack, email, etc.
}

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
    // Capture the error
    const errorId = captureError(err, {
        severity: err.statusCode >= 500 ? SEVERITY.ERROR : SEVERITY.WARNING,
        request: req,
        user: req.user ? { id: req.user.id, email: req.user.email } : null,
        extra: {
            body: req.body,
            params: req.params
        }
    });
    
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Send response
    res.status(statusCode).json({
        error: config.environment === 'development' ? err.message : 'An error occurred',
        errorId,
        ...(config.environment === 'development' && { stack: err.stack })
    });
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Setup unhandled error catching
 */
function setupUnhandledErrorCatching() {
    if (!config.captureUnhandled) return;
    
    process.on('uncaughtException', (error) => {
        captureError(error, {
            severity: SEVERITY.CRITICAL,
            tags: { type: 'uncaughtException' }
        });
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        captureError(reason instanceof Error ? reason : new Error(String(reason)), {
            severity: SEVERITY.ERROR,
            tags: { type: 'unhandledRejection' },
            extra: { promise: String(promise) }
        });
        console.error('Unhandled Rejection:', reason);
    });
    
    console.log('✅ Unhandled error catching enabled');
}

/**
 * Get recent errors
 */
function getErrors(options = {}) {
    const {
        severity = null,
        limit = 50,
        offset = 0,
        startDate = null,
        endDate = null,
        fingerprint = null
    } = options;
    
    let filtered = [...errors];
    
    if (severity) {
        filtered = filtered.filter(e => e.severity === severity);
    }
    
    if (startDate) {
        filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
        filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(endDate));
    }
    
    if (fingerprint) {
        filtered = filtered.filter(e => e.fingerprint === fingerprint);
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
        errors: filtered.slice(offset, offset + limit),
        total: filtered.length,
        hasMore: offset + limit < filtered.length
    };
}

/**
 * Get error statistics
 */
function getErrorStats(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const recent = errors.filter(e => new Date(e.timestamp) >= cutoff);
    
    // Count by severity
    const bySeverity = {};
    Object.values(SEVERITY).forEach(s => bySeverity[s] = 0);
    recent.forEach(e => bySeverity[e.severity]++);
    
    // Count by day
    const byDay = {};
    recent.forEach(e => {
        const day = e.timestamp.split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
    });
    
    // Top errors by fingerprint
    const byFingerprint = {};
    recent.forEach(e => {
        byFingerprint[e.fingerprint] = byFingerprint[e.fingerprint] || { count: 0, message: e.message };
        byFingerprint[e.fingerprint].count++;
    });
    
    const topErrors = Object.entries(byFingerprint)
        .map(([fp, data]) => ({ fingerprint: fp, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    return {
        period: `Last ${days} days`,
        total: recent.length,
        bySeverity,
        byDay,
        topErrors,
        criticalCount: bySeverity[SEVERITY.CRITICAL] || 0,
        errorCount: bySeverity[SEVERITY.ERROR] || 0
    };
}

/**
 * Get a specific error by ID
 */
function getError(errorId) {
    return errors.find(e => e.id === errorId) || null;
}

/**
 * Clear errors (for testing)
 */
function clearErrors() {
    const count = errors.length;
    errors.length = 0;
    return { cleared: count };
}

/**
 * Create a custom error class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

export {
    SEVERITY,
    configure,
    captureError,
    captureMessage,
    errorHandler,
    asyncHandler,
    setupUnhandledErrorCatching,
    getErrors,
    getErrorStats,
    getError,
    clearErrors,
    AppError
};
