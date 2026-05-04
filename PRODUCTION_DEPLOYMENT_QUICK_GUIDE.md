# PRODUCTION DEPLOYMENT GUIDE
**SMPMPS - Smart Market Price Monitoring and Prediction System**
**Status**: READY TO DEPLOY (After Email Fix)

---

## 🚀 QUICK START: Deploy in 15 Minutes

### Step 1: Fix Email Service (5 minutes)

**Choose ONE option below:**

#### Option A: Gmail (Quickest)
```bash
# 1. Go to: https://myaccount.google.com/apppasswords
# 2. Create new app password for "Mail"
# 3. Copy the 16-character password
# 4. Update .env file:
EMAIL_USER=josianeuwamahoro55@gmail.com
EMAIL_PASS=<paste-16-char-password-here>

# 5. Save and commit
git add .env
git commit -m "Update Gmail app password for production"
```

#### Option B: SendGrid (Recommended for Production)
```bash
# 1. Sign up at https://sendgrid.com (free tier available)
# 2. Generate API key from Settings → API Keys
# 3. Update .env file:
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx_yyyyy

# 4. Save and commit
git add .env
git commit -m "Switch to SendGrid for production email"
```

#### Option C: Mailgun (Enterprise Option)
```bash
# 1. Sign up at https://mailgun.com
# 2. Get API key and domain
# 3. Update .env file:
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=sandbox123abc.mailgun.org

# 4. Save and commit
git add .env
git commit -m "Switch to Mailgun for production email"
```

### Step 2: Deploy to Production (5 minutes)
```bash
# Push changes to GitHub
git push

# Render auto-deploys from GitHub
# Monitor deployment: Open https://dashboard.render.com
# Wait for green "Live" status (5-10 minutes)
```

### Step 3: Test Production (5 minutes)
```bash
# Test API health
curl https://smpmps-test.onrender.com/health
# Expected: {"status": "operational"}

# Test signup flow
curl -X POST https://smpmps-test.onrender.com/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com"}'
# Expected: {"success": true, "message": "Verification email sent"}

# Check email sent (Gmail, SendGrid, or Mailgun)
```

---

## 📋 System Status Before Deployment

### ✅ What's Working (Green Light)
- **Backend API** - 100+ endpoints operational
- **Database** - PostgreSQL with 20 tables, all constraints working
- **Authentication** - JWT, 2FA, password reset, rate limiting
- **Frontend** - TypeScript strict mode, Vite optimized
- **WebSocket** - Real-time price updates ready
- **SMS/USSD** - Twilio configured and endpoints ready
- **ML Models** - 4 ensemble models ready for predictions
- **Rate Limiting** - IP blocking and endpoint limits active
- **Security** - Edge cases handled, audit logging active

### ⚠️ What Needs Fixing (Yellow Light)
- **Email Service** - Gmail SMTP authentication failed (CRITICAL)
  - **Impact**: Cannot send verification emails, signup blocked
  - **Solution**: Fix with one of 3 options above
  - **Time to Fix**: 5 minutes

### ℹ️ What Will Resolve Over Time (Blue Light)
- **ML Predictions** - Need 10+ price submissions per product/market
  - Currently: 900 test records seeded
  - Will improve: As vendors submit real prices
  - Status: Expected behavior, not a bug

---

## 🔧 INFRASTRUCTURE DETAILS

### Production URLs
```
Frontend: https://smpmps-test.onrender.com
Backend: https://smpmps-test.onrender.com/api
Health: https://smpmps-test.onrender.com/health
```

### Database
```
Provider: PostgreSQL (managed by Render)
Tables: 20+
Records: 900+ test data pre-loaded
Status: ✅ Connected and verified
```

### Environment Variables (Set in Render Dashboard)
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://...
JWT_SECRET=...

# Email (Choose one)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Monitoring & Logs
```
Render Dashboard: https://dashboard.render.com
Click Service → Logs tab
```

---

## 📱 PRODUCTION TESTING CHECKLIST

After deployment, verify these endpoints:

### Authentication Flow
```bash
# 1. Send verification email
curl -X POST https://smpmps-test.onrender.com/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Expected: ✅ {"success": true}

# 2. Verify code (check email for code)
curl -X POST https://smpmps-test.onrender.com/auth/verify-email-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456"}'
# Expected: ✅ {"success": true}

# 3. Complete signup
curl -X POST https://smpmps-test.onrender.com/auth/complete-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User",
    "role": "consumer"
  }'
# Expected: ✅ {"success": true, "token": "jwt...", "user": {...}}

# 4. Login
curl -X POST https://smpmps-test.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePassword123!"}'
# Expected: ✅ {"success": true, "token": "jwt...", "user": {...}}
```

### Product & Price Endpoints
```bash
# Get all products
curl https://smpmps-test.onrender.com/api/products
# Expected: ✅ [{"id": 1, "name": "Maize", ...}, ...]

# Get all markets
curl https://smpmps-test.onrender.com/api/markets
# Expected: ✅ [{"id": "kigali", "name": "Kigali Central", ...}, ...]

# Get live prices
curl https://smpmps-test.onrender.com/api/prices/live
# Expected: ✅ {"market": "kigali", "prices": [...]}

# Compare prices
curl https://smpmps-test.onrender.com/prices/compare-markets/1
# Expected: ✅ {"productId": 1, "markets": [...]}
```

