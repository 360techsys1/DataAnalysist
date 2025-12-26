# Step-by-Step Vercel Deployment Guide

## ⚠️ Important: Your app has TWO parts (Frontend + Backend)

Since your chatbot has a **Node.js backend** that needs to run continuously, you'll deploy:
- **Frontend** → Vercel (for React/Vite apps)
- **Backend** → Railway or Render (for Node.js backends)

---

## 🚀 Quick Deployment Steps

### PART 1: Deploy Backend First (Railway - Recommended)

#### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with **GitHub** (connect your GitHub account)

#### Step 2: Deploy Backend
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your **`Hilal`** repository
3. Railway will ask to create a service - click **"Add Service"**
4. Select **"GitHub Repo"** → Choose your `Hilal` repository

#### Step 3: Configure Backend Service
1. In the service settings, click **"Settings"** tab
2. **Root Directory:** Change to `server`
3. **Start Command:** Should auto-detect as `npm start` (or manually set to `node src/server.js`)

#### Step 4: Add Environment Variables
1. Click **"Variables"** tab in Railway
2. Click **"New Variable"** and add each one:

```
DB_SERVER=your_sql_server_ip_or_hostname
DB_PORT=1433
DB_DATABASE=your_database_name
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
PORT=4000
NODE_ENV=production
```

**Important:** 
- Replace all `your_*` values with your actual credentials
- For `DB_SERVER`, use just the IP/hostname (without port)
- Get your OpenAI API key from https://platform.openai.com/api-keys

#### Step 5: Get Backend URL
1. After deployment, Railway will provide a URL like: `https://hilal-backend-production.up.railway.app`
2. **Copy this URL** - you'll need it for the frontend!
3. Test it by visiting: `https://your-backend-url.railway.app/health`
   - Should return: `{"status":"ok","database":"connected"}`

---

### PART 2: Deploy Frontend on Vercel

#### Step 1: Configure Vercel Project
1. Go to https://vercel.com/dashboard
2. Find your **`Hilal`** project (should already be connected from GitHub)
3. Click on the project name

#### Step 2: Update Build Settings
1. Go to **"Settings"** → **"General"**
2. Under **"Build & Development Settings"**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (leave as root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` (leave as default)

#### Step 3: Add Environment Variable
1. Go to **"Settings"** → **"Environment Variables"**
2. Click **"Add New"**
3. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.railway.app` (use the Railway URL from Part 1, Step 5)
   - **Environment:** Select all (Production, Preview, Development)

4. Click **"Save"**

#### Step 4: Deploy
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment (or push a new commit to trigger auto-deploy)
3. Wait for deployment to complete

#### Step 5: Test
1. Visit your Vercel URL (e.g., `https://hilal.vercel.app`)
2. Try asking a question like: "Show me top 10 distributors by sales"
3. Check browser console (F12) for any errors

---

## ✅ Deployment Checklist

### Backend (Railway)
- [ ] Railway account created and GitHub connected
- [ ] Service created with root directory set to `server`
- [ ] All environment variables added:
  - [ ] DB_SERVER
  - [ ] DB_PORT
  - [ ] DB_DATABASE
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] DB_ENCRYPT
  - [ ] DB_TRUST_SERVER_CERTIFICATE
  - [ ] OPENAI_API_KEY
  - [ ] OPENAI_MODEL
  - [ ] PORT
  - [ ] NODE_ENV
- [ ] Backend deployed and URL copied
- [ ] Health check works: `/health` endpoint returns OK

### Frontend (Vercel)
- [ ] Vercel project connected to GitHub
- [ ] Build settings configured (Vite, build: `npm run build`, output: `dist`)
- [ ] Environment variable `VITE_API_URL` set to backend URL
- [ ] Deployment successful
- [ ] Frontend loads without errors
- [ ] Can send messages and get responses

---

## 🔧 Troubleshooting

### Backend Issues

**"Database connection failed"**
- ✅ Check all DB_* environment variables are correct
- ✅ Verify SQL Server allows external connections
- ✅ Check Railway logs: Service → "Deployments" → Click deployment → "View Logs"

**"Backend not responding"**
- ✅ Check Railway service is "Active" (green status)
- ✅ Check logs for startup errors
- ✅ Verify PORT environment variable is set

**"OpenAI API error"**
- ✅ Check OPENAI_API_KEY is correct (starts with `sk-`)
- ✅ Verify you have credits/quota on OpenAI account
- ✅ Check OPENAI_MODEL is correct (`gpt-4` or `gpt-4-turbo-preview`)

### Frontend Issues

**"Failed to fetch" or Network errors**
- ✅ Check `VITE_API_URL` environment variable is set correctly
- ✅ Verify backend URL is accessible (test in browser)
- ✅ Check CORS - backend should allow all origins (already configured)
- ✅ Check browser console (F12) for specific error messages

**"Build failed" on Vercel**
- ✅ Check Vercel build logs for specific errors
- ✅ Verify `package.json` has correct build script: `"build": "vite build"`
- ✅ Check for missing dependencies

**"Blank page" after deployment**
- ✅ Check browser console for JavaScript errors
- ✅ Verify build output directory is `dist`
- ✅ Check Vercel deployment logs

---

## 🔄 Updating/Re-deploying

### To update backend:
1. Make changes to code in `server/` directory
2. Push to GitHub
3. Railway will auto-deploy (or manually redeploy in Railway dashboard)

### To update frontend:
1. Make changes to code in `src/` directory
2. Push to GitHub
3. Vercel will auto-deploy (or manually redeploy in Vercel dashboard)

---

## 📝 Quick Reference

### Backend URL Format
```
https://your-service-name.up.railway.app
```

### Frontend URL Format
```
https://your-project-name.vercel.app
```

### Test Backend Health
```
GET https://your-backend.railway.app/health
Expected: {"status":"ok","database":"connected"}
```

### Test Frontend API Connection
```
Check browser console (F12) → Network tab
Look for requests to: https://your-backend.railway.app/api/chat
```

---

## 🎉 You're Done!

Once both are deployed:
1. ✅ Frontend on Vercel
2. ✅ Backend on Railway
3. ✅ Environment variables configured
4. ✅ Health checks passing

Your chatbot should be live and accessible! 🚀

