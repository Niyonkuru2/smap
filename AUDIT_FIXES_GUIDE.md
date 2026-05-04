# SMPMPS CODE AUDIT - FIXES & IMPLEMENTATION GUIDE

## Quick Reference: Critical Fixes Needed

### 🔴 CRITICAL - FIX IMMEDIATELY

#### 1. Rotate Credentials
```bash
# Step 1: Regenerate Gmail App Password
# 1. Go to https://myaccount.google.com/apppasswords
# 2. Delete old password
# 3. Generate new one
# 4. Copy new 16-character password

# Step 2: Regenerate Twilio Keys
# 1. Go to https://console.twilio.com/account/auth-tokens
# 2. Rotate Auth Token
# 3. Generate new phone number or use existing

# Step 3: Update environment variables in Render
# 1. Dashboard → SMPMPS → Settings → Environment
# 2. Update EMAIL_PASS with new Gmail app password
# 3. Update TWILIO_AUTH_TOKEN with new token
# 4. Save and redeploy
```

#### 2. Fix JWT Secret Default (backend/src/index.js:117)
```diff
- const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
+ if (!process.env.JWT_SECRET) {
+     console.error('CRITICAL: JWT_SECRET environment variable is not set!');
+     console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
+     process.exit(1);
+ }
+ const JWT_SECRET = process.env.JWT_SECRET;
```

**Action:** 
- Add to `.env`: `JWT_SECRET=<generate-new-with-command-above>`
- Add to Render environment variables

#### 3. Remove Password Logger (backend/src/index.js:124-126)
```diff
- console.log('🔌 Configuring email transporter...');
- console.log('   EMAIL_USER:', process.env.EMAIL_USER);
- console.log('   EMAIL_PASS length:', process.env.EMAIL_PASS.length);

+ if (process.env.NODE_ENV !== 'production') {
+     console.log('🔌 Configuring email transporter...');
+     console.log('   EMAIL_USER:', process.env.EMAIL_USER?.substring(0, 5) + '***');
+     console.log('   EMAIL_PASS length:', process.env.EMAIL_PASS?.length || 0);
+ }
```

#### 4. Fix Duplicate /health Endpoint (backend/src/index.js:219-240)
```diff
- app.get('/health', (req, res) => {
-     res.json({ status: 'healthy', database: 'PostgreSQL', email: transporter ? 'configured' : 'not configured' });
- });
-
- app.get('/health', (req, res) => {
-     res.status(200).json({ 
-         status: 'ok',
-         timestamp: new Date().toISOString(),
-         uptime: process.uptime(),
-         message: 'Backend is running and healthy ✅'
-     });
- });

+ app.get('/health', (req, res) => {
+     res.status(200).json({ 
+         status: 'healthy',
+         message: 'Backend is running and healthy',
+         timestamp: new Date().toISOString(),
+         uptime: process.uptime(),
+         database: 'PostgreSQL',
+         email: transporter ? 'configured' : 'not configured'
+     });
+ });
```

#### 5. Replace In-Memory Maps with Database (Multiple locations)

Create database tables for tokens:
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, code)
);

CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
```

Then replace (backend/src/index.js:510-515):
```diff
- // Store for password reset tokens (in production, use database)
- const passwordResetTokens = new Map();
- const passwordResetCodes = new Map();
- const verificationCodes = new Map();

