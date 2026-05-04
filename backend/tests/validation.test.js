/**
 * Unit Tests for Validation Module
 */

import {
    schemas,
    isValidEmail,
    isValidPhone,
    validatePassword,
    sanitizeString,
    sanitizeNumber
} from '../src/validation.js';

describe('Validation Module', () => {
    
    describe('isValidEmail', () => {
        test('should validate correct emails', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.rw')).toBe(true);
            expect(isValidEmail('user+tag@gmail.com')).toBe(true);
        });

        test('should reject invalid emails', () => {
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('no@domain')).toBe(false);
            expect(isValidEmail('@nodomain.com')).toBe(false);
            expect(isValidEmail('spaces in@email.com')).toBe(false);
        });
    });

    describe('isValidPhone', () => {
        test('should validate Rwanda phone numbers', () => {
            expect(isValidPhone('+250788123456')).toBe(true);
            expect(isValidPhone('0788123456')).toBe(true);
            expect(isValidPhone('250 788 123 456')).toBe(true);
        });

        test('should reject invalid phone numbers', () => {
            expect(isValidPhone('123')).toBe(false);
            expect(isValidPhone('abcdefghij')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        test('should accept valid passwords', () => {
            const result = validatePassword('password123');
            expect(result.valid).toBe(true);
        });

        test('should reject short passwords', () => {
            const result = validatePassword('short');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should indicate password strength', () => {
            expect(validatePassword('short1').strength).toBe('weak');
            expect(validatePassword('mediumpass').strength).toBe('medium');
            expect(validatePassword('verylongpassword').strength).toBe('strong');
        });
    });

    describe('sanitizeString', () => {
        test('should trim whitespace', () => {
            expect(sanitizeString('  hello  ')).toBe('hello');
        });

        test('should remove HTML tags', () => {
            expect(sanitizeString('<script>alert("xss")</script>hello')).toBe('alert("xss")hello');
        });

        test('should respect max length', () => {
            expect(sanitizeString('hello world', 5)).toBe('hello');
        });

        test('should return empty string for non-strings', () => {
            expect(sanitizeString(123)).toBe('');
            expect(sanitizeString(null)).toBe('');
        });
    });

    describe('sanitizeNumber', () => {
        test('should parse valid numbers', () => {
            expect(sanitizeNumber('123')).toBe(123);
            expect(sanitizeNumber(456.78)).toBe(456.78);
        });

        test('should respect min/max bounds', () => {
            expect(sanitizeNumber(5, 10, 100)).toBe(10);
            expect(sanitizeNumber(150, 10, 100)).toBe(100);
        });

        test('should return null for invalid numbers', () => {
            expect(sanitizeNumber('abc')).toBeNull();
            expect(sanitizeNumber(NaN)).toBeNull();
        });
    });

    describe('schemas.signup', () => {
        test('should validate correct signup data', () => {
            const result = schemas.signup({
                email: 'test@example.com',
                password: 'password123',
                name: 'John Doe'
            });

            expect(result.valid).toBe(true);
            expect(result.sanitized.email).toBe('test@example.com');
        });

        test('should reject missing required fields', () => {
            const result = schemas.signup({
                email: 'test@example.com'
            });

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'password')).toBe(true);
        });

        test('should validate optional phone', () => {
            const result = schemas.signup({
                email: 'test@example.com',
                password: 'password123',
                name: 'John',
                phone: '+250788123456'
            });

            expect(result.valid).toBe(true);
            expect(result.sanitized.phone).toBeDefined();
        });

        test('should set default role', () => {
            const result = schemas.signup({
                email: 'test@example.com',
                password: 'password123',
                name: 'John'
            });

            expect(result.sanitized.role).toBe('consumer');
        });
    });

    describe('schemas.priceSubmission', () => {
        test('should validate correct price submission', () => {
            const result = schemas.priceSubmission({
                productId: 'prod-1',
                marketId: 'market-1',
                price: 500
            });

            expect(result.valid).toBe(true);
        });

        test('should clamp negative price to minimum (1)', () => {
            const result = schemas.priceSubmission({
                productId: 'prod-1',
                marketId: 'market-1',
                price: -100
            });

            // Price gets clamped to minimum of 1
            expect(result.valid).toBe(true);
            expect(result.sanitized.price).toBe(1);
        });

        test('should default unit to kg', () => {
            const result = schemas.priceSubmission({
                productId: 'prod-1',
                marketId: 'market-1',
                price: 500
            });

            expect(result.sanitized.unit).toBe('kg');
        });
    });

    describe('schemas.rating', () => {
        test('should validate correct rating', () => {
            const result = schemas.rating({
                rating: 5,
                review: 'Great product!'
            });

            expect(result.valid).toBe(true);
        });

        test('should clamp out of range rating to valid range', () => {
            // Rating 6 gets clamped to 5
            const result = schemas.rating({ rating: 6 });
            expect(result.valid).toBe(true);
            expect(result.sanitized.rating).toBe(5);

            // Rating 0 gets clamped to 1
            const result2 = schemas.rating({ rating: 0 });
            expect(result2.valid).toBe(true);
            expect(result2.sanitized.rating).toBe(1);
        });
    });
});
