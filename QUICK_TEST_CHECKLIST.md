# 🎯 QUICK REFERENCE: USER WORKFLOW TESTING

**App URL**: https://smpmps-test.onrender.com/  
**Testing Duration**: 30-45 min  
**Test Date**: ________________

---

## 📋 QUICK TEST CHECKLIST

### Phase 1: Account Setup (5 min)
- [ ] Click "Sign Up"
- [ ] Enter: Name, Email, Phone, Role (Consumer), Password
- [ ] Check email → Copy verification code
- [ ] Paste code in app → Verify
- [ ] **Expected**: ✓ "Email verified successfully"

### Phase 2: Login (2 min)
- [ ] Go to login page
- [ ] Enter email & password
- [ ] Click "Login"
- [ ] **Expected**: ✓ Dashboard loads

### Phase 3: Submit Prices (5 min)
**Submit 5 prices** with this data:

| Product | Market | Price | Unit | Status |
|---------|--------|-------|------|--------|
| Tomato | Kigali Central | 850 | kg | ✓ |
| Onion | Kimironko | 450 | kg | ✓ |
| Cabbage | Kigali Central | 600 | kg | ✓ |
| Potato | Musanze | 520 | kg | ✓ |
| Beans | Gasabo | 1200 | kg | ✓ |

- [ ] Each submission shows "✓ Success"
- [ ] Go to "My Submissions" → All 5 visible

### Phase 4: Price Comparison (5 min)
**For each product** (Tomato, Onion, Cabbage, Potato, Beans):
- [ ] Click "Price Comparison"
- [ ] Select product
- [ ] **Verify displays**:
  - [ ] Market rankings (lowest → highest)
  - [ ] Statistics: Min, Max, Average, Range
  - [ ] Bar chart with prices

### Phase 5: AI Predictions (3 min)
- [ ] Click "Predictions" section
- [ ] Select "Tomato"
- [ ] **Verify displays**:
  - [ ] Tomorrow's predicted price
  - [ ] Confidence score (0-100%)
  - [ ] 7-day forecast table
  - [ ] Trend direction

### Phase 6: Security Tests (3 min)
- [ ] Try wrong password → **Expected**: ❌ Error
- [ ] Click "Settings" → Profile info visible
- [ ] Click "Logout" → Session ends
- [ ] Try accessing dashboard without login → Redirected to login

### Phase 7: SMS/USSD (5 min)
- [ ] Find "SMS Commands" section
- [ ] **Verify these commands listed**:
  - PRICE [product]
  - MARKETS
  - PRODUCTS
  - COMPARE [product]
  - HELP

---

## 📌 TEST ACCOUNTS TO CREATE

### Consumer Account
```
Email: testconsumer1_[timestamp]@gmail.com
Password: SecurePass123!
Phone: +250788765432
Role: Consumer
```

### Vendor Account (Optional)
```
Email: testvendor1_[timestamp]@gmail.com
Password: SecurePass123!
Phone: +250788765433
Role: Vendor
Market: Kimironko
```

### Agent Account (Optional)
```
Email: testagent1_[timestamp]@gmail.com
Password: SecurePass123!
Phone: +250788765434
Role: Agent
```

---

## 🎯 CRITICAL CHECKS

✅ **MUST-HAVES** (all should pass):

- [ ] Signup works
- [ ] Email verification required
- [ ] Cannot login without verification
- [ ] Can submit prices
- [ ] Price comparison shows rankings
- [ ] AI predictions display
- [ ] Wrong password rejected
- [ ] Logout works

⚠️ **IMPORTANT** (most should pass):

- [ ] All 5 prices submitted
- [ ] Statistics calculated correctly
- [ ] Chart displays smoothly
- [ ] 7-day forecast shows data
- [ ] SMS commands listed

🔧 **NICE-TO-HAVE** (optional):

- [ ] Mobile responsive
- [ ] SMS sending works
- [ ] 2FA option available
- [ ] Price history graphed

---

## 🚀 SUCCESS CRITERIA

✅ **PASS** if:
- 8/8 must-haves work
- 4/5 important items work
- No critical errors

⚠️ **NEEDS WORK** if:
- < 8 must-haves work
- > 2 critical features broken

---

## 🐛 QUICK TROUBLESHOOTING

| Issue | Fix |
|-------|-----|
| Email not received | Check spam; wait 5 min |
| Can't login | Verify email first |
| Price submission fails | Check auth token/login |
| No predictions | Need 10+ sample prices |
| Chart missing | Open console (F12); look for errors |

---

## 📝 NOTES SECTION

```
Issues Found:
_________________________________________________________________________
_________________________________________________________________________

Suggestions:
_________________________________________________________________________
_________________________________________________________________________

Overall Rating: [ ] Excellent  [ ] Good  [ ] Needs Work  [ ] Critical Issues

Tested By: ________________     Date: ________________
```

---

## ⏱️ TIMING ESTIMATE

- Signup: 5 min
- Login + Dashboard: 2 min
- Price Submission (5 items): 5 min
- Price Comparison (5 products): 5 min
- AI Predictions: 3 min
- Security: 3 min
- SMS Verification: 2 min
- **TOTAL: ~25-30 minutes**

---

**Start testing**: https://smpmps-test.onrender.com/  
**Report issues** if you find them  
**Success = All critical items on this list pass** ✅
