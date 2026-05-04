# 🧪 PRODUCTION TESTING GUIDE
**App URL**: https://smpmps-test.onrender.com/  
**Environment**: Production  
**Date**: April 3, 2026

---

## PART 1: COMPLETE USER WORKFLOW TEST

### Step 1A: Signup (Consumer)
1. Go to: https://smpmps-test.onrender.com/
2. Click **"Sign Up"**
3. Enter details:
   - **Name**: Test Consumer
   - **Email**: testconsumer@gmail.com (use a real email)
   - **Phone**: +250788123456
   - **Role**: Consumer
   - **Password**: TestPass123!
4. Click **"Sign Up"**
5. **Expected**: Confirmation message "Check your email to verify"

### Step 1B: Verify Email
1. Check your email inbox (testconsumer@gmail.com)
2. Look for email from: **noreply@smpmps.com** with subject "**Email Verification Code**"
3. Copy the **6-digit verification code**
4. Return to app and paste code in verification field
5. Click **"Verify Email"**
6. **Expected**: Success message, redirected to login

### Step 1C: Login (Consumer)
1. Enter:
   - **Email**: testconsumer@gmail.com
   - **Password**: TestPass123!
2. Click **"Login"**
3. **Expected**: Redirected to Consumer Dashboard

---

## PART 2: PRICE SUBMISSION TEST

### Step 2A: Submit Price (Via Web Form)
**Location**: Consumer Dashboard → "Submit Price" tab

1. Click **"Submit Price"** button
2. Fill form:
   - **Product**: Tomato
   - **Market**: Kigali Central
   - **Price**: 850 RWF
   - **Unit**: kg
   - **Notes**: Fresh tomatoes, good quality
3. Click **"Submit Price"**
4. **Expected**: Success toast "Price submitted successfully"
5. **Verify**: Price appears in "Recent Submissions" with status "Pending"

### Step 2B: Submit Multiple Prices (Different Products)
Repeat 2A with:
- Product: Onion, Market: Kimironko, Price: 450
- Product: Cabbage, Market: Kigali Central, Price: 600
- Product: Potato, Market: Musanze, Price: 520

**Expected**: All prices submitted and visible in Recent Submissions list

---

## PART 3: PRICE COMPARISON TEST

### Step 3A: View Price Comparison
1. Go to: **Consumer Dashboard → "Price Comparison"** tab
2. Click **"Compare Now"** or select a product (e.g., "Tomato")
3. **Expected Output**:
   ```
   ✅ Market Rankings (Lowest to Highest):
      1. 🥇 Kimironko: 820 RWF (5 submissions)
      2. 🥈 Kigali Central: 850 RWF (12 submissions)
      3. 🥉 Musanze: 870 RWF (3 submissions)
   
   ✅ Price Statistics:
      Lowest: 820 RWF
      Highest: 870 RWF
      Average: 846 RWF
      Range: 50 RWF
   
   ✅ Bar Chart: Show markets with price heights
   ```

### Step 3B: Verify Chart Display
1. Should see **vertical bar chart** with:
   - X-axis: Market names
   - Y-axis: Price values
   - Different colors for each bar
   - Hover tooltip showing exact price
2. **Expected**: Smooth, responsive chart using Recharts

---

## PART 4: AI PRICE PREDICTION TEST

### Step 4A: Test Next Day Prediction API
**Method**: GET from browser or API client

```
URL: https://smpmps-test.onrender.com/predict/price/1/1
Expected Response:
{
  "success": true,
  "data": {
    "productId": 1,
    "marketId": 1,
    "predictedPrice": 847.50,
    "confidence": 0.92,
    "models": {
      "movingAverage": 845,
      "exponentialSmoothing": 848,
      "linearRegression": 850,
      "seasonal": 844
    },
    "volatility": 0.045,
    "lastPrice": 850,
    "change": -2.50
  }
}
```

**Verify**:
- ✅ Predicted price is reasonable (within ±5% of last price)
- ✅ Confidence score between 0-1
- ✅ All 4 models return values
- ✅ Volatility calculated

### Step 4B: Test 7-Day Forecast API

```
URL: https://smpmps-test.onrender.com/forecast/1/1?days=7
Expected Response:
{
  "success": true,
  "data": {
    "forecasts": [
      { "day": 1, "price": 847.50, "model": "ensemble" },
      { "day": 2, "price": 848.20, "model": "ensemble" },
      { "day": 3, "price": 846.80, "model": "ensemble" },
      ...
    ],
    "trend": "stable",
    "recommendation": "Good time to buy"
  }
}
```

**Verify**:
- ✅ Returns 7 forecasts
- ✅ Trend identified (stable/upward/downward)
- ✅ Recommendation provided

### Step 4C: Test Market Comparison API

```
URL: https://smpmps-test.onrender.com/prices/compare-markets/1
Expected Response:
{
  "success": true,
  "data": {
    "productId": 1,
    "comparisons": [
      {
        "marketId": 1,
        "marketName": "Kimironko",
        "price": 820,
        "rank": 1,
        "submissionCount": 5,
        "trend": "↓"
      },
      ...
    ],
    "statistics": {
      "min": 820,
      "max": 870,
      "average": 846,
      "range": 50
    }
  }
}
```

