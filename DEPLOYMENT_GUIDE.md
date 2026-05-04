# 🚀 DEPLOYMENT GUIDE - Smart Market Price System

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Render.com Deployment](#rendercom-deployment)
4. [Environment Configuration](#environment-configuration)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Local Development

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Setup

```bash
cd local_market_price_checker

# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your local settings
```

---

## Docker Deployment

### Build and Run Locally

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Access services:
# - Frontend: http://localhost:80
# - Backend: http://localhost:3001
# - pgAdmin: http://localhost:5050
# - Redis: localhost:6379
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Remove All Data
```bash
docker-compose -f docker-compose.prod.yml down -v
```

---

## Render.com Deployment

### Prerequisites
- GitHub account with repository
- Render account
- PostgreSQL database (provided by Render)

### Step 1: Prepare Repository

```bash
# Ensure render.yaml is in project root
# Commit all changes
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Connect on Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Select your GitHub repository
4. Click "Deploy Blue Print"
5. Render will:
   - Create PostgreSQL database
   - Deploy backend service
   - Deploy frontend service
   - Provision domains

### Step 3: Configure Environment Variables

**In Render Dashboard:**

1. Go to Backend Service → Environment
2. Add these variables:

```
NODE_ENV=production
JWT_SECRET=<generate-secure-key>
DATABASE_URL=<auto-populated>
VITE_API_URL=https://<your-backend>.onrender.com
EMAIL_FROM=noreply@marketprice.rw
TWILIO_ACCOUNT_SID=<your-account>
TWILIO_AUTH_TOKEN=<your-token>
```

### Step 4: Deploy

- Render auto-deploys on `git push` to main
- Check deployment status in Render dashboard
- Monitor logs in real-time

### Step 5: Access Application

```
Frontend: https://<your-frontend>.onrender.com
Backend API: https://<your-backend>.onrender.com
Database: Managed by Render
```

---

## Railway.app Deployment (Alternative)

### Step 1: Create Account
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"

### Step 2: Configure Services

**Backend Service:**
```bash
# Service name: backend
# Root directory: local_market_price_checker/backend
# Start command: npm start
# Port: 3001
```

**Frontend Service:**
```bash
# Service name: frontend
# Root directory: local_market_price_checker/frontend
# Build command: npm run build
# Start command: npm run preview
# Port: 80
```

**Database Service:**
```bash
# Add PostgreSQL plugin
# Railway auto-populates DATABASE_URL
```

### Step 3: Environment Variables
Set in Railway dashboard for each service

### Step 4: Deploy
```bash
npm install -g @railway/cli
railway up
```

---

## Environment Configuration

### Production (.env.production)

```env
# Server
PORT=10000
NODE_ENV=production

# Database
DATABASE_URL=postgres://user:pass@host:5432/market_prices

# Security
JWT_SECRET=<generate-random-64-char-string>
CORS_ORIGIN=https://your-domain.com
SESSION_SECRET=<generate-random-string>

# Email (Gmail)
EMAIL_FROM=noreply@marketprice.rw
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<app-specific-password>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Frontend
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com

# Features
FEATURES_SMS=true
FEATURES_EMAIL=true
FEATURES_2FA=true
FEATURES_PAYMENTS=true
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## CI/CD Pipeline

### GitHub Actions

The `.github/workflows/ci-cd.yml` automatically:

1. **On Pull Request:**
   - Lint code
   - Run tests
   - Build frontend
   - Check for errors

2. **On Push to Main:**
   - Run all tests
   - Build production bundle
   - Deploy to Render (if configured)

### Enable Auto-Deploy
```yaml
# In render.yaml
deployOnPush: true
branch: main
```

---

## Production Checklist

- [ ] All environment variables configured
- [ ] Database backed up
- [ ] SSL/TLS certificate enabled
- [ ] CORS configured for frontend domain
- [ ] Email service configured
- [ ] SMS service credentials added
- [ ] Error logging enabled
- [ ] Monitoring setup (Sentry/NewRelic)
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database indexed
- [ ] Logs rotation configured
- [ ] Backup strategy in place

---

## Monitoring & Troubleshooting

### Check Service Status

**Render:**
```
Visit: https://status.render.com
```

**Local Docker:**
```bash
docker-compose ps
docker logs <container-name>
```

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** 
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

#### 2. Frontend can't reach Backend
```
Error: Failed to fetch /api/prices
```
**Solution:**
- Update VITE_API_URL in frontend
- Check CORS settings in backend
- Verify backend URL is correct

#### 3. Build Fails on Render
```
Error: node_modules: no such file
```
**Solution:**
- Ensure render.yaml has correct `root` path
- Check buildCommand includes `npm install`
- Commit package-lock.json

### View Logs

**Render:**
- Dashboard → Service → Logs

**Docker:**
```bash
docker-compose logs backend -f
docker-compose logs frontend -f
```

### Performance Optimization

```bash
# Check bundle size
npm run build --analyze

# Optimize images
npx imagemin frontend/src/assets/* --out-dir=frontend/src/assets

# Profile performance
npm run build -- --profile
```

---

## Backup & Recovery

### Database Backup (PostgreSQL)

```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

### Render Backup
- Render auto-backups PostgreSQL
- Access in dashboard: Database → Backups

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Node.js Docs:** https://nodejs.org/docs/

---

**Need Help?** Check the troubleshooting section or review service logs.
