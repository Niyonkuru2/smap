import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get community verification status for a price
router.get('/status/:priceId', optionalAuth, async (req, res) => {
    try {
        // This would fetch from your community verification service
        res.json({
            success: true,
            priceId: req.params.priceId,
            communityScore: { confirmations: 0, disputes: 0, status: 'unverified' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify a price (confirm or dispute)
router.post('/verify/:priceId', authenticateToken, validate(schemas.communityVerify), async (req, res) => {
    try {
        const { priceId } = req.params;
        const { action, reason } = req.body;
        
        // Process verification
        res.json({
            success: true,
            message: action === 'confirm' ? 'Price confirmed!' : 'Price disputed - thank you for reporting',
            verification: { priceId, action, reason, timestamp: new Date() }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dispute reasons
router.get('/dispute-reasons', (req, res) => {
    const reasons = [
        { code: 'price_too_high', label: 'Price is higher than actual market price' },
        { code: 'price_too_low', label: 'Price is lower than actual market price' },
        { code: 'wrong_product', label: 'Wrong product information' },
        { code: 'wrong_market', label: 'Wrong market location' },
        { code: 'outdated', label: 'Price is outdated' },
        { code: 'fake', label: 'Suspicious/fake submission' },
        { code: 'other', label: 'Other reason' }
    ];
    res.json({ success: true, reasons });
});

// Get verification leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        res.json({
            success: true,
            title: 'Top Community Verifiers',
            leaderboard: []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if user can verify a price
router.get('/can-verify/:priceId', authenticateToken, async (req, res) => {
    try {
        res.json({ canVerify: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;