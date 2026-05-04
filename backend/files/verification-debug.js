// Debug and diagnostics endpoints
app.get('/health/verification', (req, res) => {
    const checks = {
        email: {
            configured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
            provider: process.env.EMAIL_USER || 'NOT_SET',
            transporter: !!transporter
        },
        sms: {
            configured: !!process.env.TWILIO_ACCOUNT_SID || !!process.env.SMS_PROVIDER,
            provider: process.env.SMS_PROVIDER || 'TWILIO',
            twilioConfigured: !!process.env.TWILIO_ACCOUNT_SID
        },
        database: {
            connected: !!db,
            verificationCodesTable: 'verification_codes'
        }
    };

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks
    });
});

// Test verification email endpoint (development only)
app.post('/verify/email/test', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }

    const { email, userName = 'User' } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const testCode = '123456';

    try {
        // Try to store in database
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.verificationCodes.create(email, testCode, expiresAt);
        console.log(`[TEST] Code stored in database for ${email}`);

        // Try to send email
        if (transporter) {
            const info = await transporter.sendMail({
                from: `"SMPMPS Test" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '[TEST] Verification Code - SMPMPS',
                text: `Test verification code: ${testCode}`,
                html: `<h1>Test Code: <strong>${testCode}</strong></h1>`
            });

            console.log(`[TEST] Email sent: ${info.messageId}`);
            return res.json({
                success: true,
                message: 'Test email sent successfully',
                code: testCode,
                messageId: info.messageId
            });
        } else {
            throw new Error('Transporter not initialized');
        }
    } catch (error) {
        console.error('[TEST] Email error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            emailConfigured: !!process.env.EMAIL_USER,
            transporterInitialized: !!transporter,
            devCode: testCode
        });
    }
});

// Improved verify code endpoint with better error messages
app.post('/verify/code', async (req, res) => {
    const { email, code } = req.body;
    
    console.log(`[VERIFY] Code verification attempt for ${email}`);
    
    if (!email || !code) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email and code are required',
            received: { email: !!email, code: !!code }
        });
    }
    
    try {
        const isValid = await db.verificationCodes.verify(email, code);
        
        if (!isValid) {
            console.warn(`[VERIFY] Invalid code for ${email}`);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid or expired verification code. Please request a new one.'
            });
        }

        // Mark user as verified
        const user = await db.users.findByEmail(email);
        if (user) {
            await db.users.update(user.id, { verified: true });
            console.log(`[VERIFY] ✅ User verified: ${email}`);
        }

        res.json({ 
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('[VERIFY] Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: `Verification failed: ${error.message}` 
        });
    }
});

// Improved SMS verification endpoint with better error messages
app.post('/verify/sms/check', (req, res) => {
    const { phone, code } = req.body;
    
    console.log(`[SMS-VERIFY] SMS code verification for ${phone}`);
    
    if (!phone || !code) {
        return res.status(400).json({ 
            success: false, 
            error: 'Phone and code are required',
            received: { phone: !!phone, code: !!code }
        });
    }
    
    // Format phone number
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '+250' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+250' + formattedPhone;
    }
    
    // Validate format
    if (!/^\+250[0-9]{9}$/.test(formattedPhone)) {
        return res.status(400).json({ 
            success: false, 
            error: `Invalid phone format. Expected: 0781234567 or +250781234567. Got: ${formattedPhone}`,
            received: formattedPhone
        });
    }
    
    const stored = verificationCodes.get(formattedPhone);
    
    if (!stored) {
        console.warn(`[SMS-VERIFY] No code found for ${formattedPhone}`);
        return res.status(400).json({ 
            success: false, 
            error: 'No verification code found. Please request a new one.' 
        });
    }
    
    if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(formattedPhone);
        console.warn(`[SMS-VERIFY] Code expired for ${formattedPhone}`);
        return res.status(400).json({ 
            success: false, 
            error: 'Code expired. Please request a new one.' 
        });
    }
    
    if (stored.code !== code) {
        console.warn(`[SMS-VERIFY] Invalid code for ${formattedPhone}`);
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid code. Please try again.' 
        });
    }
    
    // Code is valid - delete it
    verificationCodes.delete(formattedPhone);
    console.log(`[SMS-VERIFY] ✅ SMS verified for ${formattedPhone}`);
    res.json({ 
        success: true, 
        message: 'Phone verified successfully' 
    });
});
