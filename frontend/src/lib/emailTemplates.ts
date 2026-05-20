// Enhanced Email Templates with Multi-Language Support
// Smart Market Price Monitoring and Prediction System (SMPPMS)

export type EmailLanguage = 'en' | 'rw' | 'fr';

interface EmailTranslations {
  subject: string;
  greeting: string;
  welcomeMessage: string;
  codeLabel: string;
  expiryWarning: string;
  howToVerifyTitle: string;
  howToVerifySteps: string[];
  securityNotice: string;
  didntRequestNotice: string;
  supportTitle: string;
  supportEmail: string;
  supportPhone: string;
  footer: string;
  privacyPolicy: string;
  termsOfService: string;
  allRightsReserved: string;
  featuresTitle: string;
  features: string[];
}

export const emailTranslations: Record<EmailLanguage, EmailTranslations> = {
  en: {
    subject: '🔐 Verify Your Email - SMPPMS',
    greeting: 'Hello',
    welcomeMessage: 'Welcome to Smart Market Price Monitoring and Prediction System! To complete your registration and start comparing prices across Rwanda\'s markets, please verify your email address.',
    codeLabel: 'Your Verification Code',
    expiryWarning: 'Important: This code will expire in',
    howToVerifyTitle: '📋 How to Verify:',
    howToVerifySteps: [
      'Return to the SMPPMS app',
      'Enter the 6-digit code shown above',
      'Click the "Verify Email" button',
      'Start exploring market prices!'
    ],
    securityNotice: '🔒 Security Notice: We will never ask for your password via email.',
    didntRequestNotice: 'If you didn\'t request this verification, please ignore this email or contact our support team.',
    supportTitle: 'Having trouble? Contact our support team:',
    supportEmail: 'support@rwandaprices.com',
    supportPhone: '+250 788 000 000',
    footer: 'SMPPMS. All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    allRightsReserved: 'All rights reserved',
    featuresTitle: 'Once verified, you\'ll be able to:',
    features: [
      'Compare prices across Rwanda\'s markets',
      'Track price trends and history',
      'Set up price alerts',
      'Save favorite products',
      'Access market insights'
    ]
  },
  rw: {
    subject: '🔐 Emeza Email Yawe - SMPPMS',
    greeting: 'Muraho',
    welcomeMessage: 'Murakaza neza kuri SMPPMS! Kugirango urangize kwiyandikisha no gutangira kugereranya ibiciro mu masoko ya Rwanda, nyamuneka emeza email yawe.',
    codeLabel: 'Kode Yawe yo Kwemeza',
    expiryWarning: 'Ngombwa: Iyi kode izarangira mu',
    howToVerifyTitle: '📋 Uburyo bwo Kwemeza:',
    howToVerifySteps: [
      'Subira kuri porogaramu ya SMPPMS',
      'Injiza kode y\'imibare 6 yerekanwe hejuru',
      'Kanda buto itwa "Emeza Email"',
      'Tangira gushakisha ibiciro by\'isoko!'
    ],
    securityNotice: '🔒 Inyishu: Ntuzigera tubaza ijambo ryawe ry\'ibanga kuri email.',
    didntRequestNotice: 'Niba utarasaba iyi kwemeza, nyamuneka wirengagize iyi email cyangwa uhamagare itsinda ryacu ry\'ubufasha.',
    supportTitle: 'Ufite ibibazo? Hamagara itsinda ryacu ry\'ubufasha:',
    supportEmail: 'support@rwandaprices.com',
    supportPhone: '+250 788 000 000',
    footer: 'SMPPMS. Uburenganzira bwose burabungabungwa.',
    privacyPolicy: 'Politiki y\'Ibanga',
    termsOfService: 'Amabwiriza y\'Ikoranabuhanga',
    allRightsReserved: 'Uburenganzira bwose burabungabungwa',
    featuresTitle: 'Iyo womeje, uzashobora:',
    features: [
      'Kugereranya ibiciro mu masoko ya Rwanda',
      'Gukurikirana ibiciro n\'amateka yabyo',
      'Gushyiraho iburira ry\'ibiciro',
      'Kubika ibicuruzwa ukundaa',
      'Kubona amakuru y\'isoko'
    ]
  },
  fr: {
    subject: '🔐 Vérifiez Votre Email - SMPPMS',
    greeting: 'Bonjour',
    welcomeMessage: 'Bienvenue au Système de Suivi et Prédiction des Prix du Marché! Pour compléter votre inscription et commencer à comparer les prix sur les marchés du Rwanda, veuillez vérifier votre adresse email.',
    codeLabel: 'Votre Code de Vérification',
    expiryWarning: 'Important: Ce code expirera dans',
    howToVerifyTitle: '📋 Comment Vérifier:',
    howToVerifySteps: [
      'Retournez à l\'application SMPPMS',
      'Entrez le code à 6 chiffres affiché ci-dessus',
      'Cliquez sur le bouton "Vérifier l\'Email"',
      'Commencez à explorer les prix du marché!'
    ],
    securityNotice: '🔒 Avis de Sécurité: Nous ne vous demanderons jamais votre mot de passe par email.',
    didntRequestNotice: 'Si vous n\'avez pas demandé cette vérification, veuillez ignorer cet email ou contacter notre équipe d\'assistance.',
    supportTitle: 'Besoin d\'aide? Contactez notre équipe d\'assistance:',
    supportEmail: 'support@rwandaprices.com',
    supportPhone: '+250 788 000 000',
    footer: 'SMPPMS. Tous droits réservés.',
    privacyPolicy: 'Politique de Confidentialité',
    termsOfService: 'Conditions d\'Utilisation',
    allRightsReserved: 'Tous droits réservés',
    featuresTitle: 'Une fois vérifié, vous pourrez:',
    features: [
      'Comparer les prix sur les marchés du Rwanda',
      'Suivre les tendances et l\'historique des prix',
      'Configurer des alertes de prix',
      'Enregistrer vos produits préférés',
      'Accéder aux informations du marché'
    ]
  }
};

