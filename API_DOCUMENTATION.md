# 📚 API Documentation - Smart Market Price System

## Base URL
```
Production: https://api.marketprice.rw
Staging: https://staging-api.marketprice.rw
Local: http://localhost:3001
```

## Authentication

### JWT Token Flow

```
1. User logs in → Server returns JWT token
2. Store token in localStorage
3. Send token in Authorization header for protected endpoints
```

### Header Example
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Endpoints Overview

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Password reset
- `POST /auth/2fa/verify` - Verify 2FA code

### User Profile
- `GET /user/profile` - Get current user
- `PUT /user/profile` - Update profile
- `GET /user/dashboard` - Dashboard data
- `PUT /user/settings` - Update settings

### Prices
- `GET /prices` - List all prices
- `GET /prices/:id` - Get price detail
- `POST /prices` - Submit price (vendor/agent)
- `PUT /prices/:id` - Update price
- `DELETE /prices/:id` - Delete price

### Markets
- `GET /markets` - List all markets
- `GET /markets/:id` - Market detail
- `GET /markets/nearby` - Nearby markets
- `POST /markets` - Create market (admin)
- `PUT /markets/:id` - Update market

### Products
- `GET /products` - List all products
- `GET /products/:id` - Product detail
- `GET /products/category/:categoryId` - By category
- `POST /products` - Create product (admin)

### Analytics
- `GET /analytics/price-trends` - Price trends
- `GET /analytics/forecast` - Price forecast
- `GET /analytics/dashboard` - Analytics dashboard

### Admin
- `GET /admin/users` - List users
- `GET /admin/submissions` - Price submissions
- `POST /admin/submissions/:id/approve` - Approve price
- `POST /admin/submissions/:id/reject` - Reject price
- `GET /admin/reports` - Reports
- `GET /admin/audit-logs` - Audit logs

---

## Authentication Endpoints

### Register Account
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "consumer", // consumer, vendor, business, agent, admin
  "phone": "+250788123456"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "consumer",
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "consumer"
  }
}
```

---

## Price Submission

### Submit Price
```http
POST /prices
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod-uuid",
  "marketId": "market-uuid",
  "price": 5000,
  "quantity": 50,
  "unit": "kg",
  "notes": "Fresh tomatoes",
  "imageUrl": "https://..."
}
```

**Response (201):**
```json
{
  "id": "price-uuid",
  "productId": "prod-uuid",
  "marketId": "market-uuid",
  "price": 5000,
  "status": "pending",
  "submittedBy": "vendor-uuid",
  "submittedAt": "2026-03-30T10:30:00Z"
}
```

### Get Prices
```http
GET /prices?market=market-uuid&product=prod-uuid&limit=20&offset=0
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "price-uuid",
      "product": { "id": "...", "name": "Tomato" },
      "market": { "id": "...", "name": "Kimironko" },
      "price": 5000,
      "vendor": { "id": "...", "name": "John" },
      "submittedAt": "2026-03-30T10:30:00Z",
      "status": "approved"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

## Analytics

### Price Trends
```http
GET /analytics/price-trends?productId=prod-uuid&marketId=market-uuid&days=30
Authorization: Bearer <token>
```

**Response:**
```json
{
  "productId": "prod-uuid",
  "marketId": "market-uuid",
  "timePeriod": "30 days",
  "data": [
    {
      "date": "2026-03-01",
      "averagePrice": 4800,
      "minPrice": 4500,
      "maxPrice": 5200,
      "submissions": 45
    }
  ],
  "trend": "increasing", // increasing, decreasing, stable
  "percentChange": 5.2
}
```

### Price Forecast
```http
GET /analytics/forecast?productId=prod-uuid&days=7
Authorization: Bearer <token>
```

**Response:**
```json
{
  "productId": "prod-uuid",
  "forecast": [
    {
      "date": "2026-03-31",
      "predictedPrice": 5200,
      "confidence": 0.87,
      "range": [5000, 5400]
    }
  ],
  "model": "lstm_v2",
  "accuracy": 0.92
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "details": [
    { "field": "price", "message": "Price must be positive" }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

**Limits:**
- 100 requests per minute (regular users)
- 1000 requests per minute (admin)
- 10 requests per minute (login endpoint)

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648470000
```

---

## WebSocket Events (Real-time)

### Connect
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Events

**Price Updated**
```javascript
socket.on('price:updated', (data) => {
  console.log('New price:', data);
});
```

**User Online**
```javascript
socket.on('user:online', (data) => {
  console.log('User came online:', data);
});
```

**Notification**
```javascript
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

---

## Code Examples

### JavaScript/TypeScript
```javascript
// Fetch prices
const response = await fetch('http://localhost:3001/prices', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const prices = await response.json();
```

### cURL
```bash
curl -X GET http://localhost:3001/prices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:3001/prices',
    headers=headers
)
prices = response.json()
```

---

## API Versioning

Current version: **v1**

Future versions will use:
```
GET /api/v2/prices
POST /api/v2/auth/login
```

---

## Support

- **Issues:** GitHub Issues
- **Email:** api@marketprice.rw
- **Status:** https://status.marketprice.rw
