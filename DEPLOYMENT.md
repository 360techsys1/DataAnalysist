# Deployment Guide for Hilal Foods Data Analyst Chatbot

## GitHub Setup

### Step 1: Create Repository on GitHub

1. Go to https://github.com/360techsys/Hilal
2. If the repository doesn't exist, create it:
   - Click "New repository"
   - Name: `Hilal`
   - Make it **Private** (recommended for business data)
   - Don't initialize with README (we already have code)
   - Click "Create repository"

### Step 2: Push Code to GitHub

Since there's a permission issue, you have two options:

#### Option A: Using GitHub Desktop or Command Line with Authentication

If you're using HTTPS and need to authenticate:

```bash
# Make sure you're in the project root
cd D:\school-assistant_chatbot

# Verify remote is set correctly
git remote -v

# If needed, set the remote again
git remote set-url origin https://github.com/360techsys/Hilal.git

# Push using your GitHub credentials
git push -u origin main
```

If you need to use a Personal Access Token:
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate a new token with `repo` permissions
3. Use the token as password when pushing

#### Option B: Using SSH (Recommended for production)

```bash
# Set remote to use SSH
git remote set-url origin git@github.com:360techsys/Hilal.git

# Push
git push -u origin main
```

## Vercel Deployment

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import the repository: `360techsys/Hilal`
5. Configure the project:

### Step 2: Frontend Configuration

**Root Directory:** Leave as root (or set to `/` if needed)

**Build Settings:**
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

**Environment Variables** (Add these in Vercel):
- Not needed for frontend (API URL will be set in code or env)

### Step 3: Backend Configuration (Separate Vercel Project)

Since you have a Node.js backend in the `server/` folder, you have two options:

#### Option A: Deploy Backend Separately on Vercel

1. Create a **second Vercel project** for the backend
2. **Root Directory:** `server`
3. **Framework Preset:** Other
4. **Build Command:** Leave empty (or `npm install`)
5. **Output Directory:** Leave empty
6. **Install Command:** `npm install`

**Backend Environment Variables** (CRITICAL - Add in Vercel):
```
DB_SERVER=your_sql_server
DB_PORT=1433
DB_DATABASE=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
PORT=4000
```

**Vercel.json for Backend** (Create `server/vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

#### Option B: Use Vercel Serverless Functions

Convert the backend to use Vercel serverless functions (more complex, but better for Vercel).

### Step 4: Update Frontend API URL

After deploying the backend, update the frontend to use the backend URL:

1. In Vercel, get your backend deployment URL (e.g., `https://hilal-backend.vercel.app`)
2. Update `src/Chat.jsx`:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hilal-backend.vercel.app';
   ```
3. Add environment variable in Vercel for frontend:
   ```
   VITE_API_URL=https://hilal-backend.vercel.app
   ```

## Alternative: Deploy Backend Elsewhere

If Vercel serverless functions are too complex, consider:

1. **Railway** (Recommended for Node.js backends)
   - https://railway.app
   - Easy Node.js deployment
   - Supports SQL Server connections
   - Free tier available

2. **Render**
   - https://render.com
   - Free tier for web services
   - Easy deployment from GitHub

3. **Heroku** (Paid)
   - https://heroku.com
   - Reliable but requires credit card

4. **DigitalOcean App Platform**
   - https://www.digitalocean.com/products/app-platform
   - Good for production

## Environment Variables Checklist

### Backend (.env in server/)
```
DB_SERVER=your_server_address
DB_PORT=1433
DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
PORT=4000
```

### Frontend (.env in root - optional)
```
VITE_API_URL=http://localhost:4000  # For local dev, production will use Vercel backend URL
```

## Post-Deployment

1. Test the chatbot with sample queries
2. Monitor logs in Vercel dashboard
3. Check backend connectivity to SQL Server
4. Verify OpenAI API key is working
5. Test context-aware queries and date-aware queries

## Troubleshooting

- **403 Error on Push:** Make sure you have write access to the repository
- **Build Fails:** Check Vercel logs for missing dependencies
- **Backend Connection Issues:** Verify environment variables are set correctly
- **CORS Errors:** Make sure backend allows requests from frontend domain

