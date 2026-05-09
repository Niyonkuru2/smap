// src/services/email/templates.js

/**
 * Email templates for SMPMPS application
 */

// ============================================
// VERIFICATION EMAIL
// ============================================
export const getVerificationTemplate = (userName, verificationCode, language = 'en') => {
    const subjects = {
        en: 'Verify Your Email - SMPMPS',
        fr: 'Vérifiez votre email - SMPMPS',
        rw: 'Emera Imeli Yawe - SMPMPS'
    };

    const templates = {
        en: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Welcome to SMPMPS!</h2>
                    <p>Hi ${userName},</p>
                    <p>Thank you for signing up! Please verify your email address using the code below:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                        ${verificationCode}
                    </div>
                    <p style="margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Smart Market Price Monitoring System</p>
                </div>
            </div>
        `,
        fr: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Bienvenue sur SMPMPS!</h2>
                    <p>Bonjour ${userName},</p>
                    <p>Merci de vous être inscrit! Veuillez vérifier votre adresse email avec le code ci-dessous:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                        ${verificationCode}
                    </div>
                    <p style="margin-top: 20px;">Ce code expirera dans <strong>10 minutes</strong>.</p>
                    <p>Si vous n'avez pas demandé cela, ignorez cet email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Système de Surveillance des Prix du Marché</p>
                </div>
            </div>
        `,
        rw: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Murakaza Neza kuri SMPMPS!</h2>
                    <p>Mwaramutse ${userName},</p>
                    <p>Urakoze kwiyandikisha! Nyamuneka emera imeli yawe ukoreshe kodi ikurikira:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                        ${verificationCode}
                    </div>
                    <p style="margin-top: 20px;">Iyi kodi izashira mu <strong>minota 10</strong>.</p>
                    <p>Niba utabikoze, wirengagize iyi imeli.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Sisitemu yo Gukurikirana Ibiciro ku Isoko</p>
                </div>
            </div>
        `
    };

    return {
        subject: subjects[language] || subjects.en,
        html: templates[language] || templates.en
    };
};

// ============================================
// PASSWORD RESET EMAIL
// ============================================
export const getPasswordResetTemplate = (userName, resetToken, resetCode, language = 'en') => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://smpmps-test.onrender.com';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const subjects = {
        en: 'Reset Your Password - SMPMPS',
        fr: 'Réinitialisez votre mot de passe - SMPMPS',
        rw: 'Subiza Ijambo ryibanga - SMPMPS'
    };

    const templates = {
        en: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #ff9800; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${userName},</p>
                    <p>We received a request to reset your password. Use the code below or click the link:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                        ${resetCode}
                    </div>
                    <p style="margin-top: 15px;">Or click here: <a href="${resetLink}" style="color: #ff9800;">Reset Password</a></p>
                    <p>This link will expire in <strong>1 hour</strong>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Smart Market Price Monitoring System</p>
                </div>
            </div>
        `,
        fr: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #ff9800; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Demande de réinitialisation du mot de passe</h2>
                    <p>Bonjour ${userName},</p>
                    <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Utilisez le code ci-dessous ou cliquez sur le lien:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                        ${resetCode}
                    </div>
                    <p style="margin-top: 15px;">Ou cliquez ici: <a href="${resetLink}" style="color: #ff9800;">Réinitialiser le mot de passe</a></p>
                    <p>Ce lien expirera dans <strong>1 heure</strong>.</p>
                    <p>Si vous n'avez pas demandé cela, ignorez cet email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Système de Surveillance des Prix du Marché</p>
                </div>
            </div>
        `,
        rw: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #ff9800; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Gusaba Gusubiza Ijambo ryibanga</h2>
                    <p>Mwaramutse ${userName},</p>
                    <p>Twakiriye icyifuzo cyo gusubiza ijambo ryibanga ryawe. Koresha kodi ikurikira cyangwa kanda kuri linki:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                        ${resetCode}
                    </div>
                    <p style="margin-top: 15px;">Cankande kanda hano: <a href="${resetLink}" style="color: #ff9800;">Subiza Ijambo ryibanga</a></p>
                    <p>Iyi linki izashira mu <strong>saha 1</strong>.</p>
                    <p>Niba utabikoze, wirengagize iyi imeli.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Sisitemu yo Gukurikirana Ibiciro ku Isoko</p>
                </div>
            </div>
        `
    };

    return {
        subject: subjects[language] || subjects.en,
        html: templates[language] || templates.en
    };
};

