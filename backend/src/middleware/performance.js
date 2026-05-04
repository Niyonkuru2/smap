/**
 * Performance Tracking Middleware
 * Monitors API response times and identifies bottlenecks
 */

class PerformanceTracker {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            totalTime: 0,
            slowRequests: [],
            endpointMetrics: {},
            errors: [],
        };
        this.slowThreshold = 500; // 500ms
    }

    /**
     * Express middleware for tracking response times
     */
    middleware() {
        return (req, res, next) => {
            const startTime = process.hrtime.bigint();
            const originalSend = res.send.bind(res);
            const originalJson = res.json.bind(res);

            const trackResponse = (data) => {
                const endTime = process.hrtime.bigint();
                const durationMs = Number(endTime - startTime) / 1_000_000;

                // Update metrics
                this.metrics.totalRequests++;
                this.metrics.totalTime += durationMs;

                // Track by endpoint
                const endpoint = `${req.method} ${req.route?.path || req.path}`;
                if (!this.metrics.endpointMetrics[endpoint]) {
                    this.metrics.endpointMetrics[endpoint] = {
                        count: 0,
                        totalTime: 0,
                        avgTime: 0,
                        maxTime: 0,
                        minTime: Infinity,
                        errors: 0,
                    };
                }
                const endpointMetric = this.metrics.endpointMetrics[endpoint];
                endpointMetric.count++;
                endpointMetric.totalTime += durationMs;
                endpointMetric.avgTime = endpointMetric.totalTime / endpointMetric.count;
                endpointMetric.maxTime = Math.max(endpointMetric.maxTime, durationMs);
                endpointMetric.minTime = Math.min(endpointMetric.minTime, durationMs);

                // Track slow requests
                if (durationMs > this.slowThreshold) {
                    this.metrics.slowRequests.unshift({
                        endpoint,
                        method: req.method,
                        path: req.path,
                        duration: durationMs.toFixed(2),
                        timestamp: new Date().toISOString(),
                        statusCode: res.statusCode,
                        userId: req.user?.id,
                    });
                    
                    // Keep only last 100 slow requests
                    if (this.metrics.slowRequests.length > 100) {
                        this.metrics.slowRequests.pop();
                    }
                    
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`⚠️ SLOW REQUEST: ${endpoint} took ${durationMs.toFixed(2)}ms`);
                    }
                }

                // Add performance header
                res.set('X-Response-Time', `${durationMs.toFixed(2)}ms`);
            };

            res.send = function(data) {
                trackResponse(data);
                return originalSend(data);
            };

            res.json = function(data) {
                trackResponse(data);
                return originalJson(data);
            };

            next();
        };
    }

    /**
     * Track an error
     */
    trackError(error, req = null) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            endpoint: req ? `${req.method} ${req.path}` : 'unknown',
            userId: req?.user?.id,
            ip: req?.ip,
        };
        
        this.metrics.errors.unshift(errorData);
        
        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.pop();
        }
        
        // Update endpoint error count
        if (req) {
            const endpoint = `${req.method} ${req.route?.path || req.path}`;
            if (this.metrics.endpointMetrics[endpoint]) {
                this.metrics.endpointMetrics[endpoint].errors++;
            }
        }
        
        console.error(`❌ Error tracked: ${error.message}`);
    }

    /**
     * Get all performance metrics
     */
    getMetrics() {
        const avgResponseTime = this.metrics.totalRequests > 0 
            ? (this.metrics.totalTime / this.metrics.totalRequests).toFixed(2)
            : 0;
        
        return {
            summary: {
                totalRequests: this.metrics.totalRequests,
                avgResponseTime: `${avgResponseTime}ms`,
                slowRequestCount: this.metrics.slowRequests.length,
                errorCount: this.metrics.errors.length,
                uptime: process.uptime(),
            },
            endpoints: this.getEndpointMetrics(),
            slowRequests: this.metrics.slowRequests.slice(0, 20),
            recentErrors: this.metrics.errors.slice(0, 10),
        };
    }

    /**
     * Get endpoint metrics sorted by average response time
     */
    getEndpointMetrics() {
        const sorted = Object.entries(this.metrics.endpointMetrics)
            .sort((a, b) => b[1].avgTime - a[1].avgTime)
            .slice(0, 20);
        
        const result = {};
        for (const [endpoint, data] of sorted) {
            result[endpoint] = {
                count: data.count,
                avgTime: data.avgTime.toFixed(2),
                minTime: data.minTime === Infinity ? 0 : data.minTime.toFixed(2),
                maxTime: data.maxTime.toFixed(2),
                errorRate: data.count > 0 ? ((data.errors / data.count) * 100).toFixed(2) + '%' : '0%',
            };
        }
        
        return result;
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics = {
            totalRequests: 0,
            totalTime: 0,
            slowRequests: [],
            endpointMetrics: {},
            errors: [],
        };
        console.log('📊 Performance metrics reset');
    }

    /**
     * Track database query performance
     */
    trackDbQuery(query, durationMs) {
        if (durationMs > 200) {
            console.warn(`⚠️ SLOW DB QUERY (${durationMs.toFixed(2)}ms): ${query.substring(0, 100)}...`);
        }
    }
}

// Create singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * Track error function for use in error handlers
 */
export const trackError = (error, req) => {
    performanceTracker.trackError(error, req);
};

/**
 * Performance tracking middleware function
 */
export const performanceMiddleware = performanceTracker.middleware();

/**
 * Get performance metrics endpoint
 */
export const getPerformanceMetrics = () => performanceTracker.getMetrics();

/**
 * Reset performance metrics endpoint
 */
export const resetPerformanceMetrics = () => performanceTracker.reset();

/**
 * Track database query performance
 */
export const trackDatabaseQuery = (query, params, startTime) => {
    const duration = Date.now() - startTime;
    performanceTracker.trackDbQuery(query, duration);
    return duration;
};

/**
 * Monitor connection pool
 */
export const monitorConnectionPool = (pool, interval = 30000) => {
    setInterval(() => {
        if (pool && pool.totalCount !== undefined) {
            const stats = {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount,
                active: pool.totalCount - pool.idleCount,
            };
            
            if (stats.waiting > 10) {
                console.warn('⚠️ High connection pool wait:', stats);
            }
        }
    }, interval);
    
    return { monitoring: true, intervalMs: interval };
};

/**
 * Track external API call performance
 */
export const trackExternalCall = async (name, fn) => {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;
        
        if (duration > 1000) {
            console.warn(`🌐 Slow external call (${duration}ms): ${name}`);
        }
        
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ External call failed (${duration}ms): ${name}`, error.message);
        throw error;
    }
};

// Default export for backward compatibility
export default {
    performanceTracker,
    performanceMiddleware,
    getPerformanceMetrics,
    resetPerformanceMetrics,
    trackDatabaseQuery,
    monitorConnectionPool,
    trackExternalCall,
    trackError,
};