**Verify**:
- ✅ Markets ranked by price
- ✅ Statistics calculated
- ✅ Trends shown

---

## PART 5: SMS/USSD ACCESSIBILITY TEST

### Step 5A: Test SMS Query - PRICE Command
**Setup**: You need a phone that can receive SMS

**Option 1: Using Twilio Test Mode**
1. Go to: https://console.twilio.com/develop/sms/try-it-out
2. From: Your Twilio Number (+250728845885)
3. To: Your phone number
4. Message: `PRICE tomato`
5. Click **"Send Test"**

**Option 2: Send Real SMS**
1. Send SMS to: **+250728845885**
2. Message: `PRICE tomato`

**Expected Response**:
```
SMPMPS - Price Info
🍅 Tomato
📍 Kimironko: 820 RWF ⭐
📍 Kigali: 850 RWF
📍 Musanze: 870 RWF
Average: 846 RWF
Reply: HELP for commands
```

### Step 5B: Test SMS Commands
Send these SMS messages and verify responses:

| Command | Message | Expected Response |
|---------|---------|-------------------|
| **PRICE** | `PRICE tomato` | Price info for product |
| **MARKETS** | `MARKETS` | List all markets with counts |
| **PRODUCTS** | `PRODUCTS` | List available products |
| **COMPARE** | `COMPARE tomato` | Price comparison across markets |
| **SUBMIT** | `SUBMIT tomato 850 Kigali` | Price submission confirmation |
| **HELP** | `HELP` | List of SMS commands |

### Step 5C: Verify SMS Logs
1. In **Admin Dashboard** (if you have access)
2. Go to **"SMS Logs"**
3. **Expected**: All SMS queries logged with:
   - Sender phone number
   - Message content
   - Timestamp
   - Response sent
   - Status (Delivered)

---

## PART 6: AUTHENTICATION & SECURITY TEST

### Step 6A: Test Email Verification
**Scenario**: Try to login without email verification
1. Sign up with a new email
2. Do NOT verify email
3. Try to login
4. **Expected**: Error message "Please verify your email first"

### Step 6B: Test JWT Token
1. Login successfully
2. Open **Browser Developer Tools** (F12)
3. Go to **Application → Cookies**
4. Look for **"token"** cookie
5. **Expected**: JWT token present with expiry time
6. Close browser and reopen
7. **Expected**: Session preserved (auto-login)

### Step 6C: Test Role-Based Access
**As Consumer**:
1. Login as consumer
2. Try to access **Admin Dashboard** (URL: `/admin`)
3. **Expected**: Redirected to Consumer Dashboard (403 Forbidden)

**As Vendor**:
1. Signup as **Vendor**
2. Login
3. **Expected**: Access to Vendor Dashboard
4. Verify can see: Submit Price, My Submissions, Payment

---

## PART 7: CREATE TEST ACCOUNTS

### Create Vendor Account
1. **Sign Up** with:
   - Name: Test Vendor
   - Email: testvendor@gmail.com
   - Role: Vendor
   - Market: Kimironko
   - Phone: +250788123457
   - Password: TestPass123!
2. Verify email
3. Login and submit multiple prices

### Create Agent Account
1. **Sign Up** with:
   - Name: Test Agent
   - Email: testagent@gmail.com
   - Role: Agent
   - Phone: +250788123458
   - Password: TestPass123!
2. Verify email
3. Explore Agent Dashboard features

### Create Admin Account (If applicable)
Contact system administrator to elevate one account to admin role.

---

## PART 8: COMPREHENSIVE FEATURE CHECKLIST

| Feature | Test | Status |
|---------|------|--------|
| **Authentication** |
| Signup (Consumer) | Account created ✓ | [ ] |
| Email verification | Email received ✓ | [ ] |
| Login | Redirects to dashboard ✓ | [ ] |
| Logout | Session cleared ✓ | [ ] |
| Remember me | Auto-login works ✓ | [ ] |
| **Price Submission** |
| Submit price form | Form accepts input ✓ | [ ] |
| Validation | Errors on invalid input ✓ | [ ] |
| Success message | Toast notification ✓ | [ ] |
| Recent submissions | Prices listed ✓ | [ ] |
| **Price Comparison** |
| View comparison | Chart displays ✓ | [ ] |
| Market ranking | Sorted by price ✓ | [ ] |
| Statistics | Min/max/avg shown ✓ | [ ] |
| Bar chart | Recharts renders ✓ | [ ] |
| **AI Prediction** |
| Next day prediction | API returns forecast ✓ | [ ] |
| 7-day forecast | Multiple values ✓ | [ ] |
| Market comparison | Ranked markets ✓ | [ ] |
| Confidence score | Valid percentage ✓ | [ ] |
| **SMS/USSD** |
| SMS PRICE command | Response received ✓ | [ ] |
| SMS MARKETS command | Markets listed ✓ | [ ] |
| SMS COMPARE command | Prices compared ✓ | [ ] |
| SMS SUBMIT command | Price recorded ✓ | [ ] |
| SMS HELP command | Commands listed ✓ | [ ] |
| SMS logging | Logs visible in admin ✓ | [ ] |
| **User Roles** |
| Consumer access | Dashboard displays ✓ | [ ] |
| Vendor access | Submit/manage prices ✓ | [ ] |
| Agent access | Monitor submissions ✓ | [ ] |
| Admin access | Full system control ✓ | [ ] |
| **Security** |
| JWT expiry | Logout after 24h ✓ | [ ] |
| CORS protection | Cross-origin blocked ✓ | [ ] |
| Password hashing | Passwords not visible ✓ | [ ] |
| Email verification | Required to login ✓ | [ ] |
| **Performance** |
| Page load time | < 3 seconds ✓ | [ ] |
| API response time | < 1 second ✓ | [ ] |
| Mobile responsive | Works on phone ✓ | [ ] |
| Chart rendering | Smooth animation ✓ | [ ] |

