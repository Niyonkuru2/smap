import USSDService from '../services/ussdService.js';

/**
 * Handle USSD callback from African Talking
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

        // Log incoming request
        console.log('USSD Request:', {
            sessionId,
            phoneNumber,
            text,
            networkCode,
            serviceCode
        });

        // Process USSD request
        const response = await USSDService.handleUSSDRequest(
            sessionId,
            phoneNumber,
            text
        );

        // Format response for African Talking
        const responseBody = {
            sessionId: sessionId,
            serviceCode: serviceCode,
            phoneNumber: phoneNumber,
            text: response.message
        };

        if (response.type === 'end') {
            return res.status(200).send(responseBody);
        }

        return res.status(200).send(responseBody);
        
    } catch (error) {
        console.error('USSD Callback Error:', error);
        
        // Send error response
        return res.status(200).json({
            sessionId: req.body.sessionId,
            serviceCode: req.body.serviceCode,
            phoneNumber: req.body.phoneNumber,
            text: 'Sorry, an error occurred. Please try again later.'
        });
    }
};

/**
 * Test USSD endpoint (for development)
 */
export const testUSSD = async (req, res) => {
    const { phoneNumber, text } = req.body;
    
    try {
        const response = await USSDService.handleUSSDRequest(
            `test_${Date.now()}`,
            phoneNumber || '250788123456',
            text || ''
        );
        
        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Test USSD Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};