# Vercel Deployment Guide for Hilal Foods Data Analyst

## Important: Backend Deployment Strategy

Since your application has a **Node.js backend** that needs to run continuously (not serverless), Vercel's serverless functions might not be ideal. You have two options:

### Option 1: Separate Backend Deployment (Recommended)

Deploy the backend separately on a platform that supports Node.js applications:

#### A. Deploy Backend on Railway (Recommended - Easy & Free tier available)

1. **Sign up/Login to Railway:**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `Hilal` repository
   - Railway will detect it's a Node.js project

3. **Configure Service:**
   - Railway should auto-detect the backend
   - **Root Directory:** `server`
   - **Build Command:** `npm install` (leave empty, Railway auto-detects)
   - **Start Command:** `npm run dev` (or `node src/server.js` for production)

4. **Add Environment Variables in Railway:**
   ```
   DB_SERVER=your_sql_server
   DB_PORT=1433
   DB_DATABASE=your_database_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=true
   OPENAI_API_KEY=sk-your-openai-key
   OPENAI_MODEL=gpt-4
   PORT=4000
   NODE_ENV=production
   ```

5. **Get Backend URL:**
   - Railway will provide a URL like: `https://hilal-backend.railway.app`
   - Copy this URL

#### B. Deploy Backend on Render (Alternative)

1. Go to https://render.com
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** hilal-backend
   - **Root Directory:** `server`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
6. Add environment variables (same as Railway above)
7. Get the backend URL

---

## Option 2: Deploy Everything on Vercel (Serverless Functions)

If you want everything on Vercel, you'll need to convert the backend to serverless functions:

### Step 1: Create Vercel Serverless Functions

Create `api/chat.js` in your project root:

```javascript
import { runQuery } from '../server/src/db.js';
import { 
  generateSqlFromQuestion, 
  answerFromData,
  isSqlSafe,
  isConversationalMessage,
  handleConversationalMessage,
  suggestRephrasedQuestion,
  isMetadataQuestion,
  handleMetadataQuestion,
  extractTableFromSql
} from '../server/src/llm.js';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, history = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ 
        error: 'Please provide a question',
        message: 'Your question cannot be empty.'
      });
    }

    // ... (copy the rest of your chat route logic from server/src/routes/chat.js)
    
    // For now, let's use Option 1 (Railway/Render) as it's simpler
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'An unexpected error occurred',
      message: 'Please try again in a moment.'
    });
  }
}
```

**However, this approach is complex because:**
- You need to convert all routes to serverless functions
- Database connection pooling doesn't work well with serverless
- Cold starts can be slow

**Recommended: Use Option 1 (Railway/Render for backend)**

---

## Deploy Frontend on Vercel

### Step 1: Configure Vercel Project

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Find your `Hilal` project

2. **Project Settings:**
   - Click on your project
   - Go to "Settings"

3. **Build & Development Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Step 2: Environment Variables for Frontend

In Vercel project settings → Environment Variables, add:

```
VITE_API_URL=https://your-backend-url.railway.app
```

Replace `your-backend-url.railway.app` with your actual Railway backend URL.

### Step 3: Update Frontend to Use Environment Variable

The frontend should already be using `import.meta.env.VITE_API_URL`. Verify in `src/Chat.jsx`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
```

### Step 4: Deploy

1. **Automatic Deployment:**
   - Vercel will automatically deploy when you push to GitHub
   - Or click "Redeploy" in Vercel dashboard

2. **Manual Deploy:**
   - In Vercel dashboard, click "Deployments"
   - Click "Redeploy" on the latest deployment

---

## Complete Deployment Checklist

### Backend (Railway/Render)

- [ ] Backend deployed and running
- [ ] All environment variables set:
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
- [ ] Backend URL accessible (test with: `https://your-backend.railway.app/health`)
- [ ] Backend responds correctly

### Frontend (Vercel)

- [ ] Repository connected to Vercel
- [ ] Build settings configured:
  - [ ] Framework: Vite
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `dist`
- [ ] Environment variable set:
  - [ ] VITE_API_URL (points to backend URL)
- [ ] Deployment successful
- [ ] Frontend accessible and working

### Testing

- [ ] Frontend loads correctly
- [ ] Can send messages to chatbot
- [ ] Backend responds to queries
- [ ] Database queries work
- [ ] OpenAI integration works
- [ ] No CORS errors in browser console

---

## Troubleshooting

### Backend Issues

**Problem: Database connection fails**
- Check environment variables are correct
- Verify SQL Server allows connections from Railway/Render IP
- Check DB_SERVER format (should be IP or hostname, not with port)

**Problem: Backend times out**
- Check logs in Railway/Render dashboard
- Verify database connection string
- Check if port is set correctly

### Frontend Issues

**Problem: CORS errors**
- Make sure backend has CORS enabled (you already have `app.use(cors())` in server.js)
- Check backend URL in VITE_API_URL is correct

**Problem: API calls fail**
- Check browser console for errors
- Verify VITE_API_URL environment variable is set in Vercel
- Test backend URL directly: `https://your-backend.railway.app/health`

**Problem: Build fails**
- Check Vercel build logs
- Verify package.json has correct scripts
- Check for TypeScript errors if applicable

---

## Quick Start Commands

### Railway (Backend)

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. Set root directory to `server`
5. Add environment variables
6. Deploy

### Vercel (Frontend)

1. Go to https://vercel.com
2. Import repository
3. Configure:
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist`
4. Add `VITE_API_URL` environment variable
5. Deploy

---

## Alternative: Single Vercel Deployment (Advanced)

If you really want everything on Vercel, you'll need to:
1. Convert backend routes to serverless functions in `/api` directory
2. Handle database connections properly (use connection per request, not pooling)
3. Update all imports to work with serverless environment

This is more complex and not recommended unless you specifically need everything on Vercel.

