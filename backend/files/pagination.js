/**
 * Pagination & Caching Utilities
 * Provides consistent pagination and in-memory caching
 */

// Simple in-memory cache (use Redis in production)
const cache = new Map();
const cacheExpiry = new Map();

/**
 * Paginate an array of results
 */
function paginate(data, options = {}) {
    const {
        page = 1,
        limit = 20,
        maxLimit = 100
    } = options;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), maxLimit);
    
    const total = data.length;
    const totalPages = Math.ceil(total / limitNum);
    const offset = (pageNum - 1) * limitNum;
    
    const results = data.slice(offset, offset + limitNum);
    
    return {
        data: results,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
            nextPage: pageNum < totalPages ? pageNum + 1 : null,
            prevPage: pageNum > 1 ? pageNum - 1 : null
        }
    };
}

/**
 * Create pagination middleware for Express
 */
function paginationMiddleware(defaultLimit = 20, maxLimit = 100) {
    return (req, res, next) => {
        req.pagination = {
            page: Math.max(1, parseInt(req.query.page) || 1),
            limit: Math.min(Math.max(1, parseInt(req.query.limit) || defaultLimit), maxLimit),
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc'
        };
        next();
    };
}

/**
 * Get from cache
 */
function getCache(key) {
    const expiry = cacheExpiry.get(key);
    
    if (expiry && Date.now() > expiry) {
        cache.delete(key);
        cacheExpiry.delete(key);
        return null;
    }
    
    return cache.get(key) || null;
}

/**
 * Set cache with TTL (time to live in seconds)
 */
function setCache(key, value, ttlSeconds = 300) {
    cache.set(key, value);
    cacheExpiry.set(key, Date.now() + (ttlSeconds * 1000));
    return true;
}

/**
 * Delete from cache
 */
function deleteCache(key) {
    cache.delete(key);
    cacheExpiry.delete(key);
    return true;
}

/**
 * Clear all cache
 */
function clearCache() {
    const size = cache.size;
    cache.clear();
    cacheExpiry.clear();
    return { cleared: size };
}

/**
 * Get cache stats
 */
function getCacheStats() {
    let expiredCount = 0;
    const now = Date.now();
    
    cacheExpiry.forEach((expiry) => {
        if (now > expiry) expiredCount++;
    });
    
    return {
        totalEntries: cache.size,
        expiredEntries: expiredCount,
        activeEntries: cache.size - expiredCount
    };
}

/**
 * Cache middleware for Express routes
 */
function cacheMiddleware(ttlSeconds = 60) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        
        const key = `${req.originalUrl}`;
        const cached = getCache(key);
        
        if (cached) {
            return res.json({
                ...cached,
                _cached: true,
                _cachedAt: new Date().toISOString()
            });
        }
        
        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            setCache(key, data, ttlSeconds);
            return originalJson(data);
        };
        
        next();
    };
}

/**
 * Build SQL pagination clause
 */
function buildPaginationSQL(pagination) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const offset = (page - 1) * limit;
    
    // Whitelist sort columns to prevent SQL injection
    const allowedSortColumns = ['created_at', 'updated_at', 'price', 'name', 'id'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    return {
        orderBy: `ORDER BY ${safeSortBy} ${safeSortOrder}`,
        limitOffset: `LIMIT ${limit} OFFSET ${offset}`
    };
}

/**
 * Create cursor-based pagination
 */
function cursorPaginate(data, options = {}) {
    const {
        limit = 20,
        cursor = null,
        cursorField = 'id'
    } = options;
    
    let filteredData = [...data];
    
    // If cursor provided, start after that item
    if (cursor) {
        const cursorIndex = filteredData.findIndex(item => item[cursorField] === cursor);
        if (cursorIndex !== -1) {
            filteredData = filteredData.slice(cursorIndex + 1);
        }
    }
    
    const results = filteredData.slice(0, limit);
    const hasMore = filteredData.length > limit;
    const nextCursor = results.length > 0 ? results[results.length - 1][cursorField] : null;
    
    return {
        data: results,
        pagination: {
            limit,
            hasMore,
            nextCursor,
            prevCursor: cursor
        }
    };
}

export {
    paginate,
    paginationMiddleware,
    getCache,
    setCache,
    deleteCache,
    clearCache,
    getCacheStats,
    cacheMiddleware,
    buildPaginationSQL,
    cursorPaginate
};
