# 🚀 Quick Start Guide - Deploy in 5 Minutes

## Option 1: Deploy on Render (Easiest - 2 minutes)

### Step 1: Prepare GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Render
1. Go to **[render.com](https://render.com)**
2. Click **"New +" → "Blueprint"**
3. Select your GitHub repo
4. Click **"Deploy"**
5. Wait 3-5 minutes ✅

**Your app is live!**
```
Frontend: https://<your-frontend>.onrender.com
API: https://<your-backend>.onrender.com
```

---

## Option 2: Deploy with Docker (Local/VPS - 5 minutes)

### Prerequisites
- Docker & Docker Compose installed
- Server with 2GB+ RAM

### Step 1: Clone or upload project
```bash
git clone <your-repo>
cd LMCP-test
```

### Step 2: Update environment
```bash
cp .env.production.example .env.production
# Edit .env.production with your values
nano .env.production
```

### Step 3: Start services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Access app
```
Frontend: http://your-server-ip
API: http://your-server-ip:3001
```

**Check status:**
```bash
docker-compose ps
docker logs market-price-api -f
```

---

## Option 3: Deploy on Railway (Alternative - 3 minutes)

### Step 1: Go to Railway
1. Visit **[railway.app](https://railway.app)**
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Choose your repo

### Step 2: Services auto-created
- Backend service (Node.js)
- Frontend service (React)
- Database (PostgreSQL)

### Step 3: Done!
Railway handles everything automatically ✅

---

## Option 4: Manual VPS Deployment (Advanced)

### Step 1: Connect to VPS
```bash
ssh root@your-vps-ip
```

### Step 2: Install dependencies
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx
```

### Step 3: Clone project
```bash
git clone <your-repo>
cd LMCP-test/local_market_price_checker
```

### Step 4: Setup backend
```bash
cd backend
npm install
npm run build
# Start with PM2
npm install -g pm2
pm2 start src/index.js --name "api"
```

### Step 5: Setup frontend
```bash
cd ../frontend
npm install
npm run build
# Serve with Nginx
sudo cp -r dist /var/www/html/app
```

### Step 6: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/html/app;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

Reload:
```bash
sudo systemctl reload nginx
```

---

## Verify Deployment

### Check Frontend
```bash
curl https://your-frontend.onrender.com
# Should return HTML
```

### Check Backend  
```bash
curl https://your-backend.onrender.com/health
# Should return 200 OK
```

### Check Database
```bash
psql $DATABASE_URL -c "SELECT 1"
# Should return connection successful
```

---

## Post-Deployment

### 1. Create Admin Account
```bash
# Go to admin setup
curl https://your-backend.onrender.com/admin/setup
# Follow prompts
```

### 2. Configure Email
```bash
# Update .env with email credentials
# Restart backend
```

### 3. Setup SMS (Optional)
```bash
# Add Twilio credentials to .env
# Test SMS sending
```

### 4. Enable SSL
```bash
# Render/Railway auto-enable HTTPS
# Custom VPS: Use Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Common Issues

### Issue: Database Connection Failed
```
DATABASE_URL=postgres://...
```
**Solution:** Verify DATABASE_URL is correct
```bash
psql $DATABASE_URL
```

### Issue: Frontend can't reach API
**Solution:** Update VITE_API_URL
```
VITE_API_URL=https://your-backend.onrender.com
```

### Issue: Build fails
**Solution:** Check Node version
```bash
node --version  # Should be 18+
npm ci  # Clean install
```

---

## Monitor Deployment

### View Logs

**Render:**
- Dashboard → Service → Logs

**Docker:**
```bash
docker logs -f market-price-api
docker logs -f market-price-web
```

**VPS:**
```bash
pm2 logs
tail -f /var/log/nginx/error.log
```

### Performance Metrics

**CPU/Memory:**
```bash
docker stats
# or
pm2 monit
```

---

## Next Steps

1. ✅ Access your app
2. ✅ Create admin account
3. ✅ Configure email/SMS
4. ✅ Test all 5 dashboards
5. ✅ Invite test users
6. ✅ Setup monitoring
7. ✅ Enable backups

---

## Getting Help

- 📖 See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed steps
- 📚 See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API endpoints
- 💬 Join community forum
- 📧 Email support@marketprice.rw

---

**Your app is now live! 🎉**
