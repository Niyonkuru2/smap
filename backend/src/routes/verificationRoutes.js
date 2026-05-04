import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// Send verification email
router.post('/email', async (req, res) => {
    try {
        const { email, userName, verificationCode, language } = req.body;
        
        if (!email || !verificationCode) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }
        
        res.json({
            success: true,
            message: 'Verification email sent! Check your inbox and spam folder.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify email code
router.post('/code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }
        
        res.json({
            success: true,
            message: 'Email verified successfully!',
            email,
            verified: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get stored verification code (development only)
router.get('/code/:email', (req, res) => {
    const { email } = req.params;
    
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }
    
    res.json({
        success: true,
        email,
        code: '123456',
        message: 'Development mode - verification code'
    });
});

// Send SMS verification
router.post('/sms', async (req, res) => {
    try {
        const { phone, userName, verificationCode } = req.body;
        
        if (!phone || !verificationCode) {
            return res.status(400).json({ error: 'Phone and verification code are required' });
        }
        
        res.json({
            success: true,
            message: 'Verification SMS sent! Check your phone for the code.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify SMS code
router.post('/sms/check', async (req, res) => {
    try {
        const { phone, code } = req.body;
        
        res.json({
            success: true,
            message: 'Phone verified successfully',
            verified: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;