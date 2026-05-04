# Render Deployment Guide for SMPMPS

## Prerequisites
- GitHub account with repo pushed
- Render account (https://render.com - sign up with GitHub)

---

## STEP 1: Deploy PostgreSQL Database First

**Why?** Backend needs database connection string during deployment.

1. Go to: https://render.com/dashboard
2. Click: **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `lmcp-db`
   - **Database**: `lmcp`
   - **User**: `lmcp_user`
   - **Plan**: Free
4. Click: **Create Database**
5. **COPY the connection string** (looks like):
   ```
   postgres://lmcp_user:PASSWORD@dpg-xxxxx.render.com:5432/lmcp
   ```
   Save this for next step!

---

## STEP 2: Deploy Backend Web Service

1. Go to: https://render.com/dashboard
2. Click: **New +** → **Web Service**
3. Select your GitHub repository
4. **Configure:**
   - **Name**: `lmcp-backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     cd local_market_price_checker/backend && npm install
     ```
   - **Start Command**: 
     ```
     cd local_market_price_checker/backend && npm start
     ```
   - **Plan**: Free

5. **Before deploying - Add Environment Variables:**
   - Click: **Environment**
   - Add each variable below:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | Generate a random string [here](https://www.md5online.org/md5-generator) |
   | `DATABASE_URL` | Paste the connection string from Step 1 |
   | `EMAIL_USER` | (your Gmail or email service) |
   | `EMAIL_PASS` | (app password, not regular password) |
   | `VITE_API_URL` | Will update after deployment |

6. Click: **Deploy Web Service**
7. **Wait for deployment** (~5-10 minutes)
8. **Copy the URL** - looks like: `https://lmcp-backend.onrender.com`

---

## STEP 3: Update Database Connection

1. Go back to Render dashboard
2. Find your **Backend Web Service**
3. Click: **Settings**
4. Update environment variable: `VITE_API_URL` to match your backend URL
5. Click: **Redeploy** to apply changes

---

## STEP 4: Run Database Migrations

Your database is empty. You need to run migrations:

**Option A: Via Backend API (Automatic)**
- Backend automatically initializes DB on startup
- Check logs to verify tables created

**Option B: Manual via Render Shell**
1. Go to backend service → **Shell**
2. Run:
   ```bash
   cd local_market_price_checker/backend
   node run_migration.js
   ```

---

## STEP 5: Verify Backend is Working

1. Go to: `https://lmcp-backend.onrender.com/api/docs`
2. Should see API documentation
3. Try a test request: `https://lmcp-backend.onrender.com/api/docs`

If you see 200 response ✅ backend is working!

---

## STEP 6: Deploy Frontend

1. Go to: https://render.com/dashboard
2. Click: **New +** → **Static Site**
3. Select your GitHub repository
4. **Configure:**
   - **Name**: `lmcp-frontend`
   - **Build Command**: 
     ```
     cd local_market_price_checker/frontend && npm run build
     ```
   - **Publish Directory**: 
     ```
     local_market_price_checker/frontend/dist
     ```
   - **Plan**: Free

5. **Add Environment Variables:**
   - `VITE_API_URL` = `https://lmcp-backend.onrender.com`

6. Click: **Deploy**
7. **Wait for deployment** (~5-10 minutes)
8. **Copy the URL** - your app is live! 🎉

---

## STEP 7: Test the Full App

1. Open: `https://lmcp-frontend.onrender.com`
2. Test:
   - ✅ Can you log in?
   - ✅ Can you see prices?
   - ✅ Real-time updates working?
   - ✅ Submit prices working?

---

## Troubleshooting

### Backend won't start
- Check logs: Backend service → **Logs**
- Common issues:
  - DATABASE_URL wrong → check PostgreSQL connection string
  - Missing env variables → add them in Environment
  - Port 10000 already used → Render handles this, try redeploying

### Frontend shows "Cannot connect to API"
- Check: `VITE_API_URL` is correct in frontend environment
- Should be: `https://lmcp-backend.onrender.com`
- Redeploy frontend after updating URL

### WebSocket connection fails
- This is Socket.IO real-time
- Check backend logs for errors
- Verify CORS settings in backend

### Database migrations didn't run
- Go to backend Shell and run manually:
  ```bash
  node local_market_price_checker/backend/run_migration.js
  ```

---

## Useful Render Commands

**View Logs:**
- Service → **Logs** tab

**Redeploy:**
- Service → **Deployments** → **Manual Redeploy**

**View Environment Variables:**
- Service → **Environment** tab

**Connect to Database (advanced):**
- PostgreSQL → **Shell** tab

---

## Free Tier Limitations

- ⏱️ Services spin down after 15 min of inactivity (slow first load)
- 📦 Limited to 2 services on free tier
- 💾 PostgreSQL has 1GB disk limit
- ⏱️ Maximum 750 free tier hours/month

**To remove limitations:** Upgrade to paid plan ($7+/month)

---

## Next Steps

1. **Create Render account**: https://render.com
2. **Follow steps 1-7 above**
3. **Test your live app**
4. **Share the URL and celebrate!** 🚀

Need help with any step? Reply with the step number!