### SMS Integration
```bash
# Send SMS query
curl -X POST https://smpmps-test.onrender.com/sms/query \
  -H "Content-Type: application/json" \
  -d '{"message": "PRICE tomato kigali", "phone": "+250788123456"}'
# Expected: ✅ {"message": "Tomato in Kigali: 800 RWF/kg"}
```

### Admin Endpoints
```bash
# Get users (requires admin token)
curl -H "Authorization: Bearer <admin-jwt>" \
  https://smpmps-test.onrender.com/admin/users
# Expected: ✅ [{"id": 1, "email": "...", "role": "admin"}, ...]
```

---

## 🔐 SECURITY CHECKLIST

- ✅ JWT_SECRET is strong and random (20+ characters)
- ✅ DATABASE_URL uses secure PostgreSQL connection
- ✅ HTTPS enabled (automatic with Render.com)
- ✅ Rate limiting active (prevents brute force)
- ✅ Email verification required (prevents spam signups)
- ✅ 2FA available (optional for users)
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ CORS configured for allowed origins only
- ✅ SQL injection protected (parameterized queries)
- ✅ XSS protection via TypeScript strict mode

---

## 📊 PERFORMANCE OPTIMIZATION

Already implemented:
- ✅ Database indexes on frequently queried columns
- ✅ Connection pooling for PostgreSQL
- ✅ Gzip compression middleware
- ✅ Frontend code splitting with Vite
- ✅ Terser minification for JavaScript
- ✅ WebSocket for real-time updates (vs polling)
- ✅ Pagination middleware (20-100 items per page)

Monitor in production:
- Database query response times
- API endpoint response times
- Memory usage on Render
- WebSocket connection count

---

## 🚨 POST-DEPLOYMENT MONITORING

### First Week Actions
1. Monitor error logs every day
2. Test key workflows daily
3. Collect real vendor price submissions
4. Monitor ML model predictions accuracy
5. Set up alerts for critical failures

### First Month Actions
1. Analyze usage patterns
2. Optimize database queries if needed
3. Add caching layer if performance degrades
4. Train team on system operations
5. Plan feature roadmap

### Enable Alerts (In Render Dashboard)
```
Services → Alerts
- Select service → smpmps-test
- Create alert for:
  - High memory usage (>512MB)
  - High CPU usage (>80%)
  - Failed restarts
  - Public metrics endpoint down
```

---

## 🆘 TROUBLESHOOTING

### Email Not Sending
```
1. Check Render logs: https://dashboard.render.com
2. Verify email credentials in .env
3. Check Gmail app password is generated correctly
4. Test with SendGrid if Gmail fails
5. Check spam/junk folder
```

### Database Connection Failed
```
1. Verify DATABASE_URL in Render environment
2. Check PostgreSQL connection limits (via Render DB dashboard)
3. Restart service in Render dashboard
4. Check firewall rules if self-hosted DB
```

### Signup Not Working
```
1. Check email service (see above)
2. Verify POST /auth/send-verification-email works
3. Check email arrives without junk filter
4. Verify code expiration (15 minutes default)
5. Check rate limiting isn't blocking (10 req/min)
```

### WebSocket Not Connecting
```
1. Check browser console for errors
2. Verify Socket.IO server running: curl https://smpmps-test.onrender.com/health
3. Check CORS allows WebSocket origin
4. Try fallback to polling (automatic if needed)
5. Check firewall allows WebSocket upgrade
```

### Rate Limiting Too Strict
```
1. Locate IP_RATE_LIMIT in backend/src/securityMiddleware.js
2. Adjust limits (higher for development)
3. Restart backend
4. Or request manual IP unblock from admin
```

---

## 📈 SCALING FOR PRODUCTION

When ready to scale beyond MVP:

1. **Database**: Upgrade PostgreSQL tier on Render
2. **Backend**: Scale to multiple dynos on Render
3. **WebSocket**: Add Redis adapter for multiple instances
4. **Caching**: Add Redis for frequently accessed data
5. **CDN**: Add Cloudflare for static assets
6. **Load Balancing**: Render handles automatically

---

## ✅ FINAL DEPLOYMENT CHECKLIST

Before going live:
- [ ] Fix email service (Gmail, SendGrid, or Mailgun)
- [ ] Test signup flow end-to-end
- [ ] Test login and 2FA setup
- [ ] Test price submission (vendor flow)
- [ ] Test price comparison (consumer flow)
- [ ] Test SMS queries (SMS flow)
- [ ] Verify all environment variables set in Render
- [ ] Check logs for errors: https://dashboard.render.com
- [ ] Test from production domain (not localhost)
- [ ] Share production URL with team
- [ ] Document admin credentials securely
- [ ] Set up monitoring and alerts

---

## 🎉 WHAT'S NEXT

After Deployment:
1. Collect real vendor price submissions
2. ML models will improve predictions with more data
3. Monitor user feedback
4. Plan feature enhancements
5. Scale infrastructure as usage grows

---

**Ready to Deploy?** → Fix email service (5 min) → Git push (1 min) → Test (5 min) = 11 minutes to production

For questions, check COMPREHENSIVE_SYSTEM_AUDIT.md for detailed component information.