/**
 * Generate HTML template for verification email with multi-language support
 */
export function generateVerificationEmailHTML(
  userName: string,
  verificationCode: string,
  language: EmailLanguage = 'en',
  expiryMinutes: number = 1
): string {
  const t = emailTranslations[language];
  
  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #eee;
      background-color: hsl(160, 40%, 15%);
      margin: 0;
      padding: 20px;
    }
    .email-wrapper {
      background-color: hsl(160, 40%, 15%);
      padding: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: hsl(160, 40%, 22%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      padding: 50px 30px;
      text-align: center;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1%, transparent 1%);
      background-size: 50px 50px;
      animation: pulse 15s linear infinite;
    }
    @keyframes pulse {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
      animation: bounce 2s ease infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #333;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #666;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .code-container {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border-radius: 16px;
      padding: 40px 30px;
      text-align: center;
      margin: 35px 0;
      box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3);
      position: relative;
      overflow: hidden;
    }
    .code-container::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #059669, #047857, #059669, #047857);
      background-size: 400% 400%;
      border-radius: 16px;
      z-index: -1;
      animation: gradient 3s ease infinite;
    }
    @keyframes gradient {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .code-label {
      font-size: 14px;
      color: white;
      opacity: 0.95;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
    }
    .code {
      font-size: 56px;
      font-weight: 900;
      color: white;
      letter-spacing: 16px;
      font-family: 'Courier New', monospace;
      margin: 15px 0;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.5s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .expiry {
      background: linear-gradient(135deg, #DCFCE7 0%, #BBFBE1 100%);
      border-left: 5px solid #10B981;
      padding: 18px 20px;
      margin: 30px 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
    }
    .expiry strong {
      color: #059669;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .instructions {
      background: linear-gradient(135deg, #DCFCE7 0%, #BBFBE1 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      border: 2px solid #10B981;
    }
    .instructions h3 {
      margin: 0 0 20px;
      color: #10B981;
      font-size: 18px;
      font-weight: 700;
    }
    .instructions ol {
      margin: 0;
      padding-left: 25px;
      color: #555;
    }
    .instructions li {
      margin: 12px 0;
      font-size: 15px;
      line-height: 1.6;
    }
    .security-note {
      background: linear-gradient(135deg, #DCFCE7 0%, #BBFBE1 100%);
      border-left: 5px solid #10B981;
      padding: 18px 20px;
      margin: 30px 0;
      border-radius: 8px;
      font-size: 14px;
      color: #059669;
      line-height: 1.7;
    }
    .security-note strong {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
    }
    .divider {
      height: 2px;
      background: linear-gradient(to right, transparent, rgba(16, 185, 129, 0.3), transparent);
      margin: 35px 0;
    }
    .support-section {
      text-align: center;
      background: hsl(160, 40%, 28%);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
    }
    .support-section p {
      color: #ccc;
      font-size: 14px;
      margin: 8px 0;
    }
    .support-section a {
      color: #10B981;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }
    .support-section a:hover {
      color: #059669;
      text-decoration: underline;
    }
    .footer {
      background: hsl(160, 40%, 16%);
      color: #e0e0e0;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 8px 0;
      opacity: 0.9;
    }
    .footer a {
      color: #10B981;
      text-decoration: none;
      margin: 0 10px;
      transition: color 0.3s;
    }
    .footer a:hover {
      color: #059669;
      text-decoration: underline;
    }
    .features-list {
      background: #FFFFFF;
      border: 2px solid #E8F5E9;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .features-list h4 {
      color: #10B981;
      margin: 0 0 15px;
      font-size: 16px;
    }
    .features-list ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features-list li {
      padding: 10px 0;
      color: #555;
      font-size: 14px;
      border-bottom: 1px solid #F0F0F0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .features-list li:last-child {
      border-bottom: none;
    }
    .features-list li::before {
      content: '✓';
      display: inline-block;
      width: 24px;
      height: 24px;
      background: #10B981;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-weight: bold;
      flex-shrink: 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 22px;
      }
      .content {
        padding: 30px 20px;
      }
      .code {
        font-size: 40px;
        letter-spacing: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="header-content">
          <div class="logo">🛒</div>
          <h1>SMPPMS</h1>
          <p>${t.subject.split(' - ')[0]}</p>
        </div>
      </div>
      
      <div class="content">
        <div class="greeting">
          ${t.greeting} <strong>${userName}</strong>,
        </div>
        
        <div class="message">
          ${t.welcomeMessage}
        </div>
        
        <div class="code-container">
          <div class="code-label">${t.codeLabel}</div>
          <div class="code">${verificationCode}</div>
        </div>
        
        <div class="expiry">
          <strong>⏰ ${t.expiryWarning} <span style="color: #059669;">${expiryMinutes} ${expiryMinutes !== 1 ? (language === 'fr' ? 'minutes' : language === 'rw' ? 'iminota' : 'minutes') : (language === 'fr' ? 'minute' : language === 'rw' ? 'umunota' : 'minute')}</span>. ${language === 'en' ? 'Please use it immediately.' : language === 'rw' ? 'Nyamuneka yikoreshe ako kanya.' : 'Veuillez l\'utiliser immédiatement.'}</strong>
        </div>
        
        <div class="instructions">
          <h3>${t.howToVerifyTitle}</h3>
          <ol>
            ${t.howToVerifySteps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
        
        <div class="features-list">
          <h4>${t.featuresTitle}</h4>
          <ul>
            ${t.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
        
        <div class="security-note">
          <strong>${t.securityNotice}</strong><br>
          ${t.didntRequestNotice}
        </div>
        
        <div class="divider"></div>
        
        <div class="support-section">
          <p><strong>${t.supportTitle}</strong></p>
          <p>📧 <a href="mailto:${t.supportEmail}">${t.supportEmail}</a></p>
          <p>📱 <a href="tel:${t.supportPhone}">${t.supportPhone}</a></p>
        </div>
      </div>
      
      <div class="footer">
        <p>
          <strong>© 2024 ${t.footer}</strong>
        </p>
        <p>
          Kigali, Rwanda
        </p>
        <p>
          <a href="#">${t.privacyPolicy}</a> | 
          <a href="#">${t.termsOfService}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate welcome email HTML template
 */
export function generateWelcomeEmailHTML(
  userName: string,
  language: EmailLanguage = 'en'
): string {
  const t = emailTranslations[language];
  const welcomeSubject = language === 'en' ? '🎉 Welcome to SMPPMS!' :
                        language === 'rw' ? '🎉 Murakaza Neza kuri SMPPMS!' :
                        '🎉 Bienvenue au SMPPMS!';
  
  const welcomeTitle = language === 'en' ? 'Welcome!' :
                       language === 'rw' ? 'Murakaza Neza!' :
                       'Bienvenue!';
  
  const verifiedMessage = language === 'en' ? 'Your email has been successfully verified! You now have full access to all features:' :
                         language === 'rw' ? 'Email yawe yemewe neza! Ubu ufite uburenganzira bwuzuye kuri ibi bikurikira:' :
                         'Votre email a été vérifié avec succès! Vous avez maintenant un accès complet à toutes les fonctionnalités:';
  
  const startExploring = language === 'en' ? 'Start exploring and find the best prices in your area!' :
                        language === 'rw' ? 'Tangira gushakisha ubone ibiciro byiza mu gace kawe!' :
                        'Commencez à explorer et trouvez les meilleurs prix dans votre région!';

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${welcomeSubject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #eee;
      background-color: hsl(160, 40%, 15%);
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: hsl(160, 40%, 22%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      padding: 50px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
      color: #eee;
    }
    .success-icon {
      text-align: center;
      font-size: 80px;
      margin: 20px 0;
      animation: bounce 1s ease;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    h2 {
      color: #10B981;
      margin: 0 0 20px;
    }
    .features {
      background: hsl(160, 40%, 30%);
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features li {
      padding: 12px 0;
      color: #ddd;
      font-size: 15px;
      border-bottom: 1px solid rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .features li:last-child {
      border-bottom: none;
    }
    .features li::before {
      content: '✓';
      width: 28px;
      height: 28px;
      background: #10B981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 25px 0;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background: hsl(160, 40%, 16%);
      color: #e0e0e0;
      padding: 25px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 5px 0;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 SMPPMS</h1>
    </div>
    
    <div class="content">
      <div class="success-icon">✓</div>
      
      <h2>${t.greeting} ${userName}!</h2>
      
      <p style="font-size: 18px; color: #555; margin-bottom: 20px;">
        ${verifiedMessage}
      </p>
      
      <div class="features">
        <ul>
          ${t.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>
      
      <p style="text-align: center; font-size: 16px; color: #666; margin: 30px 0;">
        ${startExploring}
      </p>
      
      <div style="text-align: center;">
        <a href="#" class="cta-button">${language === 'en' ? 'Get Started' : language === 'rw' ? 'Tangira' : 'Commencer'}</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>© 2024 ${t.footer}</strong></p>
      <p>Kigali, Rwanda</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate 2FA email template
 */
export function generate2FAEmailHTML(
  userName: string,
  code: string,
  language: EmailLanguage = 'en'
): string {
  const subject = language === 'en' ? '🔐 Two-Factor Authentication Code' :
                 language === 'rw' ? '🔐 Kode yo Kwemeza Inshuro Ebyiri' :
                 '🔐 Code d\'Authentification à Deux Facteurs';
  
  const greeting = emailTranslations[language].greeting;
  
  const message = language === 'en' ? 'Someone is trying to log into your account. If this was you, use the code below to complete the login:' :
                 language === 'rw' ? 'Umuntu ageza kuri konti yawe. Niba ari wowe, koresha iyi kode kugirango urangize kwinjira:' :
                 'Quelqu\'un essaie de se connecter à votre compte. Si c\'était vous, utilisez le code ci-dessous pour terminer la connexion:';
  
  const notYouMessage = language === 'en' ? 'If this wasn\'t you, please secure your account immediately by changing your password.' :
                       language === 'rw' ? 'Niba atari wowe, nyamuneka emeza konti yawe ako kanya uhindura ijambo ryawe ry\'ibanga.' :
                       'Si ce n\'était pas vous, veuillez sécuriser votre compte immédiatement en changeant votre mot de passe.';

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; background: hsl(160, 40%, 15%); margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: hsl(160, 40%, 22%); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #DC3545 0%, #C82333 100%); padding: 40px; text-align: center; color: white; }
    .content { padding: 40px 30px; color: #eee; }
    .code-box { background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: white; font-size: 48px; font-weight: 900; letter-spacing: 12px; text-align: center; padding: 30px; border-radius: 12px; margin: 30px 0; font-family: monospace; }
    .warning { background: hsl(160, 40%, 32%); border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px; color: #ddd; }
    .footer { background: hsl(160, 40%, 16%); color: #e0e0e0; padding: 20px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 ${subject}</h1>
    </div>
    <div class="content">
      <h2>${greeting} ${userName},</h2>
      <p>${message}</p>
      <div class="code-box">${code}</div>
      <div class="warning">
        <strong>⚠️ ${language === 'en' ? 'Security Alert' : language === 'rw' ? 'Inyishu' : 'Alerte de Sécurité'}</strong><br>
        ${notYouMessage}
      </div>
    </div>
    <div class="footer">
      <p>© 2024 SMPPMS</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate password reset email template
 */
export function generatePasswordResetEmailHTML(
  userName: string,
  resetCode: string,
  resetLink: string,
  language: EmailLanguage = 'en',
  expiryMinutes: number = 60
): string {
  const subject = language === 'en'
    ? 'Reset Your Password - SMPPMS'
    : language === 'rw'
    ? 'Hindura Ijambo ry\'Ibanga - SMPPMS'
    : 'Reinitialisez Votre Mot de Passe - SMPPMS';

  const heading = language === 'en'
    ? 'Password Reset Request'
    : language === 'rw'
    ? 'Gusubizamo Ijambo ry\'Ibanga'
    : 'Demande de Reinitialisation du Mot de Passe';

  const intro = language === 'en'
    ? 'We received a request to reset your password. Use the code below in the app or use the secure link.'
    : language === 'rw'
    ? 'Twakiriye ubusabe bwo guhindura ijambo ry\'ibanga. Koresha kode iri hepfo muri porogaramu cyangwa ukoreshe umurongo urinda.'
    : 'Nous avons recu une demande de reinitialisation du mot de passe. Utilisez le code ci-dessous dans l\'application ou le lien securise.';

  const codeLabel = language === 'en'
    ? 'Password Reset Code'
    : language === 'rw'
    ? 'Kode yo Gusubizamo Ijambo ry\'Ibanga'
    : 'Code de Reinitialisation';

  const buttonText = language === 'en'
    ? 'Reset Password'
    : language === 'rw'
    ? 'Hindura Ijambo ry\'Ibanga'
    : 'Reinitialiser le Mot de Passe';

  const security = language === 'en'
    ? 'If you did not request this, you can safely ignore this email.'
    : language === 'rw'
    ? 'Niba utarasabye iki gikorwa, ushobora kwirengagiza iyi email.'
    : 'Si vous n\'etes pas a l\'origine de cette action, ignorez cet email.';

  const expiryText = language === 'en'
    ? `This code expires in ${expiryMinutes} minutes.`
    : language === 'rw'
    ? `Iyi kode irarangira mu minota ${expiryMinutes}.`
    : `Ce code expire dans ${expiryMinutes} minutes.`;

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 24px; background: #f5f7fb; font-family: Arial, sans-serif; color: #0f172a; }
    .container { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #d9e2ec; box-shadow: 0 10px 24px rgba(15,23,42,.08); }
    .header { background: linear-gradient(135deg, #0f766e 0%, #064e3b 100%); color: #ecfdf5; padding: 24px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .code-box { margin: 18px 0; padding: 16px; border-radius: 12px; background: linear-gradient(135deg,#0f766e 0%,#065f46 100%); border: 1px solid #047857; }
    .code-label { color: #d1fae5; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    .code { color: #ecfdf5; margin-top: 8px; font-size: 34px; letter-spacing: .28em; font-weight: 800; font-family: 'Courier New', monospace; }
    .meta { margin: 18px 0; padding: 12px 14px; border-radius: 10px; background: #ecfeff; border-left: 4px solid #0891b2; color: #0f172a; font-size: 14px; }
    .btn { display: inline-block; margin-top: 8px; background: #0f766e; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; }
    .security { margin: 18px 0; padding: 12px 14px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; font-size: 13px; }
    .footer { padding: 0 24px 24px; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${heading}</h1>
    </div>
    <div class="content">
      <p>${emailTranslations[language].greeting} <strong>${userName}</strong>,</p>
      <p>${intro}</p>

      <div class="code-box">
        <div class="code-label">${codeLabel}</div>
        <div class="code">${resetCode}</div>
      </div>

      <div class="meta">${expiryText}</div>

      <p><a class="btn" href="${resetLink}">${buttonText}</a></p>

      <div class="security">${security}</div>
    </div>
    <div class="footer">Smart Market Price Monitoring and Prediction System</div>
  </div>
</body>
</html>
  `;
}