---

## PART 9: TROUBLESHOOTING COMMON ISSUES

### Issue: "Email not received"
**Solution**:
1. Check spam/promotions folder
2. Whitelist: noreply@smpmps.com
3. Check email address is correct
4. Try another email address

### Issue: "SMS not received"
**Solution**:
1. Verify phone number format (+250...)
2. Check Twilio balance
3. Verify TWILIO_PHONE_NUMBER in env
4. Check SMS logs for errors

### Issue: "Price prediction returns 0"
**Solution**:
1. Need minimum 10 price entries
2. Check product/market IDs exist
3. Verify prices are in database
4. Check ML models in backend logs

### Issue: "Login fails with JWT error"
**Solution**:
1. Clear browser cookies
2. Clear browser cache
3. Try incognito window
4. Check JWT_SECRET in backend .env

### Issue: "Charts not displaying"
**Solution**:
1. Check browser console for errors (F12)
2. Verify price data exists
3. Check network request failed
4. Update browser to latest version

---

## PART 10: LOAD TESTING (Optional)

### Test with Multiple Concurrent Users
1. Open app in **3+ browser windows**
2. Have each user login with different account
3. Submit prices simultaneously
4. View comparisons at same time
5. **Expected**: All operations complete without errors

### Test Database Performance
1. Submit 50+ prices
2. View comparison - should load in < 1 second
3. Test predictions - should return in < 2 seconds
4. **Expected**: No timeouts or slowdowns

---

## PART 11: DATA VALIDATION TEST

### Test Price Submission Validation
Try submitting with invalid data:

| Input | Expected Behavior |
|-------|-------------------|
| Price: -100 | Error: "Price must be positive" |
| Price: 999999 | Error: "Price unrealistic" |
| Product: (empty) | Error: "Product required" |
| Unit: xyz | Error: "Invalid unit" |
| Market: (empty) | Error: "Market required" |

---

## PART 12: FINAL VERIFICATION

✅ Checklist before marking "Ready for Production":

- [ ] Sign up works (consumer, vendor, agent)
- [ ] Email verification functional
- [ ] Login/logout working
- [ ] Price submission saves to database
- [ ] Price comparison shows correct rankings
- [ ] AI prediction returns valid forecasts
- [ ] SMS commands receive responses
- [ ] SMS logs recorded in database
- [ ] All charts render properly
- [ ] Responsive on mobile
- [ ] No console errors (F12)
- [ ] All API calls succeed
- [ ] Database queries working
- [ ] JWT tokens valid
- [ ] Role-based access enforced

---

## QUICK API TESTING WITH CURL

**Test in PowerShell**:

```powershell
# Get price prediction
curl https://smpmps-test.onrender.com/predict/price/1/1

# Get 7-day forecast
curl https://smpmps-test.onrender.com/forecast/1/1?days=7

# Compare markets
curl https://smpmps-test.onrender.com/prices/compare-markets/1

# SMS query
curl -X POST https://smpmps-test.onrender.com/sms/query `
  -H "Content-Type: application/json" `
  -d '{"phone": "+250788123456", "query": "PRICE tomato"}'

# Get SMS help
curl https://smpmps-test.onrender.com/sms/help
```

---

## DOCUMENTATION LINKS

- 📖 [API Documentation](./API_DOCUMENTATION.md)
- 📋 [Feature Implementation Report](./FEATURE_IMPLEMENTATION_REPORT.md)
- 🔐 [Language Verification](./LANGUAGE_VERIFICATION_REPORT.md)
- 📱 [User Guide](./USER_GUIDE.md)
- 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## SUCCESS CRITERIA

✅ **All tests pass** → System ready for public release  
✅ **Minor issues** → Document and patch  
❌ **Critical issues** → Fix before release  

---

**Status**: Ready for comprehensive testing  
**Environment**: Production  
**Date**: April 3, 2026  
**Duration**: ~1-2 hours for complete test suite
