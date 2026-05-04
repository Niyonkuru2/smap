import { trackError } from './performance.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * Custom App Error class
 */
export class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not found handler (404)
 */
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `Cannot find ${req.method} ${req.path}`,
        RESPONSE_CODES.NOT_FOUND
    );
    next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
    // Track error for performance monitoring
    trackError(err, req);
    
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
    });
    
    // Default error response
    let statusCode = err.statusCode || RESPONSE_CODES.SERVER_ERROR;
    let message = err.message || 'Internal server error';
    let details = err.details || null;
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = RESPONSE_CODES.BAD_REQUEST;
        message = 'Validation failed';
        details = err.errors || err.details;
    }
    
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = RESPONSE_CODES.UNAUTHORIZED;
        message = 'Invalid or expired token';
    }
    
    if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = RESPONSE_CODES.CONFLICT;
        message = 'Duplicate entry';
        details = err.detail;
    }
    
    if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = RESPONSE_CODES.BAD_REQUEST;
        message = 'Referenced record not found';
    }
    
    if (err.code === '42P01') { // PostgreSQL undefined table
        statusCode = RESPONSE_CODES.SERVER_ERROR;
        message = 'Database configuration error';
    }
    
    // Rate limit error
    if (err.name === 'RateLimitError') {
        statusCode = RESPONSE_CODES.TOO_MANY_REQUESTS;
        message = 'Too many requests, please try again later';
    }
    
    // Send response
    res.status(statusCode).json({
        error: message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        path: req.path,
        timestamp: new Date().toISOString()
    });
};

/**
 * Async handler wrapper to avoid try-catch in controllers
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error) => {
    console.error('Database error:', error);
    
    if (error.code === 'ECONNREFUSED') {
        return new AppError('Database connection failed', RESPONSE_CODES.SERVER_ERROR);
    }
    
    if (error.code === '23505') {
        const match = error.detail.match(/Key \((.*?)\)=\((.*?)\)/);
        const field = match ? match[1] : 'unknown';
        return new AppError(`Duplicate value for ${field}`, RESPONSE_CODES.CONFLICT);
    }
    
    return new AppError('Database operation failed', RESPONSE_CODES.SERVER_ERROR);
};

/**
 * Validation error creator
 */
export const createValidationError = (errors) => {
    const error = new AppError('Validation failed', RESPONSE_CODES.BAD_REQUEST);
    error.details = errors;
    return error;
};

export default {
    AppError,
    notFoundHandler,
    errorHandler,
    catchAsync,
    handleDatabaseError,
    createValidationError
};