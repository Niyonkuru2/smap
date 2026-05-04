/**
 * Unit Tests for Two-Factor Authentication Module
 */

import {
    generateSecret,
    generateTOTP,
    verifyTOTP,
    generateBackupCodes,
    initiate2FASetup,
    complete2FASetup,
    verify2FA,
    is2FAEnabled,
    disable2FA,
    get2FAStatus
} from '../src/twoFactorAuth.js';

describe('Two-Factor Authentication Module', () => {
    
    describe('generateSecret', () => {
        test('should generate a base32 encoded secret', () => {
            const secret = generateSecret();
            
            expect(secret).toBeDefined();
            expect(typeof secret).toBe('string');
            expect(secret.length).toBeGreaterThan(10);
            // Base32 characters only
            expect(secret).toMatch(/^[A-Z2-7]+$/);
        });

        test('should generate unique secrets', () => {
            const secret1 = generateSecret();
            const secret2 = generateSecret();
            
            expect(secret1).not.toBe(secret2);
        });
    });

    describe('generateTOTP', () => {
        test('should generate a 6-digit code', () => {
            const secret = generateSecret();
            const code = generateTOTP(secret);
            
            expect(code).toMatch(/^\d{6}$/);
        });

        test('should generate same code for same timestamp', () => {
            const secret = generateSecret();
            const timestamp = Date.now();
            
            const code1 = generateTOTP(secret, timestamp);
            const code2 = generateTOTP(secret, timestamp);
            
            expect(code1).toBe(code2);
        });

        test('should generate different codes for different secrets', () => {
            const secret1 = generateSecret();
            const secret2 = generateSecret();
            const timestamp = Date.now();
            
            const code1 = generateTOTP(secret1, timestamp);
            const code2 = generateTOTP(secret2, timestamp);
            
            expect(code1).not.toBe(code2);
        });
    });

    describe('verifyTOTP', () => {
        test('should verify correct code', () => {
            const secret = generateSecret();
            const code = generateTOTP(secret);
            
            const result = verifyTOTP(secret, code);
            
            expect(result.valid).toBe(true);
        });

        test('should reject incorrect code', () => {
            const secret = generateSecret();
            const result = verifyTOTP(secret, '000000');
            
            expect(result.valid).toBe(false);
        });

        test('should allow window tolerance', () => {
            const secret = generateSecret();
            const code = generateTOTP(secret);
            
            const result = verifyTOTP(secret, code, 2);
            
            expect(result.valid).toBe(true);
        });
    });

    describe('generateBackupCodes', () => {
        test('should generate specified number of codes', () => {
            const codes = generateBackupCodes(10);
            
            expect(codes.length).toBe(10);
        });

        test('should generate codes in correct format', () => {
            const codes = generateBackupCodes(5);
            
            codes.forEach(code => {
                expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
            });
        });

        test('should generate unique codes', () => {
            const codes = generateBackupCodes(10);
            const uniqueCodes = new Set(codes);
            
            expect(uniqueCodes.size).toBe(10);
        });
    });

    describe('2FA Setup Flow', () => {
        const testUserId = 'test-user-2fa';
        const testEmail = 'test@example.com';

        test('should initiate 2FA setup', () => {
            const result = initiate2FASetup(testUserId, testEmail);
            
            expect(result.success).toBe(true);
            expect(result.secret).toBeDefined();
            expect(result.otpauthUrl).toContain('otpauth://totp/');
            expect(result.otpauthUrl).toContain(encodeURIComponent(testEmail));
        });

        test('should complete 2FA setup with valid code', () => {
            // Initiate setup
            const setup = initiate2FASetup('user-complete-test', 'complete@test.com');
            
            // Generate valid code
            const validCode = generateTOTP(setup.secret);
            
            // Complete setup
            const result = complete2FASetup('user-complete-test', validCode);
            
            expect(result.success).toBe(true);
            expect(result.backupCodes).toBeDefined();
            expect(result.backupCodes.length).toBe(10);
        });

        test('should reject invalid code during setup', () => {
            initiate2FASetup('user-invalid-test', 'invalid@test.com');
            
            const result = complete2FASetup('user-invalid-test', '000000');
            
            expect(result.success).toBe(false);
        });
    });

    describe('2FA Verification', () => {
        const userId = 'verify-test-user';
        let setupSecret;

        beforeAll(() => {
            // Setup 2FA for test user
            const setup = initiate2FASetup(userId, 'verify@test.com');
            setupSecret = setup.secret;
            const code = generateTOTP(setupSecret);
            complete2FASetup(userId, code);
        });

        test('should verify valid TOTP code', () => {
            const code = generateTOTP(setupSecret);
            const result = verify2FA(userId, code);
            
            expect(result.success).toBe(true);
            expect(result.method).toBe('totp');
        });

        test('should reject invalid code', () => {
            const result = verify2FA(userId, '000000');
            
            expect(result.success).toBe(false);
        });

        test('should report 2FA as enabled', () => {
            expect(is2FAEnabled(userId)).toBe(true);
        });

        test('should report 2FA as disabled for unknown user', () => {
            expect(is2FAEnabled('unknown-user')).toBe(false);
        });
    });

    describe('get2FAStatus', () => {
        test('should return correct status for user with 2FA', () => {
            const userId = 'status-test-user';
            const setup = initiate2FASetup(userId, 'status@test.com');
            const code = generateTOTP(setup.secret);
            complete2FASetup(userId, code);

            const status = get2FAStatus(userId);

            expect(status.enabled).toBe(true);
            expect(status.enabledAt).toBeDefined();
            expect(status.backupCodesRemaining).toBe(10);
        });

        test('should return disabled status for user without 2FA', () => {
            const status = get2FAStatus('no-2fa-user');

            expect(status.enabled).toBe(false);
        });
    });
});
