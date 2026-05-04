/**
 * Two-Factor Authentication Module
 * TOTP-based 2FA for admin accounts
 */

import crypto from 'crypto';

// In-memory storage for 2FA secrets (use database in production)
const twoFactorSecrets = new Map(); // userId -> { secret, enabled, backupCodes }
const pendingSetups = new Map(); // userId -> { secret, createdAt }

// TOTP configuration
const TOTP_CONFIG = {
    digits: 6,
    period: 30, // seconds
    algorithm: 'sha1'
};

/**
 * Generate a random base32 secret
 */
function generateSecret() {
    const buffer = crypto.randomBytes(20);
    return base32Encode(buffer);
}

/**
 * Base32 encoding
 */
function base32Encode(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let result = '';
    
    for (const byte of buffer) {
        bits += byte.toString(2).padStart(8, '0');
    }
    
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.slice(i, i + 5).padEnd(5, '0');
        result += alphabet[parseInt(chunk, 2)];
    }
    
    return result;
}

/**
 * Base32 decoding
 */
function base32Decode(str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    for (const char of str.toUpperCase()) {
        const index = alphabet.indexOf(char);
        if (index === -1) continue;
        bits += index.toString(2).padStart(5, '0');
    }
    
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    
    return Buffer.from(bytes);
}

/**
 * Generate TOTP code
 */
function generateTOTP(secret, timestamp = Date.now()) {
    const time = Math.floor(timestamp / 1000 / TOTP_CONFIG.period);
    const timeBuffer = Buffer.alloc(8);
    
    // Write time as big-endian 64-bit integer
    timeBuffer.writeBigInt64BE(BigInt(time));
    
    const secretBuffer = base32Decode(secret);
    const hmac = crypto.createHmac(TOTP_CONFIG.algorithm, secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const code = (
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)
    ) % Math.pow(10, TOTP_CONFIG.digits);
    
    return code.toString().padStart(TOTP_CONFIG.digits, '0');
}

/**
 * Verify TOTP code (with time window tolerance)
 */
function verifyTOTP(secret, code, windowSize = 1) {
    const now = Date.now();
    
    // Check current and adjacent time windows
    for (let i = -windowSize; i <= windowSize; i++) {
        const checkTime = now + (i * TOTP_CONFIG.period * 1000);
        const expectedCode = generateTOTP(secret, checkTime);
        
        if (expectedCode === code) {
            return { valid: true, window: i };
        }
    }
    
    return { valid: false };
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
}

/**
 * Start 2FA setup for a user
 */
function initiate2FASetup(userId, userEmail) {
    const secret = generateSecret();
    
    pendingSetups.set(userId, {
        secret,
        createdAt: Date.now(),
        email: userEmail
    });
    
    // Clean up after 10 minutes
    setTimeout(() => pendingSetups.delete(userId), 10 * 60 * 1000);
    
    // Generate otpauth URL for QR code
    const otpauthUrl = `otpauth://totp/RwandaMarket:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=RwandaMarket&digits=${TOTP_CONFIG.digits}&period=${TOTP_CONFIG.period}`;
    
    return {
        success: true,
        secret,
        otpauthUrl,
        qrCodeData: otpauthUrl,
        message: 'Scan the QR code with your authenticator app, then enter the code to verify'
    };
}

/**
 * Complete 2FA setup by verifying the first code
 */
function complete2FASetup(userId, code) {
    const pending = pendingSetups.get(userId);
    
    if (!pending) {
        return { success: false, error: '2FA setup not initiated or expired' };
    }
    
    const verification = verifyTOTP(pending.secret, code);
    
    if (!verification.valid) {
        return { success: false, error: 'Invalid verification code' };
    }
    
    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    
    // Store 2FA configuration
    twoFactorSecrets.set(userId, {
        secret: pending.secret,
        enabled: true,
        enabledAt: new Date().toISOString(),
        backupCodes: backupCodes.map(code => ({ code, used: false })),
        lastUsed: null
    });
    
    // Clean up pending
    pendingSetups.delete(userId);
    
    return {
        success: true,
        message: '2FA enabled successfully',
        backupCodes,
        warning: 'Save these backup codes in a safe place. Each code can only be used once.'
    };
}

