# PRODUCTION VERIFICATION & TESTING GUIDE
**SMPMPS - Complete Production Testing Script**
**Use this guide to verify all components are working in production**

---

## 🧪 SECTION 1: BASIC HEALTH CHECKS

### Health Endpoint
```bash
# Test API responsiveness
curl -i https://smpmps-test.onrender.com/health

# Expected Response:
# HTTP/1.1 200 OK
# {
#   "status": "operational",
#   "timestamp": "2026-04-03T...",
#   "uptime": 12345
# }
```

### Version & Build Info
```bash
curl -i https://smpmps-test.onrender.com/api/version

# Expected Response:
# HTTP/1.1 200 OK
# {
#   "version": "1.0.0",
#   "environment": "production",
#   "buildDate": "2026-04-03"
# }
```

---

## 🔐 SECTION 2: AUTHENTICATION FLOW TESTING

### Test 1: Send Verification Email
```bash
curl -i -X POST https://smpmps-test.onrender.com/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "prodtest001@example.com"}'

# Expected Response (200):
# {
#   "success": true,
#   "message": "Verification email sent",
#   "email": "prodtest001@example.com"
# }

# ⏸️ Wait for email to arrive (check inbox and spam folder)
# 🔑 Extract verification code from email
```

### Test 2: Verify Email Code
```bash
# Check email for 6-digit code (example: 123456)
curl -i -X POST https://smpmps-test.onrender.com/auth/verify-email-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prodtest001@example.com",
    "code": "123456"
  }'

# Expected Response (200):
# {
#   "success": true,
#   "message": "Email verified",
#   "sessionToken": "session_xxxx"
# }

# 🔑 Save sessionToken for next step
```

### Test 3: Complete Signup
```bash
curl -i -X POST https://smpmps-test.onrender.com/auth/complete-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prodtest001@example.com",
    "password": "SecureTest123!@",
    "name": "Production Test User",
    "role": "consumer",
    "phone": "+250788123456",
    "district": "Gasabo"
  }'

# Expected Response (200):
# {
#   "success": true,
#   "message": "Signup complete",
#   "user": {
#     "id": 123,
#     "email": "prodtest001@example.com",
#     "name": "Production Test User",
#     "role": "consumer"
#   },
#   "token": "eyJhbGciOiJIUzI1NiIs..."
# }

# 🔑 Save token for authenticated requests
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Test 4: Login with Credentials
```bash
curl -i -X POST https://smpmps-test.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prodtest001@example.com",
    "password": "SecureTest123!@"
  }'

# Expected Response (200):
# {
#   "success": true,
#   "message": "Login successful",
#   "user": { ... },
#   "token": "eyJhbGciOiJIUzI1NiIs..."
# }

# Should match the token from signup
```

### Test 5: Verify JWT Token Validity
```bash
# Using token from login
curl -i -H "Authorization: Bearer $JWT_TOKEN" \
  https://smpmps-test.onrender.com/user/profile

# Expected Response (200):
# {
#   "success": true,
#   "user": {
#     "id": 123,
#     "email": "prodtest001@example.com"
#   }
# }
```

### Test 6: Rate Limiting (Authentication)
```bash
# Try 11 login attempts rapidly with wrong password
for i in {1..11}; do
  curl -X POST https://smpmps-test.onrender.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "prodtest001@example.com", "password": "wrongpassword"}'
  echo "Attempt $i"
done

# Expected: Requests 1-10 succeed, request 11 returns:
# HTTP/1.1 429 Too Many Requests
# {
#   "error": "Rate limit exceeded",
#   "message": "Too many requests from this IP",
#   "retryAfter": 30
# }
```

---

## 📦 SECTION 3: DATA ENDPOINTS

### Test 1: Get All Products
```bash
curl -i https://smpmps-test.onrender.com/api/products

# Expected Response (200):
# {
#   "success": true,
#   "data": [
#     {"id": 1, "name": "Maize", "category": "Grains", "unit": "kg"},
#     {"id": 2, "name": "Rice (White)", "category": "Grains", "unit": "kg"},
#     // ... 33 more products
#   ],
#   "total": 35
# }
```

### Test 2: Get All Markets
```bash
curl -i https://smpmps-test.onrender.com/api/markets

