import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validate JWT secret in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change-this-in-production') {
    console.error('CRITICAL: JWT_SECRET is using default value in production!');
    console.error('   Please set a strong JWT_SECRET environment variable');
}

/**
 * Generate access token
 * @param {Object} payload User data to encode
 * @param {Object} options Optional JWT options
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload, options = {}) => {
    const defaultPayload = {
        id: payload.id,
        email: payload.email,
        role: payload.role
    };
    
    return jwt.sign(
        defaultPayload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN, ...options }
    );
};

/**
 * Generate refresh token
 * @param {Object} payload User data to encode
 * @param {Object} options Optional JWT options
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload, options = {}) => {
    const defaultPayload = {
        id: payload.id,
        email: payload.email,
        tokenType: 'refresh'
    };
    
    return jwt.sign(
        defaultPayload,
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN, ...options }
    );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user User object
 * @returns {Object} Tokens object
 */
export const generateTokens = (user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: getExpiresInSeconds(JWT_EXPIRES_IN),
        token_type: 'Bearer'
    };
};

/**
 * Verify access token
 * @param {string} token JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        throw new Error('Invalid token');
    }
};

/**
 * Verify refresh token
 * @param {string} token Refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        
        // Ensure this is a refresh token
        if (decoded.tokenType !== 'refresh') {
            throw new Error('Invalid token type');
        }
        
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expired');
        }
        throw new Error('Invalid refresh token');
    }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken Refresh token
 * @returns {Object} New tokens
 * @throws {Error} If refresh token is invalid
 */
export const refreshAccessToken = (refreshToken) => {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Generate new tokens
    const newAccessToken = generateAccessToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
    });
    
    return {
        access_token: newAccessToken,
        expires_in: getExpiresInSeconds(JWT_EXPIRES_IN),
        token_type: 'Bearer'
    };
};

/**
 * Convert time string to seconds
 * @param {string} timeString Time string (e.g., '24h', '7d', '30m')
 * @returns {number} Seconds
 */
const getExpiresInSeconds = (timeString) => {
    const value = parseInt(timeString);
    const unit = timeString.slice(-1);
    
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 86400; // Default 24 hours
    }
};

/**
 * Decode token without verification
 * @param {string} token JWT token
 * @returns {Object|null} Decoded payload or null
 */
export const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

/**
 * Check if token is expired
 * @param {string} token JWT token
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};

/**
 * Get remaining time on token
 * @param {string} token JWT token
 * @returns {number} Seconds remaining (0 if expired)
 */
export const getTokenRemainingTime = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return 0;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return Math.max(0, decoded.exp - currentTime);
    } catch (error) {
        return 0;
    }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader Authorization header value
 * @returns {string|null} Token or null
 */
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    return authHeader.split(' ')[1];
};

// JWT configuration object
export const jwtConfig = {
    secret: JWT_SECRET,
    refreshSecret: JWT_REFRESH_SECRET,
    expiresIn: JWT_EXPIRES_IN,
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
    algorithms: ['HS256'],
    issuer: 'smpmps-api',
    audience: 'smpmps-client'
};

export default {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    refreshAccessToken,
    decodeToken,
    isTokenExpired,
    getTokenRemainingTime,
    extractTokenFromHeader,
    jwtConfig
};