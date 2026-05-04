/**
 * Compression Middleware for Backend
 * Automatically compresses API responses
 */

const compression = require('compression');

function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return compression.filter(req, res);
}

const compressionMiddleware = compression({
  filter: shouldCompress,
  level: 6, // 0-9, higher = better compression but slower
  threshold: 1024, // Only compress responses > 1KB
  memLevel: 8,
});

module.exports = compressionMiddleware;