+ // Use database instead - see migration above
+ // Old Map-based code removed
```

New handler:
```javascript
app.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    // ... validation ...
    
    try {
        const user = await db.users.findByEmail(email);
        if (!user) {
            return res.json({ success: true, message: 'If account exists, you will receive reset link' });
        }
        
        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetCode = String(Math.floor(100000 + Math.random() * 900000));
        
        // Store in database
        await db.query(
            `INSERT INTO password_reset_tokens (token, user_id, email, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
            [resetToken, user.id, email]
        );
        
        await db.query(
            `INSERT INTO verification_codes (email, code, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
            [email, resetCode]
        );
        
        // Send email...
        res.json({ success: true, message: 'If account exists, you will receive reset link' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});
```

#### 6. Fix SQL Injection in User Update (backend/src/database.js:220-245)

```diff
users: {
    update: async (id, updates) => {
+       // Whitelist allowed fields
+       const ALLOWED_FIELDS = ['name', 'phone', 'market_id', 'province', 'district', 'avatar_url', 'role'];
+       const safeKeys = Object.keys(updates).filter(k => ALLOWED_FIELDS.includes(k));
+       
+       if (safeKeys.length === 0) {
+           throw new Error('No valid fields to update');
+       }
        
-       const keys = Object.keys(updates);
+       const keys = safeKeys;
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const values = [...keys.map(k => updates[k]), id];
        const result = await pool.query(
            `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
            values
        );
        return result.rows[0];
    }
},
```

---

### 🟡 HIGH - FIX THIS WEEK

#### 7. Add Input Validation (backend/src/index.js:340)
```javascript
app.post('/auth/complete-signup', async (req, res) => {
    let { email, password, name, role, phone, marketId, province, district, verificationCode } = req.body;
    
    // EMAIL VALIDATION
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required and must be string' });
    }
    email = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // PASSWORD VALIDATION  
    if (!password || password.length < 8) {
        return res.status(400).json({ 
            error: 'Password must be at least 8 characters',
            requirements: [
                'At least 8 characters',
                'Mix of uppercase, lowercase, numbers'
            ]
        });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and numbers' });
    }
    
    // NAME VALIDATION
    if (!name || name.length < 2 || name.length > 255) {
        return res.status(400).json({ error: 'Name must be 2-255 characters' });
    }
    name = name.trim();
    
    // ROLE VALIDATION
    const VALID_ROLES = ['consumer', 'vendor', 'business', 'agent'];
    if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role', validRoles: VALID_ROLES });
    }
    
    // PHONE VALIDATION
    if (phone) {
        if (!/^(\+250|0)[0-9]{9}$/.test(phone.replace(/\s+/g, ''))) {
            return res.status(400).json({ error: 'Invalid Rwanda phone number format' });
        }
    }
    
    // ... rest of logic ...
});
```

#### 8. Fix Database Connection Errors (backend/src/database.js:175-185)
```diff
export async function testConnection() {
    try {
        const result = await pool.query('SELECT 1');
        console.log('✅ PostgreSQL database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed');
-       console.error('Error:', error.message);
+       console.error('   Details:');
+       console.error('   - Host:', process.env.DB_HOST || 'localhost');
+       console.error('   - Port:', process.env.DB_PORT || 5432);
+       console.error('   - Database:', process.env.DB_NAME || 'smpmps_db');
+       console.error('   - User:', process.env.DB_USER || 'postgres');
+       console.error('   - Error Code:', error.code);
+       console.error('   - Error Message:', error.message);
+       
+       if (error.code === 'ECONNREFUSED') {
+           console.error('   → Is PostgreSQL server running?');
+       } else if (error.code === 'ENOTFOUND') {
+           console.error('   → Is DB_HOST correct?');
+       } else if (error.code === '28P01') {
+           console.error('   → Is DB_USER and DB_PASSWORD correct?');
+       }
+       
        return false;
    }
}
```

#### 9. Fix SSL Certificate Validation (backend/src/database.js:18-19)
```diff
const poolConfig = {
    // ...
    ssl: isProduction
-       ? { rejectUnauthorized: false }
+       ? { rejectUnauthorized: true }
        : false
};
```

#### 10. Add Rate Limiting to Public Endpoints (backend/src/index.js:966+)
```javascript
import rateLimit from 'express-rate-limit';

const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                   // 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,      // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,       // Disable `X-RateLimit-*` headers
});

app.get('/products', publicLimiter, async (req, res) => {
    try {
        const products = await db.products.getAll();
        res.json({ products });
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

app.get('/prices', publicLimiter, async (req, res) => {
    // ...
});
```

#### 11. Add `.env.example` (Create new file: backend/.env.example)
```
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (PostgreSQL)
DATABASE_URL=postgres://smpmps_db_user:YOUR_DB_PASSWORD@localhost:5432/smpmps_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smpmps_db
DB_USER=smpmps_db_user
DB_PASSWORD=YOUR_STRONG_PASSWORD

# JWT Authentication
JWT_SECRET=YOUR_LONG_RANDOM_SECRET_KEY_HERE

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD

# Frontend Configuration
FRONTEND_URL=https://smpmps-test.onrender.com

# Twilio SMS
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
```

#### 12. Add to .gitignore (backend/.gitignore)
```
node_modules/
.env
.env.local
.env.*.local
*.log
dist/
build/
.DS_Store
```

---

### 🟠 MEDIUM - FIX THIS SPRINT

#### 13. Add Comprehensive Logging Middleware

Create [backend/src/middlewares/logger.js](backend/src/logger.js):
```javascript
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const LOG_DIR = 'logs';
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

function getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(LOG_DIR, `app-${date}.log`);
}

export function requestLogger(req, res, next) {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        const log = {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?.id || 'anonymous',
            userAgent: req.get('user-agent')?.substring(0, 100)
        };
        
        fs.appendFileSync(getLogFile(), JSON.stringify(log) + '\n');
        
        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${log.requestId}] ${log.method} ${log.path} ${log.status} ${log.duration}`);
        }
        
        return originalJson.call(this, data);
    };
    
    next();
}
```

Usage in index.js:
```javascript
import { requestLogger } from './logger.js';

app.use(requestLogger);
```

#### 14. Add Security Headers Middleware

Create [backend/src/middlewares/security-headers.js](backend/src/security-headers.js):
```javascript
export function securityHeaders(req, res, next) {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Force HTTPS
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy (basic)
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    );
    
    // Remove server header
    res.removeHeader('Server');
    
    next();
}
```

Usage:
```javascript
import { securityHeaders } from './security-headers.js';

