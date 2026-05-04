const EMAIL_TEXT = {
  en: {
    appName: 'SMPMPS',
    verifySubject: 'Verify Your Email - SMPMPS',
    resetSubject: 'Reset Your Password - SMPMPS',
    greeting: 'Hello',
    verifyTitle: 'Email Verification',
    verifyMessage: 'Use the code below to verify your email address and finish account setup.',
    resetTitle: 'Password Reset Request',
    resetMessage: 'We received a request to reset your password. Use this code in the app or open the secure link.',
    codeLabel: 'Verification Code',
    resetCodeLabel: 'Password Reset Code',
    useInApp: 'Enter this code in the app:',
    openLink: 'Or use this secure reset link:',
    resetButton: 'Reset Password',
    expiryPrefix: 'This code expires in',
    minutes: 'minutes',
    securityTitle: 'Security Notice',
    securityBody: 'If you did not request this action, you can safely ignore this email.',
    support: 'Need help? Contact support@rwandaprices.com',
    footer: 'Smart Market Price Monitoring and Prediction System'
  },
  rw: {
    appName: 'SMPMPS',
    verifySubject: 'Emeza Email Yawe - SMPMPS',
    resetSubject: 'Hindura Ijambo ry\'Ibanga - SMPMPS',
    greeting: 'Muraho',
    verifyTitle: 'Kwemeza Email',
    verifyMessage: 'Koresha iyi kode hepfo kugirango wemeze email yawe no kurangiza kwiyandikisha.',
    resetTitle: 'Gusubizamo Ijambo ry\'Ibanga',
    resetMessage: 'Twakiriye ubusabe bwo guhindura ijambo ry\'ibanga. Koresha iyi kode muri porogaramu cyangwa ufungure umurongo urinda.',
    codeLabel: 'Kode yo Kwemeza',
    resetCodeLabel: 'Kode yo Gusubizamo Ijambo ry\'Ibanga',
    useInApp: 'Injiza iyi kode muri porogaramu:',
    openLink: 'Cyangwa koresha uyu murongo urinda:',
    resetButton: 'Hindura Ijambo ry\'Ibanga',
    expiryPrefix: 'Iyi kode irarangira mu',
    minutes: 'iminota',
    securityTitle: 'Umutekano',
    securityBody: 'Niba utarasabye iki gikorwa, ushobora kwirengagiza iyi email.',
    support: 'Ukeneye ubufasha? Andikira support@rwandaprices.com',
    footer: 'Smart Market Price Monitoring and Prediction System'
  },
  fr: {
    appName: 'SMPMPS',
    verifySubject: 'Verifiez Votre Email - SMPMPS',
    resetSubject: 'Reinitialisez Votre Mot de Passe - SMPMPS',
    greeting: 'Bonjour',
    verifyTitle: 'Verification Email',
    verifyMessage: 'Utilisez le code ci-dessous pour verifier votre adresse email et terminer la creation du compte.',
    resetTitle: 'Demande de Reinitialisation du Mot de Passe',
    resetMessage: 'Nous avons recu une demande de reinitialisation du mot de passe. Utilisez ce code dans l\'application ou ouvrez le lien securise.',
    codeLabel: 'Code de Verification',
    resetCodeLabel: 'Code de Reinitialisation',
    useInApp: 'Entrez ce code dans l\'application :',
    openLink: 'Ou utilisez ce lien securise :',
    resetButton: 'Reinitialiser le Mot de Passe',
    expiryPrefix: 'Ce code expire dans',
    minutes: 'minutes',
    securityTitle: 'Avis de Securite',
    securityBody: 'Si vous n\'etes pas a l\'origine de cette action, ignorez cet email.',
    support: 'Besoin d\'aide ? Contactez support@rwandaprices.com',
    footer: 'Smart Market Price Monitoring and Prediction System'
  }
};

