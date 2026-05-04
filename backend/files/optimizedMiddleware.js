/**
 * Optimized API Middleware Suite
 * Integrates compression, caching, pagination, and response optimization
 */

import compression from 'compression';
import { paginate, fieldSelector, logCompressionStats } from '../middleware/apiOptimizer.js';

/**
 * Initialize all optimization middleware
 * @param app Express application instance
 */
export function initializeOptimizedMiddleware(app) {
  console.log('🚀 Initializing optimization middleware...');

  // 1. HTTP Compression - highest priority for payload size reduction
  app.use(compression({
    level: 6, // Balance between compression ratio and CPU usage
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Skip compression for certain endpoints if needed
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));
  console.log('✓ Compression middleware enabled');

  // 2. Response logging for monitoring
  app.use(logCompressionStats);
  console.log('✓ Compression stats logging enabled');

  // 3. Field selector for partial responses
  app.use(fieldSelector);
  console.log('✓ Field selector enabled (use ?fields=id,name,price in queries)');

  // 4. Pagination middleware
  app.use(paginate({
    defaultLimit: 20,
    maxLimit: 100,
  }));
  console.log('✓ Pagination middleware enabled');

  // 5. Cache control headers for static assets
  app.use((req, res, next) => {
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/i)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path.match(/\/(api|products|markets|prices)\/.*\/$/i)) {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour for API responses
    }
    next();
  });
  console.log('✓ Cache control headers configured');

  // 6. Response size monitoring JSON replacer
  app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Add response metadata
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (!data._meta) {
          data._meta = {
            timestamp: new Date().toISOString(),
            cached: req.headers['cache-control']?.includes('max-age') ? true : false,
          };
        }
      }
      
      return originalJson(data);
    };
    
    next();
  });
  console.log('✓ Response metadata injection enabled');

  console.log('✅ All optimization middleware initialized\n');
}

/**
 * Optimization middleware setup guide for integration
 * 
 * In your main backend/src/index.js:
 * 
 * import { initializeOptimizedMiddleware } from './optimizedMiddleware.js';
 * 
 * // After creating Express app, before routes:
 * initializeOptimizedMiddleware(app);
 * 
 * // Then add your API routes
 * app.get('/api/prices', (req, res) => {
 *   // pagination info available in req.pagination { limit, offset, page }
 *   const { limit, offset } = req.pagination;
 *   
 *   // Client can use ?fields=id,price,date to get only needed fields
 *   // Compression applied automatically if response > 1KB
 *   res.json({ data: prices, pagination: { limit, offset, page: req.pagination.page } });
 * });
 * 
 * // Usage examples for clients:
 * // GET /api/prices?page=1&limit=20 - pagination
 * // GET /api/prices?fields=id,name,price - select specific fields only
 * // GET /api/prices?page=1&limit=20&fields=id,price - combine both
 * // GET /api/prices with x-no-compression header - skip compression
 */

export { paginate, fieldSelector, logCompressionStats };
