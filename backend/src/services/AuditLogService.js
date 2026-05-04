/**
 * Audit Log Service - Tracks all important actions for security and compliance
 */

// In-memory audit log (use database in production)
const auditLog = [];
const MAX_LOG_SIZE = 10000;

// Audit action types
export const AUDIT_ACTIONS = {
    // Authentication
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
    LOGOUT: 'auth.logout',
    PASSWORD_CHANGE: 'auth.password.change',
    PASSWORD_RESET: 'auth.password.reset',
    SIGNUP: 'auth.signup',
    
    // User management
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_ROLE_CHANGE: 'user.role.change',
    ACCOUNT_LOCK: 'user.account.lock',
    ACCOUNT_UNLOCK: 'user.account.unlock',
    
    // Price management
    PRICE_SUBMIT: 'price.submit',
    PRICE_APPROVE: 'price.approve',
    PRICE_REJECT: 'price.reject',
    PRICE_UPDATE: 'price.update',
    PRICE_DELETE: 'price.delete',
    BULK_IMPORT: 'price.bulk.import',
    
    // Admin actions
    ADMIN_ACCESS: 'admin.access',
    ADMIN_CONFIG_CHANGE: 'admin.config.change',
    ADMIN_DATA_EXPORT: 'admin.data.export',
    ADMIN_USER_VIEW: 'admin.user.view',
    
    // Security
    RATE_LIMIT_EXCEEDED: 'security.rate_limit',
    SUSPICIOUS_ACTIVITY: 'security.suspicious',
    IP_BLOCKED: 'security.ip.blocked',
    CAPTCHA_FAILED: 'security.captcha.failed',
    
    // System
    SERVER_START: 'system.server.start',
    SERVER_STOP: 'system.server.stop',
    DATABASE_ERROR: 'system.database.error',
    ERROR: 'system.error',
    API_REQUEST: 'api.request',
    API_ERROR: 'api.error'
};

/**
 * Generate unique audit ID
 */
function generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log an audit event
 */
export function log(action, details = {}) {
    const entry = {
        id: generateAuditId(),
        timestamp: new Date().toISOString(),
        action,
        userId: details.userId || null,
        userEmail: details.userEmail || null,
        userRole: details.userRole || null,
        ip: details.ip || null,
        userAgent: details.userAgent || null,
        resource: details.resource || null,
        resourceId: details.resourceId || null,
        status: details.status || 'success',
        severity: details.severity || 'info',
        metadata: details.metadata || {},
        message: details.message || null
    };
    
    // Add to log
    auditLog.push(entry);
    
    // Maintain max size
    if (auditLog.length > MAX_LOG_SIZE) {
        auditLog.shift();
    }
    
    // Console log for important events
    if (isImportantEvent(action)) {
        console.log(`📋 AUDIT [${action}]: ${entry.message || JSON.stringify(entry.metadata)}`);
    }
    
    return entry;
}

/**
 * Check if event is important enough to console log
 */
function isImportantEvent(action) {
    const importantActions = [
        AUDIT_ACTIONS.LOGIN_FAILED,
        AUDIT_ACTIONS.PASSWORD_RESET,
        AUDIT_ACTIONS.USER_DELETE,
        AUDIT_ACTIONS.USER_ROLE_CHANGE,
        AUDIT_ACTIONS.ADMIN_ACCESS,
        AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
        AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        AUDIT_ACTIONS.IP_BLOCKED,
        AUDIT_ACTIONS.DATABASE_ERROR,
        AUDIT_ACTIONS.API_ERROR
    ];
    return importantActions.includes(action);
}

/**
 * Log authentication event
 */
export function logAuth(action, email, success, details = {}) {
    return log(success ? AUDIT_ACTIONS.LOGIN_SUCCESS : AUDIT_ACTIONS.LOGIN_FAILED, {
        userEmail: email,
        status: success ? 'success' : 'failed',
        ...details
    });
}

/**
 * Log admin action
 */
export function logAdminAction(adminId, adminEmail, action, targetResource, details = {}) {
    return log(action, {
        userId: adminId,
        userEmail: adminEmail,
        userRole: 'admin',
        resource: targetResource,
        ...details
    });
}

/**
 * Log price action
 */
