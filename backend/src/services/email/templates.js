/**
 * Email templates for SMPMPS application
 */

/**
 * Get verification email content
 * @param {string} userName - User's name
 * @param {string} verificationCode - 6-digit verification code
 * @param {string} language - Language preference (en, fr, rw)
 * @returns {Object} Subject and HTML content
 */
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

/**
 * Get password reset email content
 * @param {string} userName - User's name
 * @param {string} resetToken - Password reset token
 * @param {string} resetCode - 6-digit reset code
 * @param {string} language - Language preference
 * @returns {Object} Subject and HTML content
 */
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

/**
 * Get price alert email content
 * @param {string} userName - User's name
 * @param {Object} alertData - Alert information
 * @returns {Object} Subject and HTML content
 */
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
    
    return {
        subject,
        html
    };
};

/**
 * Get welcome email content (after verification)
 * @param {string} userName - User's name
 * @param {string} language - Language preference
 * @returns {Object} Subject and HTML content
 */
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

/**
 * Get vendor credentials email content
 */
export const getVendorCredentialsTemplate = (
  userName,
  email,
  password,
  language = 'en'
) => {
  const subjects = {
    en: 'Your Vendor Account Credentials - SMPMPS',
    fr: 'Vos identifiants de fournisseur - SMPMPS',
    rw: 'Amakuru ya Konti ya Vendor - SMPMPS'
  };

  const templates = {
    en: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome ${userName} 👋</h2>
        <p>Your vendor account has been created successfully.</p>

        <p><strong>Login Credentials:</strong></p>
        <ul>
          <li>Email: ${email}</li>
          <li>Password: ${password}</li>
        </ul>

        <p>Please login and <strong>change your password immediately</strong>.</p>
      </div>
    `,
    fr: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Bienvenue ${userName} 👋</h2>
        <p>Votre compte fournisseur a été créé avec succès.</p>

        <p><strong>Identifiants de connexion :</strong></p>
        <ul>
          <li>Email : ${email}</li>
          <li>Mot de passe : ${password}</li>
        </ul>

        <p>Veuillez vous connecter et <strong>changer votre mot de passe immédiatement</strong>.</p>
      </div>
    `,
    rw: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Murakaza neza ${userName} 👋</h2>
        <p>Konti yawe ya vendor yashyizweho neza.</p>

        <p><strong>Amakuru yo kwinjira:</strong></p>
        <ul>
          <li>Email: ${email}</li>
          <li>Password: ${password}</li>
        </ul>

        <p>Nyamuneka injira uhite uhindura ijambo ryibanga.</p>
      </div>
    `
  };

  return {
    subject: subjects[language] || subjects.en,
    html: templates[language] || templates.en
  };
};