// ============================================
// PRICE ALERT EMAIL
// ============================================
export const getPriceAlertTemplate = (userName, alertData) => {
    const { productName, marketName, targetPrice, currentPrice, condition, actionUrl } = alertData;
    
    const direction = condition === 'below' ? 'dropped below' : 'risen above';
    const emoji = condition === 'below' ? '📉' : '📈';
    
    const subject = `Price Alert: ${productName} at ${marketName}`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2196F3; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="color: white; margin: 0;">SMPMPS Price Alert</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                <h2>${emoji} Price Alert Triggered!</h2>
                <p>Hi ${userName},</p>
                <p>The price for <strong>${productName}</strong> at <strong>${marketName}</strong> has ${direction} your target price.</p>
                <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <div style="font-size: 14px; color: #666;">Current Price</div>
                    <div style="font-size: 36px; font-weight: bold; color: #2196F3;">${currentPrice} RWF</div>
                    <div style="font-size: 12px; color: #999; margin-top: 10px;">
                        Target: ${targetPrice} RWF | ${condition === 'below' ? '↓ Below target' : '↑ Above target'}
                    </div>
                </div>
                <p style="margin-top: 20px;">
                    <a href="${actionUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        View Product Details
                    </a>
                </p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">You received this alert because you set a price alert for this product.</p>
                <p style="color: #666; font-size: 12px;">To manage your alerts, visit your dashboard.</p>
            </div>
        </div>
    `;
    
    return { subject, html };
};

// ============================================
// WELCOME EMAIL
// ============================================
export const getWelcomeTemplate = (userName, language = 'en') => {
    const subjects = {
        en: 'Welcome to SMPMPS! Account Verified',
        fr: 'Bienvenue sur SMPMPS! Compte vérifié',
        rw: 'Murakaza Neza kuri SMPMPS! Konti Yawe Yemejwe'
    };

    const templates = {
        en: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">Welcome to SMPMPS!</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Account Verified Successfully!</h2>
                    <p>Hi ${userName},</p>
                    <p>Your email has been verified successfully. Your account is now active.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Browse market prices</li>
                        <li>Set price alerts</li>
                        <li>Track your favorite products</li>
                        <li>Receive real-time price notifications</li>
                    </ul>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL || 'https://smpmps-test.onrender.com'}/dashboard" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Go to Dashboard
                        </a>
                    </p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Smart Market Price Monitoring System</p>
                </div>
            </div>
        `,
        fr: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">Bienvenue sur SMPMPS!</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Compte vérifié avec succès!</h2>
                    <p>Bonjour ${userName},</p>
                    <p>Votre email a été vérifié avec succès. Votre compte est maintenant actif.</p>
                    <p>Vous pouvez maintenant:</p>
                    <ul>
                        <li>Parcourir les prix du marché</li>
                        <li>Définir des alertes de prix</li>
                        <li>Suivre vos produits préférés</li>
                        <li>Recevoir des notifications de prix en temps réel</li>
                    </ul>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL || 'https://smpmps-test.onrender.com'}/dashboard" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Aller au tableau de bord
                        </a>
                    </p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Système de Surveillance des Prix du Marché</p>
                </div>
            </div>
        `,
        rw: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">Murakaza Neza kuri SMPMPS!</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                    <h2>Konti Yawe Yemejwe Neza!</h2>
                    <p>Mwaramutse ${userName},</p>
                    <p>Imeli yawe yemejwe neza. Konti yawe ubu ikora.</p>
                    <p>Ushobora ubu:</p>
                    <ul>
                        <li>Genzura ibiciro by'isoko</li>
                        <li>Gushyiraho ibibazo ku biciro</li>
                        <li>Gukurikira ibicuruzwa ukunda</li>
                        <li>Kwakira amakuru ku biciro ako kanya</li>
                    </ul>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL || 'https://smpmps-test.onrender.com'}/dashboard" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Jya kuri Dashboard
                        </a>
                    </p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Sisitemu yo Gukurikirana Ibiciro ku Isoko</p>
                </div>
            </div>
        `
    };
    
    return {
        subject: subjects[language] || subjects.en,
        html: templates[language] || templates.en
    };
};