export function logPriceAction(action, userId, priceId, details = {}) {
    return log(action, {
        userId,
        resourceId: priceId,
        resource: 'price',
        ...details
    });
}

/**
 * Log security event
 */
export function logSecurityEvent(eventType, ip, details = {}) {
    return log(eventType, {
        ip,
        status: 'warning',
        severity: 'warning',
        ...details
    });
}

/**
 * Get audit logs with filtering
 */
export function getLogs(options = {}) {
    const {
        startDate = null,
        endDate = null,
        action = null,
        userId = null,
        status = null,
        severity = null,
        limit = 100,
        offset = 0
    } = options;
    
    let filtered = [...auditLog];
    
    // Apply filters
    if (startDate) {
        filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(startDate));
    }
    if (endDate) {
        filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(endDate));
    }
    if (action) {
        filtered = filtered.filter(e => e.action === action || e.action.startsWith(action));
    }
    if (userId) {
        filtered = filtered.filter(e => e.userId === userId || e.userId === parseInt(userId));
    }
    if (status) {
        filtered = filtered.filter(e => e.status === status);
    }
    if (severity) {
        filtered = filtered.filter(e => e.severity === severity);
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    
    return {
        logs: paginated,
        total,
        offset,
        limit,
        hasMore: offset + limit < total
    };
}

/**
 * Get audit statistics
 */
export function getStats(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const recent = auditLog.filter(e => new Date(e.timestamp) >= cutoff);
    
    // Count by action type
    const byAction = {};
    recent.forEach(e => {
        const actionType = e.action.split('.')[0];
        byAction[actionType] = (byAction[actionType] || 0) + 1;
    });
    
    // Count by status
    const byStatus = { success: 0, error: 0, warning: 0, failed: 0 };
    recent.forEach(e => {
        byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    });
    
    // Count by severity
    const bySeverity = { info: 0, warning: 0, error: 0, critical: 0 };
    recent.forEach(e => {
        bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });
    
    // Count by day
    const byDay = {};
    recent.forEach(e => {
        const day = e.timestamp.split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
    });
    
    // Security events
    const securityEvents = recent.filter(e => e.action.startsWith('security.')).length;
    const errorEvents = recent.filter(e => e.severity === 'error' || e.severity === 'critical').length;
    
    return {
        period: `Last ${days} days`,
        totalEvents: recent.length,
        byAction,
        byStatus,
        bySeverity,
        byDay,
        securityEvents,
        errorEvents,
        failedLogins: recent.filter(e => e.action === AUDIT_ACTIONS.LOGIN_FAILED).length
    };
}

/**
 * Search audit logs
 */
export function search(query) {
    const q = query.toLowerCase();
    return auditLog.filter(e => 
        e.action.toLowerCase().includes(q) ||
        e.userEmail?.toLowerCase().includes(q) ||
        e.message?.toLowerCase().includes(q) ||
        JSON.stringify(e.metadata).toLowerCase().includes(q)
    ).slice(0, 100);
}

/**
 * Export audit logs
 */
export function exportLogs(format = 'json', options = {}) {
    const logs = getLogs({ ...options, limit: 10000 }).logs;
    
    if (format === 'csv') {
        const headers = ['Timestamp', 'Action', 'User', 'Status', 'Severity', 'IP', 'Message'];
        const rows = logs.map(l => [
            l.timestamp,
            l.action,
            l.userEmail || l.userId || '-',
            l.status,
            l.severity,
            l.ip || '-',
            l.message || '-'
        ]);
        return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
}

/**
 * Clear old logs
 */
export function clearOldLogs(daysToKeep = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    
    const originalLength = auditLog.length;
    const filtered = auditLog.filter(e => new Date(e.timestamp) >= cutoff);
    
    auditLog.length = 0;
    auditLog.push(...filtered);
    
    return {
        removed: originalLength - auditLog.length,
        remaining: auditLog.length
    };
}

// Default export for backward compatibility
const AuditLogService = {
    AUDIT_ACTIONS,
    log,
    logAuth,
    logAdminAction,
    logPriceAction,
    logSecurityEvent,
    getLogs,
    getStats,
    search,
    exportLogs,
    clearOldLogs
};

export default AuditLogService;