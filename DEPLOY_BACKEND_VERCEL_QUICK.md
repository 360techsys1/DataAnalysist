# 🚀 Quick Guide: Deploy Backend on Vercel (Separate Project)

## ✅ Prerequisites

✅ Files are already created:
- `server/api/chat.js`
- `server/api/health.js`
- `server/vercel.json`

✅ Code is ready to deploy!

---

## 📋 Step-by-Step

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Add Vercel serverless functions"
git push
```

### 2. Create New Vercel Project

1. Go to: **https://vercel.com/dashboard**
2. Click: **"Add New..." → "Project"**
3. **Import** your GitHub repository
4. **Configure:**
   - **Project Name:** `hilal-foods-backend`
   - **Framework:** `Other`
   - **Root Directory:** `server` ⚠️ **MUST be exactly: `server`**
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

### 3. Add Environment Variables

In Vercel project → **Settings → Environment Variables**, add:

```
DB_SERVER=your_sql_server
DB_PORT=1433
DB_DATABASE=your_database
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4
LLM_PROVIDER=openai
NODE_ENV=production
```

**Select:** Production, Preview, Development

### 4. Deploy

Click **"Deploy"** and wait ~2 minutes

### 5. Copy Backend URL

After deployment, copy the URL:
- Example: `https://hilal-foods-backend.vercel.app`

### 6. Test Backend

Visit: `https://your-backend-url.vercel.app/api/health`

Should return: `{"status":"ok","database":"connected"}`

### 7. Update Frontend

1. Go to **your Frontend Vercel project**
2. **Settings → Environment Variables**
3. **Add/Update:**
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```
4. **Redeploy** frontend

### 8. Test Complete App ✅

Visit your frontend URL and test the chat!

---

## ⚠️ Common Issues

**404 Error:**
- ✅ Root Directory MUST be `server` (not `/server`)

**Database Connection Failed:**
- ✅ Check all DB_* variables are set
- ✅ Verify DB_SERVER format (no port included)
- ✅ Check deployment logs

**Frontend Can't Connect:**
- ✅ Verify `VITE_API_URL` is set correctly
- ✅ Make sure backend URL has no trailing slash
- ✅ Test `/api/health` endpoint directly

---

## 📞 Need Help?

Check `VERCEL_BACKEND_DEPLOYMENT.md` for detailed troubleshooting.

