import { log, AUDIT_ACTIONS, logAdminAction } from '../services/AuditLogService.js';

// Skip logging for these paths
const SKIP_PATHS = ['/health', '/health/timing', '/diagnostic', '/'];

// Request ID counter
let requestIdCounter = 0;

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
    return `${Date.now()}-${process.pid}-${++requestIdCounter}`;
};

/**
 * Audit logging middleware
 * Logs all requests and responses for non-sensitive endpoints
 */
export const auditMiddleware = (options = {}) => {
    const { logAllRequests = false, skipPaths = SKIP_PATHS } = options;
    
    return async (req, res, next) => {
        // Skip logging for certain paths
        if (skipPaths.includes(req.path)) {
            return next();
        }
        
        // Generate request ID
        const requestId = generateRequestId();
        req.requestId = requestId;
        res.setHeader('X-Request-ID', requestId);
        
        // Capture request start time
        const startTime = Date.now();
        
        // Store original end function
        const originalEnd = res.end;
        let responseBody = '';
        
        // Override end to capture response
        res.end = function(chunk, encoding) {
            responseBody = chunk ? chunk.toString() : '';
            originalEnd.call(this, chunk, encoding);
        };
        
        // Log after response is sent
        res.on('finish', async () => {
            const responseTime = Date.now() - startTime;
            
            // Don't log if not needed
            if (!logAllRequests && res.statusCode < 400) {
                return;
            }
            
            const auditData = {
                requestId,
                timestamp: new Date().toISOString(),
                method: req.method,
                path: req.path,
                query: req.query,
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('user-agent'),
                statusCode: res.statusCode,
                responseTime: `${responseTime}ms`,
                userId: req.user?.id,
                userEmail: req.user?.email,
                userRole: req.user?.role
            };
            
            // Add request body for errors (excluding sensitive data)
            if (res.statusCode >= 400 && req.body) {
                const { password, ...safeBody } = req.body;
                auditData.body = safeBody;
            }
            
            // Log to file/database asynchronously
            setImmediate(async () => {
                try {
                    if (res.statusCode >= 400) {
                        await log({
                            action: AUDIT_ACTIONS.API_ERROR,
                            userId: req.user?.id,
                            userEmail: req.user?.email,
                            metadata: auditData,
                            severity: res.statusCode >= 500 ? 'error' : 'warning'
                        });
                    } else if (logAllRequests) {
                        await log({
                            action: AUDIT_ACTIONS.API_REQUEST,
                            userId: req.user?.id,
                            userEmail: req.user?.email,
                            metadata: auditData,
                            severity: 'info'
                        });
                    }
                } catch (error) {
                    console.error('Failed to log audit:', error.message);
                }
            });
        });
        
        next();
    };
};

/**
 * Admin action audit middleware
 * Logs admin actions specifically
 */
export const adminAudit = (action, getDetails = null) => {
    return async (req, res, next) => {
        if (req.user?.role !== 'admin') {
            return next();
        }
        
        const originalJson = res.json;
        
        res.json = function(data) {
            // Log after response
            setImmediate(async () => {
                const details = getDetails ? await getDetails(req, data) : {
                    params: req.params,
                    body: req.body,
                    query: req.query
                };
                
                await logAdminAction(
                    req.user.id,
                    req.user.email,
                    action,
                    req.path,
                    details
                );
            });
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

/**
 * Login audit middleware
 */
export const loginAudit = async (req, res, isSuccess, user = null) => {
    const auditData = {
        email: req.body?.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
        success: isSuccess
    };
    
    await log({
        action: isSuccess ? AUDIT_ACTIONS.LOGIN_SUCCESS : AUDIT_ACTIONS.LOGIN_FAILED,
        userId: user?.id,
        userEmail: user?.email,
        metadata: auditData,
        severity: isSuccess ? 'info' : 'warning'
    });
};

/**
 * Price submission audit
 */
export const priceSubmissionAudit = async (userId, userEmail, priceData, submissionId) => {
    await log({
        action: AUDIT_ACTIONS.PRICE_SUBMIT,
        userId,
        userEmail,
        metadata: {
            submissionId,
            productId: priceData.product_id,
            marketId: priceData.market_id,
            price: priceData.price,
            timestamp: new Date().toISOString()
        },
        severity: 'info'
    });
};

/**
 * Price approval audit
 */
export const priceApprovalAudit = async (adminId, adminEmail, priceId, action, reason = null) => {
    await log({
        action: action === 'approve' ? AUDIT_ACTIONS.PRICE_APPROVE : AUDIT_ACTIONS.PRICE_REJECT,
        userId: adminId,
        userEmail: adminEmail,
        metadata: {
            priceId,
            reason,
            timestamp: new Date().toISOString()
        },
        severity: 'info'
    });
};

/**
 * User action audit (for sensitive user operations)
 */
export const userActionAudit = (action) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        
        res.json = async function(data) {
            // Log after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                await log({
                    action,
                    userId: req.user?.id,
                    userEmail: req.user?.email,
                    metadata: {
                        targetUserId: req.params.id || req.body.userId,
                        action: req.method,
                        path: req.path,
                        data: req.body
                    },
                    severity: 'info'
                });
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

export default {
    auditMiddleware,
    adminAudit,
    loginAudit,
    priceSubmissionAudit,
    priceApprovalAudit,
    userActionAudit
};