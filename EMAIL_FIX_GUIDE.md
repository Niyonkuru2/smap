# SMPMPS Email Fix Guide

## Problem
Gmail SMTP authentication failed with error:
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

## Solution Options

Choose ONE of the following solutions:

---

## Option 1: Update Gmail App Password (Quick Fix)

### Steps:
1. Go to: https://myaccount.google.com/security
2. Verify 2-Factor Authentication is enabled
3. Go to: https://myaccount.google.com/apppasswords
4. Select "Mail" as the app
5. Select "Windows Computer" as the device type
6. Click "Generate"
7. Copy the 16-character password (e.g., `xxxx xxxx xxxx xxxx`)
8. Update `.env`:
   ```env
   EMAIL_USER=josianeuwamahoro55@gmail.com
   EMAIL_PASS=<paste-new-16-char-password-here>
   ```
9. Restart backend: `npm start`

### Test:
```bash
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

---

## Option 2: Use SendGrid (Recommended for Production)

### Setup:
1. Create free SendGrid account: https://sendgrid.com/free
2. Get API key from Settings → API Keys
3. Update `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Install:
```bash
npm install @sendgrid/mail
```

### Update code in `email-handler.js`:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, htmlContent) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html: htmlContent,
  };
  await sgMail.send(msg);
}
```

---

## Option 3: Use Mailgun

### Setup:
1. Create account at https://www.mailgun.com/
2. Verify your domain
3. Update `.env`:
   ```env
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_API_KEY=your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Install:
```bash
npm install mailgun.js
```

---

## Option 4: Skip Email (For Testing Only)

### Update `.env`:
```env
EMAIL_USER=
EMAIL_PASS=
# Email service will be disabled but app keeps running
```

This allows testing other features without email setup.

---

## Testing After Fix

### Test 1: Password Reset
```bash
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test 2: Email Verification
```bash
curl -X POST http://localhost:3001/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email":"new-user@example.com"}'
```

### Check Backend Logs
Should see: `✅ Email transporter verified and ready to send!`

---

## Current Problematic Credentials

```
EMAIL_USER=josianeuwamahoro55@gmail.com
EMAIL_PASS=meom qubr dovg wssw
```

This app password is either:
- ❌ Expired (Google invalidates unused app passwords after time)
- ❌ Created for different Google account
- ❌ Typed incorrectly in `.env`

---

## Recommended Solution

For immediate testing: **Option 1** (Update Gmail password)
For production: **Option 2** (SendGrid) - more reliable, better deliverability

Once fixed, password reset emails and email verification will work properly.
