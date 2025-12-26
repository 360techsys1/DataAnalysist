# Deploy Backend Separately on Vercel

This guide shows how to deploy your backend as a **separate Vercel project** so it's completely independent from your frontend.

## 🎯 Overview

You'll create a **new Vercel project** that only contains the backend code, deployed as serverless functions. Your frontend will call this backend via its Vercel URL.

```
Frontend (Vercel)  →  Backend (Separate Vercel Project)  →  SQL Server
```

## 📋 Step-by-Step Guide

### Step 1: Prepare Backend for Separate Deployment

The backend will be deployed from the `server/` directory, but we need to restructure it slightly for Vercel serverless functions.

#### Option A: Create Serverless Functions in `server/` Directory

1. **Create `server/api/` directory:**
   ```bash
   mkdir server/api
   ```

2. **Create serverless function structure** in `server/api/chat.js` (I'll create this for you)

3. **Update `server/vercel.json`** for Vercel configuration

#### Option B: Use Current Structure with Some Adjustments

Since you already have `api/chat.js` in the root, we can:
- Move it to a separate repo/folder, OR
- Deploy the entire project but only the backend routes

**I recommend Option A** - create a clean backend-only structure.

### Step 2: Create New Vercel Project for Backend

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard

2. **Click "Add New..." → "Project"**

3. **Import Repository:**
   - Select your GitHub repository
   - Or connect a new repo if you want to separate them

4. **Configure Project:**
   - **Project Name:** `hilal-foods-backend` (or your choice)
   - **Root Directory:** `server` ⚠️ **Important: Set this to `server`**
   - **Framework Preset:** `Other`
   - **Build Command:** Leave empty or `echo "No build needed"`
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

### Step 3: Configure Environment Variables

In your **new backend Vercel project**:

1. **Settings** → **Environment Variables**
2. **Add all these variables:**

```
DB_SERVER=your_sql_server_address
DB_PORT=1433
DB_DATABASE=your_database_name
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4
LLM_PROVIDER=openai
NODE_ENV=production
```

3. **Apply to:** Production, Preview, Development (select all)

### Step 4: Create Serverless Functions Structure

Create these files in `server/api/`:

- `server/api/chat.js` - Chat endpoint
- `server/api/health.js` - Health check
- `server/vercel.json` - Vercel configuration

### Step 5: Deploy

1. **Click "Deploy"**
2. **Wait for deployment** (usually 1-2 minutes)
3. **Copy the deployment URL:** e.g., `https://hilal-foods-backend.vercel.app`

### Step 6: Update Frontend to Use Backend URL

1. **Go to your Frontend Vercel project** (the one already deployed)

2. **Settings** → **Environment Variables**

3. **Add/Update:**
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```
   (Replace with your actual backend URL)

4. **Redeploy Frontend**

### Step 7: Test

1. **Test Backend Health:**
   ```
   https://your-backend-url.vercel.app/api/health
   ```
   Should return: `{"status":"ok","database":"connected"}`

2. **Test Frontend:**
   - Go to your frontend URL
   - Try asking a question
   - Should connect to the backend ✅

---

## 📁 Required File Structure

For the backend Vercel project, you need:

```
server/
├── api/
│   ├── chat.js          # Chat endpoint (serverless function)
│   └── health.js        # Health check (serverless function)
├── src/
│   ├── db.js
│   ├── llm.js
│   ├── llmProvider.js
│   └── schemaConfig.js
├── package.json
├── vercel.json          # Vercel configuration
└── .env                 # (Not committed, use Vercel env vars)
```

---

## ⚠️ Important Notes

### 1. Root Directory MUST be `server`
In Vercel project settings, set **Root Directory** to `server` (not `/server`).

### 2. Serverless Function Limits
- **Max Duration:** 30 seconds (can increase to 60s on Pro plan)
- **Memory:** 1024 MB default
- **Cold Starts:** First request after inactivity may be slow (1-3 seconds)

### 3. SQL Server Connection Pooling
Vercel serverless functions work differently than a continuous server:
- Connections are established per request
- Connection pooling still works, but connections may timeout between requests
- This is usually fine for your use case

### 4. CORS Configuration
The serverless functions already handle CORS, but make sure your frontend URL is allowed (currently set to `*` for all origins).

---

## 🔧 Troubleshooting

### Error: "Cannot find module"
- Make sure all dependencies are in `server/package.json`
- Check that imports use correct paths (relative to `server/` directory)

### Error: "Database connection failed"
- Verify environment variables are set correctly in Vercel
- Check DB_SERVER format (should be IP or hostname, not with port)
- DB_PORT should be separate (1433)

### Error: "Function timeout"
- Increase `maxDuration` in `vercel.json`
- Check if SQL queries are taking too long
- Add indexes to your database if needed

### Error: "404 Not Found" on `/api/chat`
- Check that `server/api/chat.js` exists
- Verify `server/vercel.json` is configured correctly
- Make sure Root Directory is set to `server` in Vercel

---

## ✅ Files Created

I've already created the following files for you:

- ✅ `server/api/chat.js` - Chat endpoint (serverless function)
- ✅ `server/api/health.js` - Health check (serverless function)  
- ✅ `server/vercel.json` - Vercel configuration

**You're ready to deploy!** Follow the steps below.

---

## 🚀 Quick Start - Deploy Backend Now

### Step 1: Push Code to GitHub (if not already done)

```bash
git add .
git commit -m "Add Vercel serverless functions for backend"
git push
```

### Step 2: Create New Vercel Project

1. **Go to:** https://vercel.com/dashboard
2. **Click:** "Add New..." → "Project"
3. **Import** your GitHub repository
4. **Configure Project:**
   - **Project Name:** `hilal-foods-backend` (or your choice)
   - **Framework Preset:** `Other`
   - **Root Directory:** `server` ⚠️ **CRITICAL: Must be `server` (not `/server`)**
   - **Build Command:** Leave empty (or: `echo "No build needed"`)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

### Step 3: Add Environment Variables

In the Vercel project settings:

1. **Settings** → **Environment Variables**
2. **Add these variables** (use your actual values):

```
DB_SERVER=your_sql_server_ip_or_hostname
DB_PORT=1433
DB_DATABASE=your_database_name
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4
LLM_PROVIDER=openai
NODE_ENV=production
```

3. **Apply to:** Production, Preview, Development (select all)
4. **Save**

### Step 4: Deploy

1. **Click "Deploy"**
2. **Wait** for deployment (1-2 minutes)
3. **Copy the URL:** e.g., `https://hilal-foods-backend.vercel.app`

### Step 5: Test Backend

1. **Test Health Endpoint:**
   ```
   https://your-backend-url.vercel.app/api/health
   ```
   Should return: `{"status":"ok","database":"connected"}`

2. **If health check fails:**
   - Check environment variables are correct
   - Check deployment logs in Vercel dashboard
   - Verify SQL Server is accessible from Vercel's servers

### Step 6: Update Frontend

1. **Go to your Frontend Vercel project** (the existing one)

2. **Settings** → **Environment Variables**

3. **Add/Update:**
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```
   (Replace `your-backend-url` with your actual backend URL from Step 4)

4. **Redeploy Frontend:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Step 7: Test Complete Application

1. **Visit your frontend URL**
2. **Try asking a question** in the chat
3. **Should work!** ✅

---

## 📝 Important Notes

### Root Directory Setting
⚠️ **MUST be exactly `server`** (no leading slash, no trailing slash)

Incorrect: `/server`, `./server`, `server/`  
Correct: `server`

### API Endpoints

After deployment, your backend will have:
- `https://your-backend-url.vercel.app/api/chat` - Chat endpoint
- `https://your-backend-url.vercel.app/api/health` - Health check

### CORS
The serverless functions handle CORS and allow all origins (`*`). If you need to restrict this, update the `Access-Control-Allow-Origin` header in `server/api/chat.js` and `server/api/health.js`.

---

## 🔧 Troubleshooting

### Backend returns 404
- ✅ Check Root Directory is `server` (not `/server`)
- ✅ Verify `server/api/chat.js` exists
- ✅ Check `server/vercel.json` is correct
- ✅ Look at Vercel deployment logs

### Database connection fails
- ✅ Verify all DB_* environment variables are set
- ✅ Check DB_SERVER format (IP or hostname, no port)
- ✅ Verify DB_PORT is separate (1433)
- ✅ Ensure SQL Server allows connections from Vercel IPs
- ✅ Check deployment logs for specific error

### Function timeout
- ✅ Increase `maxDuration` in `server/vercel.json` (max 60s on Pro plan)
- ✅ Optimize SQL queries
- ✅ Check if database is slow to respond

### Frontend can't connect to backend
- ✅ Verify `VITE_API_URL` is set correctly in frontend Vercel project
- ✅ Make sure backend URL has no trailing slash
- ✅ Check browser console for CORS errors
- ✅ Test backend health endpoint directly in browser

---

## ✅ Checklist

Before deploying, make sure:

- [ ] Code is pushed to GitHub
- [ ] `server/api/chat.js` exists
- [ ] `server/api/health.js` exists
- [ ] `server/vercel.json` exists
- [ ] All environment variables are ready
- [ ] SQL Server is accessible from internet

After deploying:

- [ ] Backend deployment succeeded
- [ ] Health endpoint works: `/api/health`
- [ ] Copied backend URL
- [ ] Updated `VITE_API_URL` in frontend project
- [ ] Redeployed frontend
- [ ] Tested complete application

---

You're all set! 🎉

