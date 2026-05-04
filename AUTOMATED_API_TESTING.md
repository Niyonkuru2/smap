# 🤖 AUTOMATED API TESTING GUIDE

## Overview
This document explains how to run automated tests for the SMPMPS API. Two testing approaches are provided:

1. **Node.js Test Suite** - For complete automated testing
2. **Postman Collection** - For manual/interactive testing

---

## 📋 METHOD 1: Node.js Automated Test Suite

### Setup

#### Step 1: Install Dependencies
```bash
cd c:\Users\user\Desktop\Project10\SMPMPS-test-1
npm install axios
```

#### Step 2: Verify axios Installation
```bash
npm list axios
```

Expected output:
```
└── axios@1.x.x
```

### Running Tests

#### Option A: Test Production Environment
```bash
# Set environment variable
$env:API_URL = "https://smpmps-test.onrender.com/api"

# Run tests
node api-test-suite.js
```

#### Option B: Test Local Environment
```bash
# Set environment variable
$env:API_URL = "http://localhost:3001/api"

# Run tests
node api-test-suite.js
```

### Test Results Interpretation

The test suite outputs formatted results:

```
✓ PASS | Signup | User registered successfully
✗ FAIL | Login | Authentication failed
```

**Legend**:
- ✓ **GREEN** = Test passed
- ✗ **RED** = Test failed
- Test count and success percentage at end

### Test Coverage

The automated suite tests:

1. **Authentication** (3 tests)
   - Signup with valid data
   - Login with valid credentials
   - Reject invalid credentials

2. **Price Submission** (3 tests)
   - Submit valid price
   - Validate negative price rejection
   - Validate missing fields detection

3. **Price Comparison** (2 tests)
   - Retrieve market comparison
   - Verify response structure
   - Calculate statistics

4. **AI Prediction** (5 tests)
   - Next-day price prediction
   - Confidence score validation
   - 7-day forecast retrieval
   - All ML models present
   - Volatility calculation

5. **SMS/USSD** (3 tests)
   - SMS query handler
   - SMS help endpoint
   - Invalid command handling

6. **Products & Markets** (4 tests)
   - List all products
   - Get specific product
   - List all markets
   - Get specific market

7. **Price History & Trends** (2 tests)
   - Get price history
   - Calculate price trends

8. **Error Handling** (4 tests)
   - 404 Not Found
   - Missing field validation
   - Invalid data type validation
   - Rate limiting

9. **Response Time** (5 tests)
   - Product endpoint speed
   - Market endpoint speed
   - Comparison endpoint speed
   - Prediction endpoint speed
   - Forecast endpoint speed

10. **Data Consistency** (2 tests)
    - Same endpoint consistency
    - Price ranking consistency

**Total**: 33+ automated checks

---

## 🔄 METHOD 2: Postman Collection

### Setup

#### Step 1: Download Postman
https://www.postman.com/downloads/

#### Step 2: Import Collection
1. Open Postman
2. Click **"Import"**
3. Select **"SMPMPS-API-Tests.postman_collection.json"**
4. Click **"Import"**

#### Step 3: Configure Environment Variables
1. Click **"Environments"** (top right)
2. Click **"Edit"** on selected environment
3. Set variables:
   ```
   base_url = https://smpmps-test.onrender.com/api
   auth_token = [your-jwt-token-here]
   ```

### Running Tests in Postman

#### Option A: Run Single Request
1. Open collection folder
2. Select request (e.g., "Sign Up")
3. Click **"Send"**
4. View response in "Body" tab

#### Option B: Run Test Suite (Runner)
1. Click **"Runner"** button
2. Select collection
3. Click **"Run SMPMPS API Testing Collection"**
4. View results: Pass/Fail for each request

### Available Requests

**Authentication**
- Sign Up
- Login
- Login - Invalid Credentials

**Price Submission**
- Submit Price
- Submit Price - Negative Price (error test)
- Submit Price - Missing Fields (error test)
- Get Recent Prices

**Price Comparison**
- Compare Markets
- Compare Markets - Invalid Product

**AI Prediction**
- Predict Price - Next Day
- Forecast - 7 Days
- Forecast - 14 Days
- Forecast - 30 Days

**SMS/USSD**
- SMS Query - PRICE
- SMS Query - MARKETS
- SMS Query - COMPARE
- SMS Query - PRODUCTS
- SMS Query - HELP
- SMS Help Endpoint

