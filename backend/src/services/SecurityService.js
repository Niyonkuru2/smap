class SecurityService {
    isAccountLocked(email) {
        return { locked: false };
    }

    recordLoginAttempt(email, success) {
        return { attempts: 0, remainingAttempts: 5 };
    }

    unlockAccount(email) {
        return { success: true, message: 'Account unlocked' };
    }

    generateCaptcha() {
        return {
            captchaId: 'test-' + Date.now(),
            question: '1 + 1 = ?',
            expiresIn: 300
        };
    }

    verifyCaptcha(captchaId, answer) {
        return { success: answer === '2', message: answer === '2' ? 'Verified' : 'Invalid' };
    }

    sendPhoneVerification(phoneNumber) {
        return { success: true, message: 'Code sent' };
    }

    verifyPhoneCode(phoneNumber, code) {
        return { success: true, message: 'Verified' };
    }

    verifyLocation(latitude, longitude, marketName) {
        return { success: true, verified: true, trustBonus: 10 };
    }

    blockIP(ip, duration, reason) {
        return { success: true };
    }

    unblockIP(ip) {
        return { success: true };
    }

    isIPBlocked(ip) {
        return false;
    }

    getBlockedIPs() {
        return [];
    }

    clearBlockedIPs() {
        return { success: true, cleared: 0 };
    }

    getSecurityStatus() {
        return {
            blockedIPs: 0,
            lockedAccounts: 0,
            maxLoginAttempts: 5,
            lockoutDurationMinutes: 15
        };
    }
}

export default new SecurityService();