/**
 * Verify 2FA code during login
 */
function verify2FA(userId, code) {
    const config = twoFactorSecrets.get(userId);
    
    if (!config || !config.enabled) {
        return { success: true, required: false };
    }
    
    // Try TOTP first
    const totpResult = verifyTOTP(config.secret, code);
    
    if (totpResult.valid) {
        config.lastUsed = new Date().toISOString();
        twoFactorSecrets.set(userId, config);
        return { success: true, method: 'totp' };
    }
    
    // Try backup codes
    const formattedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const backupCode = config.backupCodes.find(bc => 
        !bc.used && bc.code.replace('-', '') === formattedCode
    );
    
    if (backupCode) {
        backupCode.used = true;
        backupCode.usedAt = new Date().toISOString();
        config.lastUsed = new Date().toISOString();
        twoFactorSecrets.set(userId, config);
        
        const remainingCodes = config.backupCodes.filter(bc => !bc.used).length;
        
        return {
            success: true,
            method: 'backup',
            warning: remainingCodes <= 3 
                ? `Only ${remainingCodes} backup codes remaining. Consider generating new ones.`
                : null
        };
    }
    
    return { success: false, error: 'Invalid 2FA code' };
}

/**
 * Check if user has 2FA enabled
 */
function is2FAEnabled(userId) {
    const config = twoFactorSecrets.get(userId);
    return config?.enabled || false;
}

/**
 * Disable 2FA for a user
 */
function disable2FA(userId, code) {
    const config = twoFactorSecrets.get(userId);
    
    if (!config || !config.enabled) {
        return { success: false, error: '2FA is not enabled' };
    }
    
    // Require valid code to disable
    const verification = verify2FA(userId, code);
    
    if (!verification.success) {
        return { success: false, error: 'Invalid verification code' };
    }
    
    twoFactorSecrets.delete(userId);
    
    return { success: true, message: '2FA has been disabled' };
}

/**
 * Regenerate backup codes
 */
function regenerateBackupCodes(userId, code) {
    const config = twoFactorSecrets.get(userId);
    
    if (!config || !config.enabled) {
        return { success: false, error: '2FA is not enabled' };
    }
    
    // Verify current code
    const totpResult = verifyTOTP(config.secret, code);
    
    if (!totpResult.valid) {
        return { success: false, error: 'Invalid verification code' };
    }
    
    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(10);
    config.backupCodes = newBackupCodes.map(c => ({ code: c, used: false }));
    twoFactorSecrets.set(userId, config);
    
    return {
        success: true,
        backupCodes: newBackupCodes,
        message: 'New backup codes generated. Previous codes are no longer valid.'
    };
}

/**
 * Get 2FA status for a user
 */
function get2FAStatus(userId) {
    const config = twoFactorSecrets.get(userId);
    
    if (!config) {
        return {
            enabled: false,
            setupRequired: false
        };
    }
    
    return {
        enabled: config.enabled,
        enabledAt: config.enabledAt,
        lastUsed: config.lastUsed,
        backupCodesRemaining: config.backupCodes.filter(bc => !bc.used).length
    };
}

/**
 * Express middleware for 2FA verification
 */
function require2FA(req, res, next) {
    const userId = req.user?.id;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const config = twoFactorSecrets.get(userId);
    
    // If 2FA not enabled, skip
    if (!config?.enabled) {
        return next();
    }
    
    // Check for 2FA token in header
    const twoFactorCode = req.headers['x-2fa-code'];
    
    if (!twoFactorCode) {
        return res.status(403).json({
            error: '2FA verification required',
            requires2FA: true
        });
    }
    
    const verification = verify2FA(userId, twoFactorCode);
    
    if (!verification.success) {
        return res.status(403).json({
            error: verification.error,
            requires2FA: true
        });
    }
    
    req.twoFactorVerified = true;
    next();
}

export {
    generateSecret,
    generateTOTP,
    verifyTOTP,
    generateBackupCodes,
    initiate2FASetup,
    complete2FASetup,
    verify2FA,
    is2FAEnabled,
    disable2FA,
    regenerateBackupCodes,
    get2FAStatus,
    require2FA
};