# Expected Response (200):
# {
#   "success": true,
#   "data": [
#     {
#       "id": "kigali",
#       "name": "Kigali Central Market",
#       "province": "Kigali City",
#       "district": "Gasabo",
#       "latitude": -1.9505,
#       "longitude": 30.0619
#     },
#     // ... 19 more markets
#   ],
#   "total": 20
# }
```

### Test 3: Get Live Prices
```bash
curl -i https://smpmps-test.onrender.com/api/prices/live?market=kigali&limit=5

# Expected Response (200):
# {
#   "success": true,
#   "market": "kigali",
#   "prices": [
#     {
#       "productId": 1,
#       "productName": "Maize",
#       "price": 750,
#       "currency": "RWF",
#       "unit": "kg",
#       "timestamp": "2026-04-03T..."
#     },
#     // ... more prices
#   ]
# }
```

### Test 4: Get Specific Product
```bash
curl -i https://smpmps-test.onrender.com/api/products/1

# Expected Response (200):
# {
#   "success": true,
#   "product": {
#     "id": 1,
#     "name": "Maize",
#     "category": "Grains",
#     "unit": "kg",
#     "description": "..."
#   }
# }
```

---

## 💰 SECTION 4: PRICE SUBMISSION (VENDOR FLOW)

### Test 1: Submit New Price
```bash
curl -i -X POST https://smpmps-test.onrender.com/prices/submit \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "marketId": "kigali",
    "price": 850,
    "unit": "kg",
    "notes": "Fresh maize from Rwamagana"
  }'

# Expected Response (201):
# {
#   "success": true,
#   "message": "Price submitted successfully",
#   "priceId": 456,
#   "status": "pending"
# }
```

### Test 2: Get Price History (Vendor)
```bash
curl -i -H "Authorization: Bearer $JWT_TOKEN" \
  https://smpmps-test.onrender.com/prices/my-submissions

# Expected Response (200):
# {
#   "success": true,
#   "submissions": [
#     {
#       "id": 456,
#       "productName": "Maize",
#       "marketName": "Kigali Central Market",
#       "price": 850,
#       "status": "pending",
#       "submittedAt": "2026-04-03T..."
#     }
#   ]
# }
```

### Test 3: Check Price Approval (Admin View)
```bash
# Create admin first or use existing admin token
curl -i -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://smpmps-test.onrender.com/admin/prices/pending

# Expected Response (200):
# {
#   "success": true,
#   "pendingPrices": [
#     {
#       "id": 456,
#       "vendor": "Production Test User",
#       "product": "Maize",
#       "market": "Kigali Central Market",
#       "price": 850,
#       "status": "pending"
#     }
#   ]
# }
```

---

## 🔍 SECTION 5: PRICE COMPARISON

### Test 1: Compare Prices Across Markets
```bash
curl -i https://smpmps-test.onrender.com/prices/compare-markets/1

# Expected Response (200):
# {
#   "success": true,
#   "productId": 1,
#   "productName": "Maize",
#   "markets": [
#     {
#       "marketId": "kigali",
#       "marketName": "Kigali Central Market",
#       "price": 750,
#       "vendor": "John Doe",
#       "submittedAt": "2026-04-03T..."
#     },
#     {
#       "marketId": "muhima",
#       "marketName": "Muhima Market",
#       "price": 800
#     }
#   ],
#   "statistics": {
#     "minPrice": 750,
#     "maxPrice": 800,
#     "avgPrice": 775,
#     "priceRange": 50
#   }
# }
```

### Test 2: Search Products
```bash
curl -i "https://smpmps-test.onrender.com/api/search?q=tom&type=product"

# Expected Response (200):
# {
#   "success": true,
#   "query": "tom",
#   "results": [
#     {
#       "id": 10,
#       "name": "Tomatoes",
#       "category": "Vegetables"
#     }
#   ]
# }
```

---

## 🤖 SECTION 6: AI/ML PREDICTION

### Test 1: Get Price Prediction (Next Day)
```bash
# Note: Requires 10+ historical prices for this product/market
curl -i https://smpmps-test.onrender.com/predict/price/1/kigali