// ============================================
// VENDOR CREDENTIALS EMAIL
// ============================================
export const getVendorCredentialsTemplate = (vendorName, email, password, language = 'en') => {
    const subjects = {
        en: 'Your Vendor Account Credentials - SMPMPS',
        fr: 'Vos identifiants de fournisseur - SMPMPS',
        rw: 'Amakuru ya Konti ya Vendor - SMPMPS'
    };

    const templates = {
        en: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Welcome ${vendorName} 👋</h2>
                    <p>Your vendor account has been created successfully.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Login Credentials:</strong></p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>
                    <p style="color: #ff9800;"><strong>⚠️ Please login and change your password immediately.</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Smart Market Price Monitoring System</p>
                </div>
            </div>
        `,
        fr: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Bienvenue ${vendorName} 👋</h2>
                    <p>Votre compte fournisseur a été créé avec succès.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Identifiants de connexion:</strong></p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Mot de passe:</strong> ${password}</p>
                    </div>
                    <p style="color: #ff9800;"><strong>⚠️ Veuillez vous connecter et changer votre mot de passe immédiatement.</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Système de Surveillance des Prix du Marché</p>
                </div>
            </div>
        `,
        rw: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Murakaza neza ${vendorName} 👋</h2>
                    <p>Konti yawe ya vendor yashyizweho neza.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Amakuru yo kwinjira:</strong></p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>
                    <p style="color: #ff9800;"><strong>⚠️ Nyamuneka injira uhite uhindura ijambo ryibanga.</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Sisitemu yo Gukurikirana Ibiciro ku Isoko</p>
                </div>
            </div>
        `
    };

    return {
        subject: subjects[language] || subjects.en,
        html: templates[language] || templates.en
    };
};

// ============================================
// BUSINESS CREDENTIALS EMAIL
// ============================================
export const getBusinessCredentialsTemplate = (businessName, ownerName, email, password, language = 'en') => {
    const subjects = {
        en: 'Your Business Account Credentials - SMPMPS',
        fr: 'Vos identifiants professionnels - SMPMPS',
        rw: 'Amakuru ya Konti y\'Ubucuruzi - SMPMPS'
    };

    const templates = {
        en: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <div style="background-color: #2196F3; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS Business</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Welcome ${ownerName} 👋</h2>
                    <p>Your business account for <strong>${businessName}</strong> has been created successfully.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Login Credentials:</strong></p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>
                    <p style="color: #ff9800;"><strong>⚠️ Please login and change your password immediately.</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Smart Market Price Monitoring System</p>
                </div>
            </div>
        `,
        fr: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <div style="background-color: #2196F3; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS Business</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Bienvenue ${ownerName} 👋</h2>
                    <p>Votre compte professionnel pour <strong>${businessName}</strong> a été créé avec succès.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Identifiants de connexion:</strong></p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Mot de passe:</strong> ${password}</p>
                    </div>
                    <p style="color: #ff9800;"><strong>⚠️ Veuillez vous connecter et changer votre mot de passe immédiatement.</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Système de Surveillance des Prix du Marché</p>
                </div>
            </div>
        `,
        rw: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <div style="background-color: #2196F3; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                    <h1 style="color: white; margin: 0;">SMPMPS Business</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Murakaza neza ${ownerName} 👋</h2>
                    <p>Konti y'ubucuruzi ya <strong>${businessName}</strong> yashyizweho neza.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Amakuru yo kwinjira:</strong></p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>
                    <p style="color: #ff9800;"><strong>⚠️ Nyamuneka injira uhite uhindura ijambo ryibanga.</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">SMPMPS - Sisitemu yo Gukurikirana Ibiciro ku Isoko</p>
                </div>
            </div>
        `
    };

    return {
        subject: subjects[language] || subjects.en,
        html: templates[language] || templates.en
    };
};

