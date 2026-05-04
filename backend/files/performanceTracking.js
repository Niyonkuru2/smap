/**
 * Performance Tracking Middleware
 * Monitors API response times and identifies bottlenecks
 */

export class PerformanceTracker {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalTime: 0,
      slowRequests: [],
      endpointMetrics: {},
    };
    this.slowThreshold = 500; // 500ms
  }

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
        const endpoint = `${req.method} ${req.path}`;
        if (!this.metrics.endpointMetrics[endpoint]) {
          this.metrics.endpointMetrics[endpoint] = {
            count: 0,
            totalTime: 0,
            avgTime: 0,
            maxTime: 0,
            minTime: Infinity,
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
          this.metrics.slowRequests.push({
            endpoint,
            duration: durationMs.toFixed(2),
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
          });
          
          // Keep only last 100 slow requests
          if (this.metrics.slowRequests.length > 100) {
            this.metrics.slowRequests.shift();
          }
          
          console.warn(`⚠️ SLOW REQUEST: ${endpoint} took ${durationMs.toFixed(2)}ms`);
        }

        // Log response time for fast requests
        if (process.env.VERBOSE_LOGGING === 'true' && durationMs < 100) {
          console.log(`✓ ${endpoint} - ${durationMs.toFixed(2)}ms`);
        }

        // Add performance header
        res.set('X-Response-Time', `${durationMs.toFixed(2)}ms`);
      };

      res.send = function (data) {
        trackResponse(data);
        return originalSend(data);
      };

      res.json = function (data) {
        trackResponse(data);
        return originalJson(data);
      };

      next();
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgResponseTime: (this.metrics.totalTime / this.metrics.totalRequests).toFixed(2),
      totalRequests: this.metrics.totalRequests,
      slowRequestCount: this.metrics.slowRequests.length,
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      totalTime: 0,
      slowRequests: [],
      endpointMetrics: {},
    };
  }

  getEndpointMetrics() {
    const sorted = Object.entries(this.metrics.endpointMetrics)
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .slice(0, 20); // Top 20 slowest endpoints
    
    return Object.fromEntries(sorted);
  }
}

export const performanceTracker = new PerformanceTracker();

/**
 * Optimized database query wrapper for performance tracking
 */
export async function trackDatabaseQuery(pool, query, params) {
  const startTime = process.hrtime.bigint();
  try {
    const result = await pool.query(query, params);
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    
    if (durationMs > 100) {
      console.warn(`⚠️ SLOW DB QUERY (${durationMs.toFixed(2)}ms): ${query.substring(0, 100)}`);
    }
    
    return result;
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    console.error(`❌ DB QUERY ERROR (${durationMs.toFixed(2)}ms): ${error.message}`);
    throw error;
  }
}

/**
 * Connection pool monitoring
 */
export function monitorConnectionPool(pool, interval = 30000) {
  setInterval(() => {
    const poolState = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
    
    if (poolState.waitingCount > 0) {
      console.warn(`⚠️ DB CONNECTION POOL PRESSURE: ${poolState.waitingCount} queries waiting`);
    }
    
    if (process.env.VERBOSE_LOGGING === 'true') {
      console.log(`📊 DB Pool Status:`, poolState);
    }
  }, interval);
}