# Expected Response (200) - IF DATA EXISTS:
# {
#   "success": true,
#   "prediction": {
#     "productId": 1,
#     "marketId": "kigali",
#     "predictedPrice": 845,
#     "confidence": 0.92,
#     "range": { "min": 800, "max": 890 },
#     "timestamp": "2026-04-03T..."
#   },
#   "models": {
#     "movingAverage": 840,
#     "exponentialSmoothing": 850,
#     "linearRegression": 848,
#     "seasonalDecomposition": 845
#   }
# }

# Expected Response (400) - NO DATA YET:
# {
#   "success": false,
#   "message": "Insufficient historical data for prediction",
#   "required": 10,
#   "current": 0
# }
# This is NORMAL - will resolve as more prices submitted
```

### Test 2: Get 7-Day Forecast
```bash
curl -i "https://smpmps-test.onrender.com/forecast/1/kigali?days=7"

# Expected Response (200) - IF DATA EXISTS:
# {
#   "success": true,
#   "forecast": [
#     { "day": "2026-04-04", "price": 850 },
#     { "day": "2026-04-05", "price": 855 },
#     // ... 5 more days
#   ]
# }

# Expected Response (400) - NO DATA YET:
# {
#   "success": false,
#   "message": "Insufficient historical data"
# }
```

### Test 3: Detect Price Anomalies
```bash
curl -i https://smpmps-test.onrender.com/prices/anomalies?threshold=2.5

# Expected Response (200):
# {
#   "success": true,
#   "anomalies": [
#     {
#       "priceId": 999,
#       "productName": "Maize",
#       "market": "Kigali",
#       "price": 5000,
#       "avgPrice": 800,
#       "zscore": 8.5,
#       "severity": "critical"
#     }
#   ]
# }
```

---

## 💬 SECTION 7: SMS/USSD INTEGRATION

### Test 1: Send SMS Query
```bash
curl -i -X POST https://smpmps-test.onrender.com/sms/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "PRICE tomato kigali",
    "phone": "+250788123456"
  }'

# Expected Response (200):
# {
#   "success": true,
#   "response": "Tomato prices in Kigali (kg): min 800, max 1200, avg 1000 RWF",
#   "phone": "+250788123456"
# }
```

### Test 2: SMS Help Command
```bash
curl -i -X POST https://smpmps-test.onrender.com/sms/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "HELP",
    "phone": "+250788123456"
  }'

# Expected Response (200):
# {
#   "success": true,
#   "response": "Available commands: PRICE [product] [market], MARKETS, PRODUCTS, COMPARE [product], ALERT [product] [price], HELP"
# }
```

### Test 3: List Markets via SMS
```bash
curl -i -X POST https://smpmps-test.onrender.com/sms/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "MARKETS",
    "phone": "+250788123456"
  }'

# Expected Response (200):
# {
#   "success": true,
#   "response": "Markets: Kigali, Muhima, Kimironko, Nyarugenge, ..."
# }
```

---

## 📱 SECTION 8: REAL-TIME WEBSOCKET

### Test 1: WebSocket Connection
```javascript
// Open browser console on production site
// Or create a test script

const socket = io('https://smpmps-test.onrender.com', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});
```

### Test 2: Subscribe to Price Updates
```javascript
socket.emit('authenticate', {
  userId: 123,
  token: 'eyJhbGciOiJIUzI1NiIs...'
});

socket.emit('subscribe:prices', {
  marketId: 'kigali',
  productId: 1
});

socket.on('price:update', (data) => {
  console.log('💹 Price updated:', data);
  // Example output:
  // { productId: 1, marketId: 'kigali', price: 850, timestamp: '...' }
});
```

### Test 3: Broadcast Test
```javascript
// Should receive market alerts
socket.on('market:alert', (alert) => {
  console.log('🔔 Alert received:', alert);
});