app.use(securityHeaders);
```

#### 15. Add Validation Helper

Create [backend/src/validation-helpers.js](backend/src/validation-helpers.js):
```javascript
export const validators = {
    isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    
    isValidPassword: (password) => {
        if (password.length < 8) return false;
        if (!/(?=.*[a-z])/.test(password)) return false;      // lowercase
        if (!/(?=.*[A-Z])/.test(password)) return false;      // uppercase
        if (!/(?=.*\d)/.test(password)) return false;         // digit
        return true;
    },
    
    isValidPhone: (phone) => /^(\+250|0)[0-9]{9}$/.test(phone.replace(/\s+/g, '')),
    
    isValidName: (name) => name && name.length >= 2 && name.length <= 255,
    
    isStrongPassword: (password) => {
        if (password.length < 12) return false;
        if (!/(?=.*[a-z])/.test(password)) return false;
        if (!/(?=.*[A-Z])/.test(password)) return false;
        if (!/(?=.*\d)/.test(password)) return false;
        if (!/(?=.*[@$!%*?&])/.test(password)) return false;   // special char
        return true;
    },
    
    isValidPrice: (price) => {
        const num = Number(price);
        return Number.isFinite(num) && num > 0 && num < 1000000;
    },
    
    isValidProductId: (id) => Number.isInteger(Number(id)) && Number(id) > 0,
};
```

---

## Migration Checklist

- [ ] Generate new JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Rotate Gmail App Password
- [ ] Rotate Twilio Auth Token
- [ ] Update .env with new values
- [ ] Create .env.example file
- [ ] Add .env to .gitignore
- [ ] Run: `git rm --cached .env`
- [ ] Apply all critical fixes
- [ ] Test authentication flow
- [ ] Test rate limiting
- [ ] Deploy to staging first
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Verify health endpoints

---

## Commands to Run

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate secure password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Remove .env from git history (CAREFUL!)
git filter-branch --tree-filter 'rm -f .env' -- --all

# Test connection
npm test -- --testNamePattern="database connection"

# Install rate-limiting package
cd backend && npm install express-rate-limit
```

---

## Environment Variables Required

### Development (.env)
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgres://smpmps_db_user:password@localhost:5432/smpmps_db
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Production (Render)
- Set same variables in Render environment dashboard
- Use strong, random values
- Never commit to git

---

## Deployment Steps

1. **Create branch for fixes**: `git checkout -b fix/critical-audit-issues`
2. **Apply CRITICAL fixes** from this document
3. **Test locally**: `npm run dev`
4. **Run security tests**: See testing section above
5. **Code review** - get approval
6. **Deploy to staging** first
7. **Test in staging**: Login, create user, submit price
8. **Monitor logs**: Watch error logs for 30 minutes
9. **Deploy to production**
10. **Monitor**: Check error tracking for 24 hours

---

## Rollback Plan

If deployment has issues:
```bash
# Get last working commit
git log --oneline

# Revert to previous version
git revert <commit-hash>
git push

# Render auto-redeploys on push
```

---

End of Fixes Guide
