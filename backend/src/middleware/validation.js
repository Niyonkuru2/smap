import Joi from 'joi';

// Common validation schemas
export const schemas = {
    signup: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(100).required(),
        name: Joi.string().min(2).max(100).required(),
        role: Joi.string().valid('consumer', 'vendor', 'business').optional()
    }),
    
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    
    email: Joi.object({
        email: Joi.string().email().required()
    }),
    
    verifyCode: Joi.object({
        email: Joi.string().email().required(),
        code: Joi.string().length(6).pattern(/^\d+$/).required()
    }),
    
    priceSubmit: Joi.object({
        productId: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        productName: Joi.string().optional(),
        marketId: Joi.string().required(),
        marketName: Joi.string().optional(),
        price: Joi.number().positive().required(),
        unit: Joi.string().default('kg'),
        notes: Joi.string().max(500).optional()
    }),
    
    favoriteAdd: Joi.object({
        productId: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        marketId: Joi.string().required()
    }),
    
    alertCreate: Joi.object({
        productId: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        marketId: Joi.string().required(),
        targetPrice: Joi.number().positive().required(),
        alertType: Joi.string().valid('below', 'above').default('below')
    }),
    
    search: Joi.object({
        query: Joi.string().optional(),
        category: Joi.string().optional(),
        market: Joi.string().optional(),
        minPrice: Joi.number().min(0).optional(),
        maxPrice: Joi.number().positive().optional(),
        sortBy: Joi.string().valid('name', 'price_low', 'price_high', 'rating').default('name'),
        limit: Joi.number().min(1).max(100).default(50),
        page: Joi.number().min(1).default(1)
    }),
    
    communityVerify: Joi.object({
        action: Joi.string().valid('confirm', 'dispute').required(),
        reason: Joi.string().when('action', {
            is: 'dispute',
            then: Joi.string().required(),
            otherwise: Joi.string().optional()
        })
    }),
    
    rating: Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        review: Joi.string().max(500).optional(),
        category: Joi.string().valid('accuracy', 'reliability', 'general').default('general')
    }),
    
    smsSend: Joi.object({
        phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
        message: Joi.string().min(1).max(500).required()
    })
};

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const data = req[property];
        
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        
        req[property] = value;
        next();
    };
};

/**
 * Alias for validate - for backward compatibility
 */
export const validateRequest = validate;

/**
 * Validate request parameters
 */
export const validateParams = (schema) => {
    return validate(schema, 'params');
};

/**
 * Validate query string
 */
export const validateQuery = (schema) => {
    return validate(schema, 'query');
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj
                .replace(/[<>]/g, '')
                .trim();
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (Object.hasOwn(obj, key)) {
                    obj[key] = sanitize(obj[key]);
                }
            }
        }
        return obj;
    };
    
    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);
    
    next();
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Rwanda format)
 */
export const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^(\+250|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
    const requirements = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const isValid = Object.values(requirements).every(Boolean);
    
    return {
        isValid,
        requirements
    };
};

export default {
    validate,
    validateRequest,
    validateParams,
    validateQuery,
    sanitizeInput,
    isValidEmail,
    isValidPhoneNumber,
    isStrongPassword,
    schemas
};