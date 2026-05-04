import express from 'express';

const router = express.Router();

// Public routes - simple responses
router.post('/signup', (req, res) => {
    res.json({ message: 'Signup endpoint - coming soon', status: 'pending' });
});

router.post('/login', (req, res) => {
    res.json({ message: 'Login endpoint - coming soon', status: 'pending' });
});

router.post('/send-verification-email', (req, res) => {
    res.json({ message: 'Verification email would be sent', success: true });
});

router.post('/verify-email-code', (req, res) => {
    res.json({ message: 'Email verified', success: true });
});

router.post('/complete-signup', (req, res) => {
    res.json({ message: 'Signup completed', success: true });
});

router.post('/forgot-password', (req, res) => {
    res.json({ message: 'Password reset email sent', success: true });
});

router.post('/reset-password', (req, res) => {
    res.json({ message: 'Password reset', success: true });
});

router.get('/verify-reset-token/:token', (req, res) => {
    res.json({ valid: true });
});

// Protected routes
router.post('/change-password', (req, res) => {
    res.json({ message: 'Password changed', success: true });
});

router.get('/profile', (req, res) => {
    res.json({ user: { id: 1, name: 'Test User', email: 'test@example.com' } });
});

router.post('/profile/update', (req, res) => {
    res.json({ message: 'Profile updated', success: true });
});

// 2FA routes
router.post('/2fa/setup', (req, res) => {
    res.json({ secret: 'TEST123456', otpauthUrl: 'otpauth://...', success: true });
});

router.post('/2fa/verify-setup', (req, res) => {
    res.json({ success: true, message: '2FA enabled' });
});

router.post('/2fa/verify', (req, res) => {
    res.json({ success: true });
});

router.post('/2fa/disable', (req, res) => {
    res.json({ success: true });
});

router.get('/2fa/status', (req, res) => {
    res.json({ enabled: false });
});

router.post('/2fa/backup-codes', (req, res) => {
    res.json({ backupCodes: ['ABCD-1234', 'EFGH-5678'], success: true });
});

export default router;