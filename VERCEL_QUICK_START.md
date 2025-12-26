# Quick Start: Deploy Both on Vercel

## ✅ What's Done

I've converted your backend to Vercel serverless functions:
- ✅ `api/chat.js` - Chat endpoint
- ✅ `api/health.js` - Health check
- ✅ `vercel.json` - Configuration
- ✅ Added backend dependencies to root `package.json`
- ✅ Updated frontend to use `/api` for production

## 🚀 Deploy Now

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Vercel serverless functions for backend"
git push
```

### Step 2: Configure Vercel

1. **Go to Vercel Dashboard** → Your project
2. **Settings** → **General**:
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Settings** → **Environment Variables** → Add:
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
   NODE_ENV=production
   ```

### Step 3: Deploy

Vercel will auto-deploy when you push. Or click **"Redeploy"** in dashboard.

### Step 4: Test

- Frontend: `https://your-project.vercel.app`
- Health: `https://your-project.vercel.app/api/health`
- Chat: Use the frontend to test queries

## 🎉 Done!

Both frontend and backend are now on Vercel!

