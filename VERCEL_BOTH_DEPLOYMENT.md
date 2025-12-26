# Deploy Both Frontend & Backend on Vercel

Yes! You can deploy both on Vercel, but the backend needs to be converted to **serverless functions**.

## ✅ What I've Created

I've created serverless function versions of your backend:

1. **`api/chat.js`** - Chat endpoint (serverless version)
2. **`api/health.js`** - Health check endpoint
3. **`vercel.json`** - Vercel configuration

## 🚀 Deployment Steps

### Step 1: Update Vercel Configuration

The `vercel.json` file is already created. It tells Vercel:
- Build the frontend (Vite)
- Route `/api/*` requests to serverless functions
- Set max function duration to 30 seconds

### Step 2: Configure Vercel Project

1. **Go to Vercel Dashboard** → Your `Hilal` project
2. **Settings** → **General**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Step 3: Add Environment Variables

**Settings** → **Environment Variables** → Add all backend variables:

```
DB_SERVER=your_sql_server
DB_PORT=1433
DB_DATABASE=your_database_name
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4
NODE_ENV=production
```

**Important:** 
- Don't add `PORT` variable (Vercel handles this automatically)
- Make sure all values are correct
- Add to all environments (Production, Preview, Development)

### Step 4: Update Frontend API URL

Since both are on Vercel, the frontend should use relative URLs:

**Option 1: Use relative URLs (Recommended)**
- Update `src/Chat.jsx` to use: `const API_BASE_URL = ''` or `const API_BASE_URL = '/api'`
- Vercel will route `/api/chat` automatically

**Option 2: Keep environment variable**
- Set `VITE_API_URL` to `/api` in Vercel environment variables
- Or leave it as empty string to use relative paths

### Step 5: Deploy

1. **Push to GitHub** (if not already pushed):
   ```bash
   git add .
   git commit -m "Add Vercel serverless functions for backend"
   git push
   ```

2. **Vercel will auto-deploy** from GitHub
3. Or manually **Redeploy** in Vercel dashboard

---

## 📝 Changes Made

### New Files Created:
- ✅ `api/chat.js` - Serverless version of chat route
- ✅ `api/health.js` - Health check endpoint
- ✅ `vercel.json` - Vercel configuration

### How It Works:
- `/api/chat` → Calls `api/chat.js` serverless function
- `/api/health` → Calls `api/health.js` serverless function
- All other routes → Serve frontend from `dist/`

---

## ⚠️ Important Notes

### Serverless Function Limitations:
1. **Cold Starts:** First request after inactivity may be slower (1-2 seconds)
2. **Timeout:** Max 30 seconds per request (configured in vercel.json)
3. **Database Connections:** Each function invocation creates a new connection (connection pooling works differently)

### Database Connection:
- The `mssql` connection pooling will work, but each serverless function invocation is independent
- Connections are reused within the same function execution
- This is fine for your use case

---

## 🔍 Testing After Deployment

1. **Health Check:**
   ```
   GET https://your-project.vercel.app/api/health
   ```
   Should return: `{"status":"ok","database":"connected"}`

2. **Frontend:**
   ```
   https://your-project.vercel.app
   ```
   Should load your chatbot UI

3. **Test Chat:**
   - Try asking: "Show me top 10 distributors by sales"
   - Check browser console (F12) for any errors

---

## 🐛 Troubleshooting

### "Function not found" or 404
- ✅ Check `vercel.json` routes are correct
- ✅ Verify `api/chat.js` exists in repository
- ✅ Check Vercel build logs for errors

### "Database connection failed"
- ✅ Check all DB_* environment variables are set correctly
- ✅ Verify SQL Server allows connections from Vercel IPs
- ✅ Check function logs in Vercel dashboard

### "Timeout" errors
- ✅ Complex queries might take longer
- ✅ Increase `maxDuration` in `vercel.json` (up to 60s on Pro plan)
- ✅ Optimize queries if possible

### CORS errors
- ✅ Serverless functions already handle CORS
- ✅ Check if request is going to correct endpoint

---

## 📊 Comparison: Railway vs Vercel

### Railway (Separate Backend):
- ✅ Always-on server (no cold starts)
- ✅ Traditional Express app (easier to debug)
- ✅ Better for long-running processes
- ❌ Separate deployment needed
- ❌ Additional service to manage

### Vercel (Serverless):
- ✅ Everything in one place
- ✅ Automatic scaling
- ✅ Free tier is generous
- ❌ Cold starts possible
- ❌ 30s timeout limit (can upgrade to 60s)

---

## 🎯 Recommendation

For your chatbot:
- **Vercel serverless functions** work well ✅
- Cold starts are minimal (usually <1 second)
- 30-second timeout is plenty for database queries
- Simpler deployment (one service instead of two)

**Go with Vercel serverless functions!** 🚀

---

## Next Steps

1. ✅ Files are created (`api/chat.js`, `api/health.js`, `vercel.json`)
2. ✅ Update frontend to use `/api` (or keep current env var)
3. ✅ Add environment variables in Vercel
4. ✅ Push to GitHub
5. ✅ Deploy!

