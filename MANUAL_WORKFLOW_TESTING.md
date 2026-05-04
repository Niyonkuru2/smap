# 🚀 COMPLETE USER WORKFLOW TESTING - STEP BY STEP

**Environment**: Production (https://smpmps-test.onrender.com/)  
**Duration**: ~30-45 minutes  
**Checklist**: 25+ items to verify

---

## ⏱️ ESTIMATED TIMELINE

- Signup & Verification: 5 mins
- Price Submission: 5 mins
- Price Comparison: 5 mins
- Testing Other Features: 15 mins
- **Total: ~30 minutes**

---

## 🧑‍💼 COMPLETE WORKFLOW #1: CONSUMER FULL JOURNEY

### PHASE 1: ACCOUNT CREATION (5-10 minutes)

#### Step 1.1: Open the App
1. **Go to**: https://smpmps-test.onrender.com/
2. **Expected**: Homepage loads with "Welcome to SMPMPS" banner
3. **✓ Check**: 
   - [ ] Page loads quickly (< 3 sec)
   - [ ] Menu bar visible with "Sign Up" button
   - [ ] Footer shows contact info

#### Step 1.2: Sign Up as Consumer
1. **Click**: "Sign Up" button (top right)
2. **Expected**: Sign up form appears
3. **Fill Form**:
   - **Full Name**: `Test Consumer 1`
   - **Email**: `testconsumer1.{{timestamp}}@gmail.com` (use real email you can access)
   - **Phone**: `+250788765432`
   - **Role**: Select `Consumer`
   - **Password**: `SecurePass123!`
   - **Confirm Password**: `SecurePass123!`
4. **Check Terms**: ☑️ Agree to terms
5. **Click**: "Create Account"
6. **✓ Check**:
   - [ ] Form validates required fields
   - [ ] Success message appears: "Account created. Check your email to verify."

#### Step 1.3: Email Verification
1. **Check Email Inbox** (testconsumer1.xxxx@gmail.com)
   - Look for email from: **noreply@smpmps.com**
   - Subject: **"Email Verification Code"**
2. **Copy Verification Code** (6-digit number)
3. **Return to App** (if redirected to login screen)
4. **Paste Code** in verification field
5. **Click**: "Verify Email"
6. **Expected**: ✅ "Email verified successfully"
7. **✓ Check**:
   - [ ] Email received within 2 minutes
   - [ ] Code format: 6 digits
   - [ ] App confirms verification

---

### PHASE 2: LOGIN & DASHBOARD (2-3 minutes)

#### Step 2.1: Login
1. **If not logged in, go to**: https://smpmps-test.onrender.com/login
2. **Enter Credentials**:
   - **Email**: testconsumer1.xxxx@gmail.com
   - **Password**: SecurePass123!
3. **Check**: "Remember me" (optional)
4. **Click**: "Login"
5. **Expected**: Redirected to Consumer Dashboard
6. **✓ Check**:
   - [ ] Login succeeds with correct credentials
   - [ ] Dashboard loads (< 2 sec)
   - [ ] User name displayed (welcome message)

#### Step 2.2: Explore Dashboard
1. **Dashboard Shows**:
   - [ ] Profile icon (top right)
   - [ ] Navigation menu (left sidebar or hamburger)
   - [ ] Main content area
2. **Menu Options** (should see):
   - [ ] Submit Price
   - [ ] View Prices
   - [ ] Price Comparison
   - [ ] My Submissions
   - [ ] Settings
   - [ ] Logout

---

### PHASE 3: PRICE SUBMISSION (5-10 minutes)

#### Step 3.1: Submit First Price
1. **Click**: "Submit Price" tab/button
2. **Expected**: Form appears with fields:
   - Product (dropdown)
   - Market (dropdown)
   - Price (number input)
   - Unit (dropdown)
   - Notes (text area)
3. **Fill Form**:
   - **Product**: Select `Tomato`
   - **Market**: Select `Kigali Central Market`
   - **Price**: Enter `850`
   - **Unit**: Select `kg`
   - **Notes**: `Fresh red tomatoes, good quality`
4. **Click**: "Submit Price"
5. **Expected**: Success message toast
   - "✓ Price submitted successfully"
6. **✓ Check**:
   - [ ] Form validates all required fields
   - [ ] Success response appears
   - [ ] Price in reasonable range (100-10000)

#### Step 3.2: Submit Multiple Prices
**Repeat Step 3.1 with these combinations**:

**Price 2 - Onion**:
- Product: `Onion`
- Market: `Kimironko`
- Price: `450`
- Unit: `kg`
- Notes: `Yellow onions`

**Price 3 - Cabbage**:
- Product: `Cabbage`
- Market: `Kigali Central Market`
- Price: `600`
- Unit: `kg`
- Notes: `Green cabbage, fresh`

**Price 4 - Potato**:
- Product: `Potato`
- Market: `Musanze`
- Price: `520`
- Unit: `kg`
- Notes: `White potatoes`

**Price 5 - Beans**:
- Product: `Beans`
- Market: `Gasabo`
- Price: `1200`
- Unit: `kg`
- Notes: `Dried beans`

6. **✓ Check**:
   - [ ] All 5 prices submitted successfully
   - [ ] Each shows success message
   - [ ] No errors during submission

#### Step 3.3: View Your Submissions
1. **Click**: "My Submissions" tab
2. **Expected**: Table shows all 5 prices:
   ```
   Product  | Market              | Price | Submitted        | Status
   ---------|-------------------|-------|------------------|----------
   Tomato   | Kigali Central     | 850   | Today 10:30 AM  | Approved
   Onion    | Kimironko          | 450   | Today 10:31 AM  | Approved
   Cabbage  | Kigali Central     | 600   | Today 10:32 AM  | Pending
   Potato   | Musanze            | 520   | Today 10:33 AM  | Approved
   Beans    | Gasabo             | 1200  | Today 10:34 AM  | Approved
   ```
3. **✓ Check**:
   - [ ] All 5 submissions visible
   - [ ] Timestamps recent
   - [ ] Statuses showing (Approved/Pending)
   - [ ] Can click to view details

---

### PHASE 4: PRICE COMPARISON (5-10 minutes)

#### Step 4.1: View Basic Comparison
1. **Click**: "Price Comparison" tab
2. **Expected**: Selection screen or product list
3. **Select Product**: `Tomato`
4. **Click**: "Compare" or "View Comparison"
5. **Expected**: Comparison page loads showing:
   - Market rankings (lowest to highest)
   - Price statistics
   - Visual bar chart

#### Step 4.2: Verify Comparison Data
**Should see something like**:

```
🍅 TOMATO PRICE COMPARISON
═══════════════════════════════════════

Market Rankings:
─────────────────────────────────────
🥇 #1 Kimironko
    Price: 420 RWF/kg
    Submissions: 3
    Trend: ↓ (prices dropping)

🥈 #2 Kigali Central Market
    Price: 850 RWF/kg
    Submissions: 12
    Trend: → (stable)

🥉 #3 Musanze
    Price: 870 RWF/kg
    Submissions: 5
    Trend: ↑ (prices rising)

═════════════════════════════════════
📊 STATISTICS
─────────────────────────────────────
Lowest Price:  420 RWF/kg
Highest Price: 870 RWF/kg
Average Price: 713 RWF/kg
Price Range:   450 RWF
```

6. **✓ Check**:
   - [ ] Markets ranked by price (lowest first)
   - [ ] Prices are reasonable and realistic
   - [ ] Statistics calculated correctly
   - [ ] Trends shown (up/down/stable)

#### Step 4.3: View Other Comparisons
**Compare these products** (repeat 4.1-4.2 steps):
1. [ ] Onion
2. [ ] Cabbage  
3. [ ] Potato
4. [ ] Beans

**For each**:
- [ ] Comparison loads
- [ ] Market rankings display
- [ ] Statistics show
- [ ] Chart displays (bar chart with colors)

#### Step 4.4: Verify Chart Display
1. **Look for Bar Chart**
   - X-axis: Market names
   - Y-axis: Price values
   - Bars: Different colors for each market
2. **Interactive Features**:
   - [ ] Hover over bar → shows exact price
   - [ ] Chart is responsive
   - [ ] Legend visible
3. **✓ Check**:
   - [ ] Chart renders smoothly
   - [ ] No JavaScript errors (F12 → Console)
   - [ ] Title visible above chart

---

### PHASE 5: AI PRICE PREDICTIONS (5 minutes)

#### Step 5.1: View Price Predictions
1. **Find**: "Price Predictions" or "AI Forecast" section
   - May be in dashboard or separate page
2. **Select Product**: `Tomato`
3. **Expected**: Shows prediction info:
   ```
   Tomorrow's Predicted Price: 835 RWF
   Confidence: 92%
   Prediction Range: 820-850 RWF
   ```
4. **✓ Check**:
   - [ ] Prediction within reasonable range
   - [ ] Confidence score between 0-100%
   - [ ] Forecast date shown

#### Step 5.2: View 7-Day Forecast
1. **Look for**: "7-Day Forecast" or expand prediction section
2. **Expected**: Shows 7 rows of predictions:
   ```
   Day 1 (Tomorrow):  835 RWF
   Day 2:             838 RWF
   Day 3:             840 RWF
   Day 4:             842 RWF
   Day 5:             843 RWF
   Day 6:             844 RWF
   Day 7:             845 RWF
   ```
3. **Trend Analysis**:
   - [ ] Shows overall trend (up/down/stable)
   - [ ] Recommendation: "Good time to buy" or "Wait"
4. **✓ Check**:
   - [ ] 7 forecasts displayed
   - [ ] Prices gradually changing (not jumping)
   - [ ] Confidence score present

---

### PHASE 6: SMS/USSD TESTING (5-10 minutes)

#### Step 6.1: Find SMS Information
1. **Look for**: "SMS Commands" or "SMS Access" section
2. **Should See**: Help text displaying available commands
3. **Commands Listed**:
   - PRICE [product] - Get current prices
   - MARKETS - List all markets
   - PRODUCTS - List products
   - COMPARE [product] - Compare prices
   - SUBMIT [product] [price] [market] - Submit price
   - HELP - Show commands

#### Step 6.2: Test SMS Query (If SMS Capability)
**Option A: Using Phone (if you have Twilio)**
1. Send SMS to: `+250728845885`
2. Message: `PRICE tomato`
3. **Wait for Response** (should receive within 30 seconds)
4. **Expected Response**:
   ```
   SMPMPS Price Info
   🍅 Tomato
   📍 Kimironko: 420 RWF
   📍 Kigali: 850 RWF
   📍 Musanze: 870 RWF
   Average: 713 RWF
   Reply HELP for commands
   ```
5. **✓ Check**:
   - [ ] SMS received
   - [ ] Information accurate
   - [ ] Format readable on phone

**Option B: Testing via Web Interface**
1. Look for SMS testing form (if available)
2. Enter phone: `+250788765432`
3. Enter query: `PRICE tomato`
4. Click: "Send Test"
5. **✓ Check**:
   - [ ] Form validates input
   - [ ] Request succeeds

---

### PHASE 7: SECURITY & ACCOUNT FEATURES (3-5 minutes)

#### Step 7.1: Test Password Security
1. **Try logging in with wrong password**:
   - Email: testconsumer1.xxxx@gmail.com
   - Password: WrongPassword123
2. **Expected**: ❌ "Invalid credentials"
3. **✓ Check**: [ ] System rejects wrong password

#### Step 7.2: Access Account Settings
1. **Click**: Profile icon (top right)
2. **Select**: "Settings" or "Account Settings"
3. **Expected**: Settings page loads
4. **Verify Options**:
   - [ ] Change Password
   - [ ] Update Profile Info
   - [ ] Email Verification Status (should show "Verified")
   - [ ] Logout button

#### Step 7.3: View Profile
1. **Click**: "View Profile" or "My Account"
2. **Verify Information**:
   - [ ] Name: Test Consumer 1
   - [ ] Email: testconsumer1.xxxx@gmail.com
   - [ ] Phone: +250788765432
   - [ ] Role: Consumer
   - [ ] Joined: Today's date

#### Step 7.4: Logout
1. **Click**: "Logout"
2. **Expected**: Redirected to homepage
3. **Try Login**: Attempt to access dashboard directly
4. **Expected**: Redirected to login page
5. **✓ Check**: [ ] Session properly cleared

---

## 🧑‍🌾 COMPLETE WORKFLOW #2: VENDOR FULL JOURNEY (10-15 minutes)

**Repeat Phase 1-2 with Vendor role**:

#### Setup: Create Vendor Account
1. **Go to**: https://smpmps-test.onrender.com/
2. **Sign Up** with:
   - Name: `Test Vendor 1`
   - Email: `testvendor1.{{timestamp}}@gmail.com`
   - Phone: `+250788765433`
   - **Role**: `Vendor`
   - Market Assigned: `Kimironko`
   - Password: `SecurePass123!`
3. **Verify Email** (same process as consumer)

#### Vendor Dashboard Differences
1. **Should See**:
   - [ ] Market assigned: Kimironko
   - [ ] Vendor rating/score
   - [ ] Performance metrics
2. **Unique Options**:
   - [ ] Submit Price (with auto-filled market)
   - [ ] My Store
   - [ ] Customer Reviews
   - [ ] Payment Info
   - [ ] Reports

#### Verify Vendor Submission
1. Submit a price
2. **Expected Status**: May show as "Verified" automatically (trusted vendor)
3. Check "My Submissions" shows vendor badge

---

## 📊 COMPLETE WORKFLOW #3: AGENT OVERVIEW (5 minutes)

#### Setup: Create Agent Account
1. **Sign Up** with:
   - Name: `Test Agent 1`
   - Email: `testagent1.{{timestamp}}@gmail.com`
   - Role: `Agent`
   - Assigned Region: `Kigali` (or any)
2. **Verify Email**

#### Agent Dashboard Features
1. **Should See**:
   - [ ] Assigned region/market
   - [ ] Pending submissions to review
   - [ ] Vendor verification queue
   - [ ] Reports dashboard
2. **Capabilities**:
   - [ ] Approve/reject prices
   - [ ] Verify vendor information
   - [ ] View regional analytics

---

## ✅ COMPREHENSIVE TEST CHECKLIST

### Account Management
- [ ] Signup form validates all fields
- [ ] Email verification required and working
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong password fails
- [ ] Password reset works
- [ ] Profile information correct
- [ ] Can update profile
- [ ] Logout clears session

### Price Submission
- [ ] Form has all required fields
- [ ] Validation rejects negative prices
- [ ] Validation rejects missing fields
- [ ] Successful submission shows success message
- [ ] Recent submissions list updated
- [ ] Can edit own submissions (if feature exists)
- [ ] Cannot edit other's submissions
- [ ] Submission timestamps accurate

### Price Comparison
- [ ] Markets ranked correctly (lowest price first)
- [ ] Market list shows correctly
- [ ] Statistical calculations correct:
  - [ ] Minimum price
  - [ ] Maximum price
  - [ ] Average price
  - [ ] Price range
- [ ] Bar chart displays
- [ ] Chart is interactive (hover/tooltip)
- [ ] Legend visible
- [ ] Multiple products can be compared

### AI Predictions
- [ ] Next day prediction appears
- [ ] 7-day forecast shows 7 values
- [ ] Confidence score between 0-100%
- [ ] Predictions within reasonable range (±10% of current)
- [ ] Trend analysis shows direction
- [ ] Recommendation provided
- [ ] Volatility score displayed

### SMS/USSD
- [ ] SMS commands listed
- [ ] PRICE command returns data
- [ ] MARKETS command lists markets
- [ ] PRODUCTS command lists items
- [ ] COMPARE command shows comparison
- [ ] HELP command works
- [ ] SMS response format is readable
- [ ] SMS responses quick (< 30 sec)

### Performance
- [ ] Homepage loads < 2 seconds
- [ ] Dashboard loads < 2 seconds
- [ ] API requests complete < 1 second
- [ ] Charts render smoothly
- [ ] No UI lag or freezing
- [ ] Mobile responsive (if testing mobile)

### Security
- [ ] Email verification enforced
- [ ] JWT token expires after 24 hours
- [ ] Cannot access other users' data
- [ ] Cannot access admin features as consumer
- [ ] Password properly hashed (not visible)
- [ ] CORS headers correct
- [ ] SSL/HTTPS enabled

### Data Integrity
- [ ] Same endpoint returns consistent data
- [ ] Price rankings remain stable
- [ ] Submitted data persists after logout/login
- [ ] Can search/filter prices
- [ ] Pagination works (if applicable)

### Error Handling
- [ ] Invalid email shows error
- [ ] Duplicate email shows error
- [ ] Missing fields show errors
- [ ] Network error handled gracefully
- [ ] 404 pages display properly
- [ ] Error messages are clear

---

## 🎯 TEST RESULT SUMMARY TEMPLATE

**Fill this out after testing**:

```
Test Date: ____________
Tester Name: ____________
Environment: Production (smpmps-test.onrender.com)

RESULTS
═══════════════════════════════════════════════════

Account Management:
  Signup:          ✓ PASS / ❌ FAIL
  Email Verify:    ✓ PASS / ❌ FAIL
  Login:           ✓ PASS / ❌ FAIL
  Logout:          ✓ PASS / ❌ FAIL
  Settings:        ✓ PASS / ❌ FAIL

Price Submission:
  Submit 1 Price:  ✓ PASS / ❌ FAIL
  Submit 5 Prices: ✓ PASS / ❌ FAIL
  View Submission: ✓ PASS / ❌ FAIL
  Validation:      ✓ PASS / ❌ FAIL

Price Comparison:
  View Comparison: ✓ PASS / ❌ FAIL
  Rankings:        ✓ PASS / ❌ FAIL
  Statistics:      ✓ PASS / ❌ FAIL
  Chart Display:   ✓ PASS / ❌ FAIL

AI Predictions:
  Next Day:        ✓ PASS / ❌ FAIL
  7-Day Forecast:  ✓ PASS / ❌ FAIL
  Confidence:      ✓ PASS / ❌ FAIL

SMS/USSD:
  Commands Listed: ✓ PASS / ❌ FAIL
  SMS Test:        ✓ PASS / ❌ FAIL / SKIPPED

Security:
  Email Required:  ✓ PASS / ❌ FAIL
  Wrong Password:  ✓ PASS / ❌ FAIL
  HTTPS Active:    ✓ PASS / ❌ FAIL

Performance:
  Page Load Time:  ✓ PASS / ❌ FAIL
  API Response:    ✓ PASS / ❌ FAIL
  Charts Speed:    ✓ PASS / ❌ FAIL

═══════════════════════════════════════════════════

Total Tests Passed: ______ / 28
Total Tests Failed: ______

ISSUES FOUND:
─────────────────────────────────────────────────
1. [Description]
2. [Description]

RECOMMENDATIONS:
─────────────────────────────────────────────────
1. [Suggestion]
2. [Suggestion]

Tester Signature: ____________    Date: ____________
```

---

## 🚨 CRITICAL ISSUES TO WATCH FOR

| Issue | Impact | Solution |
|-------|--------|----------|
| Email not received | Blocks login | Check spam, whitelist sender |
| Price prediction errors | Feature broken | Ensure 10+ sample prices |
| SMS not responding | Feature unavailable | Check Twilio config |
| Chart not rendering | Visual bug | Check browser console |
| Slow page loads | Poor UX | Check network/backend |
| Cannot submit price | Feature broken | Check auth token validity |

---

## 📞 IF YOU ENCOUNTER ISSUES

### Common Problems & Solutions

**Issue**: "Email not received"
- **Solution**: 
  1. Check Gmail promotions/spam folder
  2. Whitelist `noreply@smpmps.com`
  3. Try different email address
  4. Wait 5 minutes (email can be delayed)

**Issue**: "Password validation error"
- **Solution**: Password must be 8+ chars with uppercase, lowercase, number, symbol

**Issue**: "Price prediction shows 0"
- **Solution**: System needs minimum 10 historical prices to predict

**Issue**: "SMS not working"
- **Solution**: SMS is optional; test other features first

**Issue**: "Chart not displaying"
- **Solution**: 
  1. Press F12 to open developer console
  2. Check for errors
  3. Try different browser
  4. Clear browser cache

---

## ✨ SUCCESS CRITERIA

✅ **COMPLETE SUCCESS**: All 28 tests pass  
✅ **ACCEPTABLE**: 25+ tests pass (minor UI issues)  
⚠️ **NEEDS WORK**: 20-24 tests pass (functional but needs fixes)  
❌ **CRITICAL ISSUES**: < 20 tests pass (blocking issues)

---

**Status**: Ready for hands-on testing  
**Last Updated**: April 3, 2026  
**Duration**: 30-45 minutes