**Products & Markets**
- Get All Products
- Get Specific Product
- Get All Markets
- Get Specific Market

**Price History & Trends**
- Get Price History
- Get Price Trend - 30 Days
- Get Price Trend - 7 Days

---

## 📊 EXPECTED TEST RESULTS

### Successful Run Example
```
✓ PASS | Signup | User registered successfully
✓ PASS | Login | User authenticated
✓ PASS | Submit price | Price submitted successfully
✓ PASS | Get price comparison | Comparison data retrieved
✓ PASS | Get price prediction | Prediction retrieved
✓ PASS | SMS query handler | Query processed
────────────────────────────────────────────────
Passed: 33
Failed: 0
Success Rate: 100.0%
```

### Troubleshooting Failed Tests

| Test | Failure | Solution |
|------|---------|----------|
| Signup fails | Email validation error | Verify email format |
| Login fails | No user found | Signup first |
| Submit price fails | Unauthorized (401) | Use valid JWT token |
| Prediction returns 0 | Insufficient data | Submit 10+ prices |
| SMS not working | Twilio config error | Verify TWILIO_* env vars |
| Market response empty | No prices submitted | Add test prices first |

---

## 🔧 CONFIGURATION

### Environment Variables

Create or update `.env` with:

```bash
# API Configuration
API_URL=https://smpmps-test.onrender.com/api

# Test Data
TEST_EMAIL=testuser@test.com
TEST_PASSWORD=TestPass123!
TEST_PHONE=+250788123456

# Twilio (for SMS tests)
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+250728845885
```

### Database Seeding (Optional)

Before running tests, ensure seed data exists:

```bash
cd backend
npm run seed
```

This creates:
- Sample products (tomato, onion, cabbage, potato, beans)
- Sample markets (Kigali, Kimironko, Musanze, Gasabo)
- Initial price data

---

## 📈 CONTINUOUS TESTING

### Setup GitHub Actions (Optional)

Create `.github/workflows/api-tests.yml`:

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install axios
      - run: API_URL=${{ secrets.API_URL }} node api-test-suite.js
```

This automatically runs tests on every push.

---

## 🎯 QUICK TESTING CHECKLIST

- [ ] Install axios: `npm install axios`
- [ ] Set API_URL environment variable
- [ ] Run: `node api-test-suite.js`
- [ ] All tests pass (100% success rate)
- [ ] Check response times (< 3 seconds each)
- [ ] Review any failed tests
- [ ] Document failures
- [ ] Fix issues and re-run

---

## 📝 TEST OUTPUT ANALYSIS

### Success Metrics
- ✅ All 30+ tests pass
- ✅ Response time < 1 second per endpoint
- ✅ No HTTP errors (4xx, 5xx)
- ✅ Data consistency verified
- ✅ Error handling working

### Performance Benchmarks
| Endpoint | Target | Acceptable |
|----------|--------|-----------|
| Products | < 500ms | < 1s |
| Markets | < 500ms | < 1s |
| Prediction | < 1s | < 2s |
| Forecast | < 1s | < 2s |
| Comparison | < 500ms | < 1s |

---

## 🐛 DEBUGGING TESTS

### Enable Verbose Output
Modify `api-test-suite.js` line 10:
```javascript
const VERBOSE = true; // Show detailed request/response
```

### Check Individual Endpoint
Replace test function calls with:
```bash
curl -X GET https://smpmps-test.onrender.com/api/products
curl -X GET https://smpmps-test.onrender.com/predict/price/1/1
```

### View Backend Logs
```bash
cd backend
npm start
# Watch for error messages
```

---

## 📞 SUPPORT

**If tests fail**:
1. Check `PRODUCTION_TESTING_GUIDE.md` for manual verification
2. Review API response in browser/Postman
3. Check backend logs: `npm start`
4. Verify all environment variables set
5. Contact: josianeuwamahoro55@gmail.com

---

## ✅ VALIDATION CHECKLIST

Before considering testing complete:

- [ ] All 30+ tests pass
- [ ] No timeout errors
- [ ] All responses valid JSON
- [ ] Data consistency verified
- [ ] Error handling correct
- [ ] Response times acceptable
- [ ] SMS/USSD functional
- [ ] ML models returning predictions
- [ ] Database queries working
- [ ] JWT tokens valid

---

**Status**: Ready for automated testing  
**Last Updated**: April 3, 2026  
**Maintained By**: GitHub Copilot
