import USSDService from '../services/ussdService.js';

/**
 * Handle USSD callback from African Talking
 * Returns plain text starting with CON (continue) or END (terminate)
 */
export const handleUSSDCallback = async (req, res) => {
    try {
        const {
            sessionId,
            phoneNumber,
            text,
            networkCode,
            serviceCode
        } = req.body;

        // Log for debugging (will show actual values now)
        console.log('USSD Request:', {
            sessionId,
            phoneNumber,
            text,
            networkCode,
            serviceCode
        });

        // Process the request – all logic is inside USSDService (stateless)
        const response = await USSDService.handleUSSDRequest(
            sessionId,
            phoneNumber,
            text || ''   // ensure string
        );

        // African Talking expects plain text with CON or END prefix
        const prefix = response.type === 'end' ? 'END' : 'CON';
        const reply = `${prefix} ${response.message}`;

        res.set('Content-Type', 'text/plain');
        res.status(200).send(reply);
    } catch (error) {
        console.error('USSD Callback Error:', error);
        // Always return a plain text END message on error
        res.set('Content-Type', 'text/plain');
        res.status(200).send('END Sorry, an error occurred. Please try again later.');
    }
};

/**
 * Test endpoint for development (still returns JSON)
 */
export const testUSSD = async (req, res) => {
    const { phoneNumber, text } = req.body;
    try {
        const response = await USSDService.handleUSSDRequest(
            `test_${Date.now()}`,
            phoneNumber || '250788123456',
            text || ''
        );
        res.json({ success: true, response });
    } catch (error) {
        console.error('Test USSD Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};