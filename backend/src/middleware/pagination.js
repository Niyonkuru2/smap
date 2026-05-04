import { PAGINATION } from '../config/constants.js';

// Cache for paginated results
const paginationCache = new Map();

/**
 * Pagination middleware
 * Extracts and validates pagination parameters from query string
 */
export const paginationMiddleware = (defaultLimit = PAGINATION.DEFAULT_LIMIT, maxLimit = PAGINATION.MAX_LIMIT) => {
    return (req, res, next) => {
        // Extract pagination params from query
        let page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        let limit = parseInt(req.query.limit) || defaultLimit;
        
        // Validate and sanitize
        page = Math.max(1, page);
        limit = Math.min(maxLimit, Math.max(1, limit));
        
        // Calculate offset
        const offset = (page - 1) * limit;
        
        // Attach pagination info to request
        req.pagination = {
            page,
            limit,
            offset,
            skip: offset,
            take: limit
        };
        
        // Add pagination helpers to response
        res.paginate = (data, total) => {
            const totalPages = Math.ceil(total / limit);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;
            
            const paginationInfo = {
                current_page: page,
                per_page: limit,
                total_items: total,
                total_pages: totalPages,
                has_next: hasNext,
                has_prev: hasPrev,
                next_page: hasNext ? page + 1 : null,
                prev_page: hasPrev ? page - 1 : null
            };
            
            // Add pagination links
            const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
            const queryParams = { ...req.query };
            delete queryParams.page;
            delete queryParams.limit;
            
            const queryString = Object.keys(queryParams).length > 0 
                ? '?' + new URLSearchParams(queryParams).toString() 
                : '';
            
            paginationInfo.links = {
                first: `${baseUrl}?page=1&limit=${limit}${queryString}`,
                last: `${baseUrl}?page=${totalPages}&limit=${limit}${queryString}`,
                next: hasNext ? `${baseUrl}?page=${page + 1}&limit=${limit}${queryString}` : null,
                prev: hasPrev ? `${baseUrl}?page=${page - 1}&limit=${limit}${queryString}` : null
            };
            
            return {
                data,
                pagination: paginationInfo
            };
        };
        
        next();
    };
};

/**
 * Cached pagination middleware
 * Caches paginated results for GET requests
 * @param {number} ttl - Time to live in seconds
 */
export const cachedPagination = (ttl = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        
        // Create cache key from URL and pagination params
        const cacheKey = `${req.originalUrl}`;
        const cached = paginationCache.get(cacheKey);
        
        if (cached && cached.expiresAt > Date.now()) {
            return res.json(cached.data);
        }
        
        // Store original json function
        const originalJson = res.json;
        
        res.json = function(data) {
            // Cache the response
            paginationCache.set(cacheKey, {
                data,
                expiresAt: Date.now() + (ttl * 1000)
            });
            
            // Auto-cleanup old cache entries
            setTimeout(() => {
                paginationCache.delete(cacheKey);
            }, ttl * 1000);
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

/**
 * Clear pagination cache for a specific pattern
 */
export const clearPaginationCache = (pattern) => {
    for (const key of paginationCache.keys()) {
        if (pattern.test(key)) {
            paginationCache.delete(key);
        }
    }
};

/**
 * Get pagination cache stats
 */
export const getPaginationCacheStats = () => {
    return {
        size: paginationCache.size,
        keys: Array.from(paginationCache.keys())
    };
};

/**
 * Generate pagination metadata for response headers
 */
export const setPaginationHeaders = (req, res, total) => {
    const { page, limit } = req.pagination;
    const totalPages = Math.ceil(total / limit);
    
    res.setHeader('X-Total-Count', total);
    res.setHeader('X-Total-Pages', totalPages);
    res.setHeader('X-Current-Page', page);
    res.setHeader('X-Per-Page', limit);
    
    if (page < totalPages) {
        res.setHeader('X-Next-Page', page + 1);
    }
    if (page > 1) {
        res.setHeader('X-Prev-Page', page - 1);
    }
};

/**
 * Cursor-based pagination (for infinite scroll)
 */
export const cursorPagination = (defaultLimit = 20) => {
    return (req, res, next) => {
        let limit = parseInt(req.query.limit) || defaultLimit;
        let cursor = req.query.cursor;
        
        limit = Math.min(100, Math.max(1, limit));
        
        req.cursorPagination = {
            cursor,
            limit,
            nextCursor: null
        };
        
        res.cursorPaginate = (data, getNextCursor) => {
            const hasMore = data.length === limit;
            const nextCursor = hasMore ? getNextCursor(data[data.length - 1]) : null;
            
            return {
                data,
                pagination: {
                    limit,
                    next_cursor: nextCursor,
                    has_more: hasMore
                }
            };
        };
        
        next();
    };
};

export default {
    paginationMiddleware,
    cachedPagination,
    clearPaginationCache,
    getPaginationCacheStats,
    setPaginationHeaders,
    cursorPagination
};