function t(language) {
  return EMAIL_TEXT[language] || EMAIL_TEXT.en;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function baseEmailLayout(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d9e2ec;box-shadow:0 10px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:22px 26px;background:linear-gradient(135deg,#0f766e 0%,#064e3b 100%);color:#ecfdf5;">
              <div style="font-size:13px;opacity:.9;letter-spacing:.08em;text-transform:uppercase;">SMPMPS</div>
              <div style="font-size:22px;font-weight:700;line-height:1.3;">${title}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:26px;">${bodyHtml}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getEmailSubject(type, language = 'en') {
  const tx = t(language);
  if (type === 'reset') return tx.resetSubject;
  return tx.verifySubject;
}

export function generateVerificationEmailHTML({
  userName,
  code,
  language = 'en',
  expiryMinutes = 10
}) {
  const tx = t(language);

  const body = `
    <p style="margin:0 0 14px;font-size:16px;">${tx.greeting} <strong>${escapeHtml(userName || 'User')}</strong>,</p>
    <p style="margin:0 0 18px;color:#334155;line-height:1.6;">${tx.verifyMessage}</p>

    <div style="margin:18px 0;padding:16px;border-radius:12px;background:linear-gradient(135deg,#0f766e 0%,#065f46 100%);border:1px solid #047857;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d1fae5;">${tx.codeLabel}</div>
      <div style="margin-top:8px;font-size:34px;font-weight:800;letter-spacing:.32em;color:#ecfdf5;font-family:'Courier New',monospace;">${escapeHtml(code)}</div>
    </div>

    <div style="margin:18px 0;padding:12px 14px;border-radius:10px;background:#ecfeff;border-left:4px solid #0891b2;color:#0f172a;font-size:14px;">
      ${tx.expiryPrefix} <strong>${escapeHtml(expiryMinutes)}</strong> ${tx.minutes}.
    </div>

    <div style="margin:18px 0;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-size:13px;">
      <strong style="color:#0f172a;">${tx.securityTitle}:</strong> ${tx.securityBody}
    </div>

    <p style="margin:16px 0 0;color:#475569;font-size:13px;">${tx.support}</p>
    <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">${tx.footer}</p>
  `;

  return baseEmailLayout(tx.verifyTitle, body);
}

export function generatePasswordResetEmailHTML({
  userName,
  resetCode,
  resetLink,
  language = 'en',
  expiryMinutes = 60
}) {
  const tx = t(language);

  const body = `
    <p style="margin:0 0 14px;font-size:16px;">${tx.greeting} <strong>${escapeHtml(userName || 'User')}</strong>,</p>
    <p style="margin:0 0 18px;color:#334155;line-height:1.6;">${tx.resetMessage}</p>

    <p style="margin:0 0 8px;color:#475569;font-size:13px;">${tx.useInApp}</p>
    <div style="margin:8px 0 18px;padding:16px;border-radius:12px;background:linear-gradient(135deg,#0f766e 0%,#065f46 100%);border:1px solid #047857;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d1fae5;">${tx.resetCodeLabel}</div>
      <div style="margin-top:8px;font-size:34px;font-weight:800;letter-spacing:.28em;color:#ecfdf5;font-family:'Courier New',monospace;">${escapeHtml(resetCode)}</div>
    </div>

    <p style="margin:0 0 8px;color:#475569;font-size:13px;">${tx.openLink}</p>
    <p style="margin:0 0 18px;">
      <a href="${escapeHtml(resetLink)}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;">${tx.resetButton}</a>
    </p>

    <div style="margin:18px 0;padding:12px 14px;border-radius:10px;background:#ecfeff;border-left:4px solid #0891b2;color:#0f172a;font-size:14px;">
      ${tx.expiryPrefix} <strong>${escapeHtml(expiryMinutes)}</strong> ${tx.minutes}.
    </div>

    <div style="margin:18px 0;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-size:13px;">
      <strong style="color:#0f172a;">${tx.securityTitle}:</strong> ${tx.securityBody}
    </div>

    <p style="margin:16px 0 0;color:#475569;font-size:13px;">${tx.support}</p>
    <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">${tx.footer}</p>
  `;

  return baseEmailLayout(tx.resetTitle, body);
}
