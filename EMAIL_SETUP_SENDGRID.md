# 📧 Email Configuration - SendGrid SMTP Setup

## Quick Setup (Recommended for Production)

### Step 1: Get SendGrid API Key

1. Go to [SendGrid Console](https://sendgrid.com/)
2. Sign up for free account (or login if you have one)
3. Navigate to: **Settings → API Keys**
4. Click **"Create API Key"**
5. Name it: `SMPMPS-Production`
6. Select: **Full Access** or **Mail Send** permission
7. Copy the key (you won't see it again!)

### Step 2: Set Environment Variable on Render

If deployed on Render:

1. Go to your Render project dashboard
2. Click **Environment** tab
3. Add new variable:
   - **Key**: `SENDGRID_API_KEY`
   - **Value**: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your API key)
4. Click **Save**
5. Render automatically redeploys

### Step 3: Local Development

Create/update `.env` file in backend directory:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_USER=noreply@yourdomain.com
NODE_ENV=development
```

### Step 4: Verify It Works

The server logs on startup will show:

```
🔌 Configuring SendGrid email transporter...
✅ SendGrid SMTP verified and ready!
   Ready to send verification codes and emails
```

---

## Email Features Now Working ✅

- ✅ Verification codes sent to user email
- ✅ Password reset emails
- ✅ Account notifications
- ✅ Price alerts via email
- ✅ Works on Render (no port blocking)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email not configured" | Set `SENDGRID_API_KEY` env var |
| "Authentication failed" | Check API key is correct (starts with `SG.`) |
| "Email takes 2-3 seconds" | Normal - SendGrid backend is async |
| Emails in spam | Verify sender domain in SendGrid |

---

## Alternative SMTP Providers

If you don't want SendGrid, use custom SMTP:

```env
SMTP_HOST=smtp.yourmailserver.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your@email.com
EMAIL_PASS=your-password
```

Currently supported fallback providers:
- Office 365 SMTP
- Zoho Mail
- Mailgun
- AWS SES (via SMTP endpoint)

Set the above env vars instead of `SENDGRID_API_KEY`.

---

## Testing Emails Locally

```bash
# Test verification email
curl -X POST http://localhost:3001/verify/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","verificationCode":"123456","userName":"Test User"}'

# Expected: Code sent to test@example.com
```