// ============================================
// SUBSCRIPTION NOTIFICATION TEMPLATE
// ============================================
export const getSubscriptionNotificationTemplate = (name, planName, action, endDate, reason = null, language = 'en') => {
    const subjects = {
        en: {
            created: 'Subscription Request Received',
            approved: 'Subscription Approved! 🎉',
            rejected: 'Subscription Request Update',
            cancelled: 'Subscription Cancelled',
            expired: 'Subscription Expired'
        },
        fr: {
            created: 'Demande d\'abonnement reçue',
            approved: 'Abonnement approuvé! 🎉',
            rejected: 'Mise à jour de la demande d\'abonnement',
            cancelled: 'Abonnement annulé',
            expired: 'Abonnement expiré'
        },
        rw: {
            created: 'Ubusabe bwa kontrakte bwakiriwe',
            approved: 'Kontrakte yemewe! 🎉',
            rejected: 'Ubusabe bwa kontrakte bwasuzumwe',
            cancelled: 'Kontrakte yahagaritswe',
            expired: 'Kontrakte irangiye'
        }
    };

    const getMessage = () => {
        const messages = {
            en: {
                approved: `<p>Great news! Your <strong>${planName}</strong> subscription has been approved.</p><p>Your subscription is now active and will remain active until <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p><p>Thank you for choosing our service!</p>`,
                rejected: `<p>Your request for the <strong>${planName}</strong> plan has been reviewed.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}<p>Please contact support for assistance.</p>`,
                cancelled: `<p>Your <strong>${planName}</strong> subscription has been cancelled.</p><p>You will have access until <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p>`,
                created: `<p>Your request for the <strong>${planName}</strong> plan has been submitted.</p><p>We will notify you once your subscription is approved.</p>`,
                expired: `<p>Your <strong>${planName}</strong> subscription has expired.</p><p>Please renew to continue enjoying the benefits.</p>`
            },
            fr: {
                approved: `<p>Bonne nouvelle! Votre abonnement <strong>${planName}</strong> a été approuvé.</p><p>Votre abonnement est maintenant actif jusqu'au <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p><p>Merci de choisir notre service!</p>`,
                rejected: `<p>Votre demande d'abonnement <strong>${planName}</strong> a été examinée.</p>${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}<p>Veuillez contacter le support.</p>`,
                cancelled: `<p>Votre abonnement <strong>${planName}</strong> a été annulé.</p><p>Vous aurez accès jusqu'au <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p>`,
                created: `<p>Votre demande d'abonnement <strong>${planName}</strong> a été soumise.</p><p>Nous vous notifierons une fois approuvé.</p>`,
                expired: `<p>Votre abonnement <strong>${planName}</strong> a expiré.</p><p>Veuillez renouveler pour continuer à profiter des avantages.</p>`
            },
            rw: {
                approved: `<p>Amakuru meza! Kontrakte yawe ya <strong>${planName}</strong> yemewe.</p><p>Kontrakte yawe ikora kugeza <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p><p>Urakoze guhitamo serivisi yacu!</p>`,
                rejected: `<p>Ubusabe bwa kontrakte ya <strong>${planName}</strong> bwasuzumwe.</p>${reason ? `<p><strong>Impamvu:</strong> ${reason}</p>` : ''}<p>Nyamuneka wakoranye na support.</p>`,
                cancelled: `<p>Kontrakte yawe ya <strong>${planName}</strong> yahagaritswe.</p><p>Uzakomeza kugera kugeza <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p>`,
                created: `<p>Ubusabe bwa kontrakte ya <strong>${planName}</strong> bwatumwe.</p><p>Tuzakumenyesha iyo kontrakte yemewe.</p>`,
                expired: `<p>Kontrakte yawe ya <strong>${planName}</strong> irangiye.</p><p>Nyamuneka vugurura kugirango ukomeze kubona ibyiza.</p>`
            }
        };
        return messages[language]?.[action] || messages.en[action];
    };

    const actionTitles = {
        en: { approved: 'Subscription Approved! 🎉', rejected: 'Subscription Request Update', cancelled: 'Subscription Cancelled', created: 'Subscription Request Received', expired: 'Subscription Expired' },
        fr: { approved: 'Abonnement approuvé! 🎉', rejected: 'Mise à jour', cancelled: 'Abonnement annulé', created: 'Demande reçue', expired: 'Abonnement expiré' },
        rw: { approved: 'Kontrakte yemewe! 🎉', rejected: 'Ubusabe bwasuzumwe', cancelled: 'Kontrakte yahagaritswe', created: 'Ubusabe bwakiriwe', expired: 'Kontrakte irangiye' }
    };

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${action === 'approved' ? '#4CAF50' : action === 'rejected' ? '#f44336' : '#2196F3'}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="color: white; margin: 0;">SMPMPS</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                <h2>${actionTitles[language]?.[action] || actionTitles.en[action]}</h2>
                <p>Dear ${name},</p>
                ${getMessage()}
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">SMPMPS - Smart Market Price Monitoring System</p>
            </div>
        </div>
    `;

    return {
        subject: subjects[language]?.[action] || subjects.en[action],
        html
    };
};