// src/middleware/auth.js

import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository.js';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * JWT Configuration object for consistency
 */
export const jwtConfig = {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN,
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
    algorithms: ['HS256']
};

/**
 * Generate access token for a user
 */
export const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            name: user.name
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Generate refresh token for a user
 */
export const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.type === 'refresh') {
            throw new Error('Invalid token type');
        }
        
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expired');
        }
        throw error;
    }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) return null;
    
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    if (authHeader.length > 20) {
        return authHeader;
    }
    
    return null;
};




/**
 * Authenticate JWT token middleware
 */
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required',
                message: 'No token provided. Please login first.'
            });
        }

        const decoded = verifyAccessToken(token);
        const user = await UserRepository.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication failed',
                message: 'User not found. Please login again.'
            });
        }

        // Check email verification for non-verification routes
        const isVerificationRoute = req.originalUrl === '/api/auth/verify-code' || 
                                     req.originalUrl === '/api/auth/resend-verification';
        
        if (user.verified === false && !isVerificationRoute) {
            return res.status(403).json({ 
                success: false,
                error: 'Email not verified',
                message: 'Please verify your email address before accessing this resource.',
                requiresVerification: true
            });
        }
        
        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            market_id: user.market_id,
            province: user.province,
            district: user.district,
            is_verified: user.verified,
            is_active: user.is_active
        };
        
        next();
    } catch (error) {
        if (error.message === 'Token expired') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expired',
                message: 'Your session has expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.message === 'Invalid token') {
            return res.status(403).json({ 
                success: false,
                error: 'Invalid token',
                message: 'Invalid authentication token. Please login again.',
                code: 'INVALID_TOKEN'
            });
        }
        
        return res.status(403).json({ 
            success: false,
            error: 'Authentication failed',
            message: error.message || 'Failed to authenticate token'
        });
    }
};

export const authenticate = authenticateToken;

/**
 * Optional authentication - doesn't require token but attaches user if present
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            try {
                const decoded = verifyAccessToken(token);
                const user = await UserRepository.findById(decoded.id);
                if (user && user.is_active !== false) {
                    req.user = {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        phone: user.phone,
                        market_id: user.market_id,
                        province: user.province,
                        district: user.district,
                        is_verified: user.verified,
                        is_active: user.is_active
                    };
                }
            } catch (tokenError) {
                // Token invalid but that's fine for optional auth
            }
        }
        next();
    } catch (error) {
        next();
    }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required',
                message: 'Please login first to access this resource'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied',
                message: `Role '${req.user.role}' does not have permission to access this resource`,
                required_roles: allowedRoles,
                your_role: req.user.role
            });
        }
        
        next();
    };
};

/**
 * Admin only middleware
 */
export const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            message: 'Please login first'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Admin access required',
            message: 'This resource requires administrator privileges',
            required_role: 'admin',
            your_role: req.user.role
        });
    }
    next();
};

/**
 * Vendor only middleware
 */
export const vendorOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            message: 'Please login first'
        });
    }
    
    if (!['vendor', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            error: 'Vendor access required',
            message: 'This resource requires vendor or admin privileges',
            required_roles: ['vendor', 'admin'],
            your_role: req.user.role
        });
    }
    next();
};

/**
 * Business only middleware
 */
export const businessOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            message: 'Please login first'
        });
    }
    
    if (!['business', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            error: 'Business access required',
            message: 'This resource requires business or admin privileges',
            required_roles: ['business', 'admin'],
            your_role: req.user.role
        });
    }
    next();
};

/**
 * Check if user is verified
 */
export const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            message: 'Please login first'
        });
    }
    
    if (!req.user.is_verified) {
        return res.status(403).json({ 
            success: false,
            error: 'Email not verified',
            message: 'Please verify your email address first',
            requiresVerification: true
        });
    }
    next();
};

/**
 * Check if user can submit prices (vendor, business, or admin)
 */
export const canSubmitPrice = (req, res, next) => {
    const allowedRoles = ['vendor', 'business', 'admin'];
    
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            message: 'Please login first to submit prices'
        });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            error: 'Price submission not allowed',
            message: 'Only vendors, businesses, and admins can submit prices',
            required_roles: allowedRoles,
            your_role: req.user.role
        });
    }
    next();
};

/**
 * Check if user is not a consumer
 */
export const notConsumer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            message: 'Please login first'
        });
    }
    
    if (req.user.role === 'consumer') {
        return res.status(403).json({ 
            success: false,
            error: 'Access denied',
            message: 'Consumers cannot perform this action',
            your_role: 'consumer'
        });
    }
    next();
};

/**
 * Resource ownership check
 */
export const ownsResource = (getResourceOwnerId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Authentication required',
                    message: 'Please login first'
                });
            }
            
            if (req.user.role === 'admin') {
                return next();
            }
            
            const ownerId = await getResourceOwnerId(req);
            
            if (!ownerId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid request',
                    message: 'Unable to determine resource owner'
                });
            }
            
            if (parseInt(ownerId) !== parseInt(req.user.id)) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Access denied',
                    message: 'You do not have permission to access this resource',
                    resource_owner_id: ownerId,
                    your_id: req.user.id
                });
            }
            
            next();
        } catch (error) {
            console.error('Ownership verification error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to verify ownership',
                message: error.message 
            });
        }
    };
};

/**
 * Check if user can access market data
 */
export const canAccessMarket = (getMarketId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Authentication required',
                    message: 'Please login first'
                });
            }
            
            if (req.user.role === 'admin') {
                return next();
            }
            
            const marketId = await getMarketId(req);
            
            if (!marketId) {
                return next();
            }
            
            if (req.user.role === 'vendor' && req.user.market_id !== marketId) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Access denied',
                    message: 'You do not have permission to access data for this market',
                    requested_market: marketId,
                    your_market: req.user.market_id
                });
            }
            
            next();
        } catch (error) {
            console.error('Market access verification error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to verify market access',
                message: error.message 
            });
        }
    };
};

/**
 * Rate limit for authenticated users
 */
export const authenticateAndRateLimit = (maxRequests = 100, windowMs = 60000) => {
    const requests = new Map();
    
    return async (req, res, next) => {
        await authenticateToken(req, res, async () => {
            const userId = req.user.id;
            const now = Date.now();
            const userRequests = requests.get(userId) || [];
            
            const recentRequests = userRequests.filter(time => now - time < windowMs);
            
            if (recentRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs/1000} seconds.`,
                    retryAfter: Math.ceil((windowMs - (now - recentRequests[0])) / 1000)
                });
            }
            
            recentRequests.push(now);
            requests.set(userId, recentRequests);
            
            next();
        });
    };
};

// Default export
export default {
    jwtConfig,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    extractTokenFromHeader,
    authenticateToken,
    authenticate,  // Alias for authenticateToken
    optionalAuth,
    authorize,
    adminOnly,
    vendorOnly,
    businessOnly,
    canSubmitPrice,
    notConsumer,
    ownsResource,
    canAccessMarket,
    requireVerified,
    authenticateAndRateLimit
};