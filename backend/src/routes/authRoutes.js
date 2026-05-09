import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/send-verification', authController.sendVerificationEmail);
router.post('/verify-code', authController.verifyEmailCode);
router.post('/register', authController.completeRegistration);
router.post('/login', authController.login);
router.post('/resend-verification', authController.resendVerificationCode);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-reset-code', authController.verifyResetCode);

// Add logout route (public - no authentication required)
router.post('/logout', (req, res) => {
    // For JWT-based auth, logout is handled client-side
    // The client removes the token from localStorage
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Protected routes (require authentication)
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

export default router;