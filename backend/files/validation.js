/**
 * Input Validation Module
 * Joi-like validation schemas for request validation
 */

/**
 * Validation result helper
 */
function validationResult(isValid, errors = [], sanitized = null) {
    return {
        valid: isValid,
        errors,
        sanitized
    };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Rwanda format)
 */
function isValidPhone(phone) {
    // Rwanda phone: +250 7XX XXX XXX or 07XX XXX XXX
    const phoneRegex = /^(\+?250|0)?7[2-9][0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate password strength
 */
function validatePassword(password) {
    const errors = [];
    
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    if (password.length > 100) {
        errors.push('Password must be less than 100 characters');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        strength: password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak'
    };
}

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .slice(0, maxLength)
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>]/g, ''); // Remove remaining angle brackets
}

/**
 * Sanitize number input
 */
function sanitizeNumber(num, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return null;
    return Math.max(min, Math.min(max, parsed));
}

/**
 * Validation schemas
 */
const schemas = {
    // User registration
    signup: (data) => {
        const errors = [];
        const sanitized = {};
        
        // Email validation
        if (!data.email) {
            errors.push({ field: 'email', message: 'Email is required' });
        } else if (!isValidEmail(data.email)) {
            errors.push({ field: 'email', message: 'Invalid email format' });
        } else {
            sanitized.email = data.email.toLowerCase().trim();
        }
        
        // Password validation
        if (!data.password) {
            errors.push({ field: 'password', message: 'Password is required' });
        } else {
            const pwdResult = validatePassword(data.password);
            if (!pwdResult.valid) {
                errors.push({ field: 'password', message: pwdResult.errors[0] });
            } else {
                sanitized.password = data.password;
            }
        }
        
        // Name validation
        if (!data.name || data.name.trim().length < 2) {
            errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
        } else {
            sanitized.name = sanitizeString(data.name, 100);
        }
        
        // Role validation
        const validRoles = ['consumer', 'vendor', 'admin'];
        sanitized.role = validRoles.includes(data.role) ? data.role : 'consumer';
        
        // Optional phone
        if (data.phone) {
            if (!isValidPhone(data.phone)) {
                errors.push({ field: 'phone', message: 'Invalid Rwanda phone number' });
            } else {
                sanitized.phone = data.phone.replace(/\s/g, '');
            }
        }
        
        // Optional location
        if (data.province) sanitized.province = sanitizeString(data.province, 50);
        if (data.district) sanitized.district = sanitizeString(data.district, 50);
        if (data.marketId) sanitized.marketId = sanitizeString(data.marketId, 50);
        
        return validationResult(errors.length === 0, errors, sanitized);
    },
    
    // Login
    login: (data) => {
        const errors = [];
        const sanitized = {};
        
        if (!data.email) {
            errors.push({ field: 'email', message: 'Email is required' });
        } else {
            sanitized.email = data.email.toLowerCase().trim();
        }
        
        if (!data.password) {
            errors.push({ field: 'password', message: 'Password is required' });
        } else {
            sanitized.password = data.password;
        }
        
        return validationResult(errors.length === 0, errors, sanitized);
    },
    
    // Price submission
    priceSubmission: (data) => {
        const errors = [];
        const sanitized = {};
        
        // Product validation
        if (!data.productId && !data.productName) {
            errors.push({ field: 'product', message: 'Product ID or name is required' });
        } else {
            if (data.productId) sanitized.productId = sanitizeString(data.productId, 50);
            if (data.productName) sanitized.productName = sanitizeString(data.productName, 100);
        }
        
        // Market validation
        if (!data.marketId && !data.marketName) {
            errors.push({ field: 'market', message: 'Market ID or name is required' });
        } else {
            if (data.marketId) sanitized.marketId = sanitizeString(data.marketId, 50);
            if (data.marketName) sanitized.marketName = sanitizeString(data.marketName, 100);
        }
        
        // Price validation
        const price = sanitizeNumber(data.price, 1, 10000000);
        if (price === null) {
            errors.push({ field: 'price', message: 'Valid price is required (1-10,000,000 RWF)' });
        } else {
            sanitized.price = price;
        }
        
        // Optional unit
        const validUnits = ['kg', 'g', 'L', 'mL', 'piece', 'bunch', 'dozen', 'bag'];
        sanitized.unit = validUnits.includes(data.unit) ? data.unit : 'kg';
        
        // Optional notes
        if (data.notes) {
            sanitized.notes = sanitizeString(data.notes, 500);
        }
        
        return validationResult(errors.length === 0, errors, sanitized);
    },
    
    // Price alert
    priceAlert: (data) => {
        const errors = [];
        const sanitized = {};
        
        if (!data.productId) {
            errors.push({ field: 'productId', message: 'Product ID is required' });
        } else {
            sanitized.productId = sanitizeString(data.productId, 50);
        }
        
        const targetPrice = sanitizeNumber(data.targetPrice, 1, 10000000);
        if (targetPrice === null) {
            errors.push({ field: 'targetPrice', message: 'Valid target price is required' });
        } else {
            sanitized.targetPrice = targetPrice;
        }
        
        const validAlertTypes = ['below', 'above', 'change'];
        sanitized.alertType = validAlertTypes.includes(data.alertType) ? data.alertType : 'below';
        
        if (data.marketId) {
            sanitized.marketId = sanitizeString(data.marketId, 50);
        }
        
        return validationResult(errors.length === 0, errors, sanitized);
    },
    
    // Rating
    rating: (data) => {
        const errors = [];
        const sanitized = {};
        
        const rating = sanitizeNumber(data.rating, 1, 5);
        if (rating === null || !Number.isInteger(rating)) {
            errors.push({ field: 'rating', message: 'Rating must be between 1 and 5' });
        } else {
            sanitized.rating = rating;
        }
        
        if (data.review) {
            sanitized.review = sanitizeString(data.review, 500);
        }
        
        if (data.category) {
            const validCategories = ['accuracy', 'reliability', 'general'];
            sanitized.category = validCategories.includes(data.category) ? data.category : 'general';
        }
        
        return validationResult(errors.length === 0, errors, sanitized);
    },
    
    // Search query
    search: (data) => {
        const sanitized = {};
        
        if (data.query) sanitized.query = sanitizeString(data.query, 100);
        if (data.category) sanitized.category = sanitizeString(data.category, 50);
        if (data.market) sanitized.market = sanitizeString(data.market, 100);
        if (data.minPrice) sanitized.minPrice = sanitizeNumber(data.minPrice, 0, 10000000);
        if (data.maxPrice) sanitized.maxPrice = sanitizeNumber(data.maxPrice, 0, 10000000);
        
        const validSortOptions = ['name', 'price_low', 'price_high', 'rating', 'date'];
        sanitized.sortBy = validSortOptions.includes(data.sortBy) ? data.sortBy : 'name';
        
        sanitized.limit = sanitizeNumber(data.limit, 1, 100) || 50;
        sanitized.page = sanitizeNumber(data.page, 1, 1000) || 1;
        
        return validationResult(true, [], sanitized);
    },
    
    // Profile update
    profileUpdate: (data) => {
        const errors = [];
        const sanitized = {};
        
        if (data.name !== undefined) {
            if (data.name.length < 2) {
                errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
            } else {
                sanitized.name = sanitizeString(data.name, 100);
            }
        }
        
        if (data.phone !== undefined) {
            if (data.phone && !isValidPhone(data.phone)) {
                errors.push({ field: 'phone', message: 'Invalid Rwanda phone number' });
            } else {
                sanitized.phone = data.phone ? data.phone.replace(/\s/g, '') : null;
            }
        }
        
        if (data.province) sanitized.province = sanitizeString(data.province, 50);
        if (data.district) sanitized.district = sanitizeString(data.district, 50);
        if (data.marketId) sanitized.marketId = sanitizeString(data.marketId, 50);
        
        return validationResult(errors.length === 0, errors, sanitized);
    }
};

/**
 * Validation middleware factory
 */
function validate(schemaName) {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        
        if (!schema) {
            console.error(`Unknown validation schema: ${schemaName}`);
            return next();
        }
        
        const result = schema(req.body);
        
        if (!result.valid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.errors
            });
        }
        
        // Replace body with sanitized data
        req.validatedBody = result.sanitized;
        next();
    };
}

/**
 * Validate query parameters
 */
function validateQuery(schemaName) {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        
        if (!schema) {
            return next();
        }
        
        const result = schema(req.query);
        req.validatedQuery = result.sanitized;
        next();
    };
}

export {
    schemas,
    validate,
    validateQuery,
    isValidEmail,
    isValidPhone,
    validatePassword,
    sanitizeString,
    sanitizeNumber
};
