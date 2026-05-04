# How to Manually Redeploy on Render

If automatic deployment doesn't trigger, follow these steps:

## Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Login with your GitHub account
3. You should see your SMPMPS deployment(s)

## Step 2: Clear Build Cache & Redeploy

### For Each Service (Backend & Frontend):

**Option A: Clear Cache + Manual Deploy**
1. Click on the service name (e.g., "smpmps-backend")
2. Scroll to bottom → Click **"Logs"**
3. Add to URL bar at end: `/deploys`
   - Example: `dashboard.render.com/...../deploys`
4. Click **"Clear build cache"** button
5. Click **"Deploy latest commit"**
6. Wait 3-5 minutes for build
7. Watch logs for errors

**Option B: Delete & Reselect**
1. Go to service settings
2. Scroll down → **"Delete Service"**
3. Confirm deletion
4. Go back to dashboard
5. Click **"New +"** → **"Blueprint"**
6. Select your GitHub repo
7. Click **"Deploy"**
8. Wait 5-10 minutes

## Step 3: Monitor the Build

### Backend Build (3-4 minutes)
```
✓ Cloning from GitHub
✓ Setting build environment
✓ Running: npm install
✓ Running: npm start
✓ Build successful!
   Server running on port 10000
```

### Frontend Build (2-3 minutes)  
```
✓ Cloning from GitHub
✓ Setting build environment
✓ Running: npm install && npm run build
✓ Output directory: dist/
✓ Deploying static site...
✓ Build successful!
   Ready at: https://smpmps-frontend.onrender.com
```

### Database  
```
✓ PostgreSQL instance provisioning
✓ Database created: market_prices
✓ Ready for connections
```

## Step 4: Verify Deployment

Once all services show "Live":

### Test Backend
```
Open in browser:
https://your-backend-url.onrender.com/api/health

Should show:
{"status":"ok","timestamp":"..."}
```

### Test Frontend
```
Open in browser:
https://your-frontend-url.onrender.com

Should see login page with teal theme ✓
```

### Test Database Connection
- Backend logs should show: "✓ Database connected"
- If you see "✗ Database connection failed" → error in DATABASE_URL

## Troubleshooting

### ❌ Build Error: "Could not find package.json"

**Cause**: render.yaml root path is wrong

**Fix**: 
```yaml
# In render.yaml
backend:
  root: local_market_price_checker/backend  ✓ CORRECT

frontend:
  root: local_market_price_checker/frontend  ✓ CORRECT
```

### ❌ Build Error: "npm ERR! code ERESOLVE"

**Cause**: npm dependency conflict

**Fix**: 
```bash
# Locally, run:
npm install --legacy-peer-deps

# Or in render.yaml:
buildCommand: npm install --legacy-peer-deps
```

### ❌ Frontend Shows Blank Page

**Cause**: Wrong publicPath or missing .html file

**Fix**: 
- Check vite.config.js has correct publicPath
- Verify dist/index.html exists after build
- Check browser console (F12) for errors

### ❌ Backend Can't Connect to Database

**Check**:
1. DATABASE_URL environment variable is set
2. Format is: `postgresql://user:password@host:port/dbname`
3. Prefix is `postgresql://` not just `postgres://`

### ❌ CORS Errors Between Frontend & Backend

**Check backend code**:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

**Verify in render.yaml**:
```yaml
VITE_API_URL: https://your-backend-url.onrender.com
CLIENT_URL: https://your-frontend-url.onrender.com
```

## Logs Locations

### View Logs
1. Dashboard → Select service
2. Click **"Logs"** tab
3. Scroll through build output
4. Search for "error" or "failed"

### Real-time Logs
- Click **"Stream logs"** button
- Keeps updating as service runs

### Common Log Locations
- Build errors: Top of log
- Runtime errors: Bottom of log  
- Environment errors: Usually middle

## When Everything Works ✅

You should see:

**Backend Service**
- Status: **Live** (green dot)
- Port: 10000
- URL: `https://smpmps-backend.onrender.com`

**Frontend Service**
- Status: **Live** (green dot)
- Type: Static Site
- URL: `https://smpmps-frontend.onrender.com`

**Database**
- Status: **Available** (green dot)
- Type: PostgreSQL
- Connection: Ready

## Next Steps After Successful Deployment

1. **Create Admin Account**
   - Go to: `https://your-frontend-url.onrender.com/admin/setup`
   - Fill form and create first admin
   - Note: This URL might not exist yet if not implemented

2. **Test Features**
   - [ ] Login as consumer
   - [ ] Browse prices
   - [ ] Login as vendor
   - [ ] Submit price
   - [ ] See real-time update

3. **Configure Optional Services**
   - [ ] Email notifications (Nodemailer)
   - [ ] SMS alerts (Twilio)
   - [ ] Payment gateway

4. **Setup Monitoring**
   - [ ] Enable error tracking (Sentry)
   - [ ] Setup uptime monitoring
   - [ ] Configure log aggregation

5. **Domain Configuration** (optional)
   - [ ] Update DNS to point to Render
   - [ ] Configure custom domain
   - [ ] Enable SSL certificate

## Support

**Need help?**
- Check render.yaml syntax: `https://render.com/docs/yaml-spec`
- Read deployment guide: `DEPLOYMENT_GUIDE.md`
- Check API docs: `API_DOCUMENTATION.md`
- Review user guide: `USER_GUIDE.md`

---

**Good luck! Your deployment should be ready now.** 🚀