socket.on('user:event', (event) => {
  console.log('👤 User event:', event);
});
```

---

## 👥 SECTION 9: ADMIN ENDPOINTS

### Test 1: Get All Users (Admin Only)
```bash
curl -i -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://smpmps-test.onrender.com/admin/users

# Expected Response (200):
# {
#   "success": true,
#   "users": [
#     {
#       "id": 1,
#       "email": "admin@example.com",
#       "name": "Admin User",
#       "role": "admin",
#       "created": "2026-04-03T..."
#     }
#   ]
# }

# Error if not admin:
# HTTP/1.1 403 Forbidden
# {
#   "error": "Admin access required"
# }
```

### Test 2: Get System Metrics
```bash
curl -i -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://smpmps-test.onrender.com/admin/metrics

# Expected Response (200):
# {
#   "success": true,
#   "metrics": {
#     "totalUsers": 123,
#     "totalSubmissions": 456,
#     "avgResponseTime": 45,
#     "memoryUsage": 512,
#     "uptime": 86400
#   }
# }
```

### Test 3: Get Audit Logs
```bash
curl -i -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://smpmps-test.onrender.com/admin/logs?limit=10"

# Expected Response (200):
# {
#   "success": true,
#   "logs": [
#     {
#       "timestamp": "2026-04-03T...",
#       "action": "user_login",
#       "user": "prodtest001@example.com",
#       "details": "..."
#     }
#   ]
# }
```

---

## 🔍 SECTION 10: ERROR HANDLING VERIFICATION

### Test 1: Invalid Token
```bash
curl -i -H "Authorization: Bearer invalid_token" \
  https://smpmps-test.onrender.com/user/profile

# Expected Response (401):
# {
#   "error": "Unauthorized",
#   "message": "Invalid token"
# }
```

### Test 2: Missing Required Fields
```bash
curl -i -X POST https://smpmps-test.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Expected Response (400):
# {
#   "error": "Validation error",
#   "message": "Missing required field: password"
# }
```

### Test 3: Duplicate Email
```bash
curl -i -X POST https://smpmps-test.onrender.com/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "prodtest001@example.com"}'

# Expected Response (400):
# {
#   "error": "Email already registered",
#   "message": "This email already has an account"
# }
```

### Test 4: Invalid Product ID
```bash
curl -i https://smpmps-test.onrender.com/api/products/99999

# Expected Response (404):
# {
#   "error": "Not found",
#   "message": "Product not found"
# }
```

---

## 📊 SECTION 11: PERFORMANCE TESTING

### Test 1: Response Time
```bash
# Measure response time for health check
time curl https://smpmps-test.onrender.com/health

# Expected: < 500ms
```

### Test 2: Payload Size
```bash
curl -i https://smpmps-test.onrender.com/api/products
# Check headers for "Content-Length"
# Expected: < 50KB (for minified response)
```

### Test 3: Concurrent Requests
```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl https://smpmps-test.onrender.com/health &
done
wait

# Expected: All succeed, minimal delay
```

---

## 🧹 CLEANUP

### Remove Test Data
```bash
# Delete test user (via admin panel or API)
# Or keep for ongoing testing (recommended)
```

---

## ✅ SIGN-OFF CHECKLIST

After running all tests above, verify:
- [ ] Health check responds
- [ ] Email verification sent and received
- [ ] User can signup → login → access profile
- [ ] Products and markets show correctly
- [ ] Price submission works
- [ ] Price comparison calculates correctly
- [ ] SMS queries return results
- [ ] WebSocket connects and receives updates
- [ ] Admin endpoints require authentication
- [ ] Rate limiting blocks excessive requests
- [ ] Error responses are descriptive
- [ ] All responses under 500ms
- [ ] No errors in Render logs

---

## 🚀 PRODUCTION SIGN-OFF

**Date Tested**: ___________
**Tester Name**: ___________
**Status**: ✅ PASSED / ⚠️ ISSUES FOUND

If all tests pass, system is ready for production use.

For issues, reference COMPREHENSIVE_SYSTEM_AUDIT.md for troubleshooting.
