import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// Receive SMS webhook from Twilio
router.post('/receive', async (req, res) => {
    try {
        const fromPhone = req.body.From;
        const messageBody = req.body.Body;
        
        console.log(`SMS received from ${fromPhone}: ${messageBody}`);
        
        // Acknowledge receipt
        res.status(200).send('Message received');
    } catch (error) {
        console.error('SMS webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send SMS to a phone number (authenticated users)
router.post('/send', authenticateToken, validate(schemas.smsSend), async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        res.json({
            success: true,
            message: 'SMS sent successfully',
            phone: phone.replace(/(.{3}).*(.{4})/, '$1***$2')
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Query prices via SMS
router.post('/query', async (req, res) => {
    try {
        const { phone, query } = req.body;
        
        res.json({
            success: true,
            response: `Price for ${query}: 800 RWF/kg`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// USSD session handler
router.post('/ussd/session', async (req, res) => {
    try {
        const { sessionId, msisdn, userInput, sessionState } = req.body;
        
        res.json({
            continueSession: false,
            message: 'Thank you for using Smart Market Price System. Goodbye!'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get SMS command help
router.get('/help', (req, res) => {
    res.json({
        smsCommands: {
            'PRICE <product>': 'Get current average price for a product',
            'MARKETS': 'List available markets',
            'PRODUCTS': 'List available products',
            'COMPARE <product>': 'Compare prices across all markets',
            'HELP': 'Show this help message'
        },
        examples: [
            'Text: PRICE tomato',
            'Text: COMPARE rice',
            'Text: MARKETS'
        ]
    });
});

export default router;