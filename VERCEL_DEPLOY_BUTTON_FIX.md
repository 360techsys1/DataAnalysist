# Vercel Deploy Button Disabled - How to Fix

## Common Reasons Deploy Button is Disabled

### 1. Repository Not Selected/Configured ✅ **MOST COMMON**

The deploy button is disabled until you've properly imported/configured the repository.

**Fix:**
1. On the "New Project" page, make sure you've:
   - **Selected your GitHub repository** (`360techsys/Hilal` or similar)
   - **Selected the correct Git branch** (usually `main`)
   - **Configured the project name** (auto-filled, but can change)

2. If you haven't imported the repo yet:
   - Click "Import Git Repository" 
   - Connect your GitHub account if not already connected
   - Select your `Hilal` repository
   - Click "Import"

### 2. Framework Not Detected

Vercel needs to detect your framework or you need to configure it.

**Fix:**
- After importing repo, Vercel should auto-detect "Vite"
- If not, go to **Settings** → **General** → **Framework Preset**
- Select **"Vite"**

### 3. Build Settings Not Configured

**Fix:**
1. After importing, go to **Settings** section
2. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (leave as root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` (default)

### 4. Missing Required Configuration

**Fix:**
1. Make sure `vercel.json` exists in your repo root
2. Make sure `package.json` exists with build script
3. Make sure `api/` folder exists with serverless functions

### 5. GitHub Repository Not Connected

**Fix:**
1. Click "Import Git Repository" button
2. If GitHub isn't connected:
   - Click "Connect GitHub" or "Add GitHub Account"
   - Authorize Vercel
   - Select your repository
   - Click "Import"

---

## Step-by-Step: Enable Deploy Button

### Option A: New Project (From Scratch)

1. **Import Repository:**
   - Click "Import Git Repository" or "Add GitHub Account"
   - Select `360techsys/Hilal` (or your repo name)
   - Click "Import"

2. **Configure Project:**
   - **Project Name:** `hilal-foods` (or your preference)
   - **Framework Preset:** Should auto-detect "Vite"
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Add Environment Variables (Optional now, can add later):**
   - Click "Add More" → "Environment Variables"
   - Or skip for now and add in Settings after deployment

4. **Deploy Button Should Now Be Enabled** ✅

### Option B: Existing Project

If you already have a project connected:

1. Go to **Dashboard** → Your project
2. **Deployments** tab
3. Click **"Redeploy"** button (not "New Project")

---

## Quick Checklist

- [ ] GitHub repository is imported/connected
- [ ] Repository is selected in the import screen
- [ ] Framework is detected (should show "Vite")
- [ ] Build settings are configured
- [ ] `package.json` exists with `build` script
- [ ] `vercel.json` exists in repo root
- [ ] `api/` folder exists with serverless functions

---

## If Button Still Disabled

1. **Check for Errors:**
   - Look for any red error messages on the page
   - Check browser console (F12) for JavaScript errors

2. **Try Different Approach:**
   - Instead of "New Project", try:
     - Dashboard → "Add New" → "Project"
     - Or connect via GitHub directly

3. **Verify Repository Access:**
   - Make sure Vercel has access to your GitHub repository
   - Check GitHub Settings → Applications → Authorized OAuth Apps → Vercel

4. **Check Repository Status:**
   - Make sure your repository exists and has code
   - Push the latest code if needed:
     ```bash
     git add .
     git commit -m "Add Vercel serverless functions"
     git push
     ```

---

## After Deploy Button Works

Once enabled and you click Deploy:

1. **Add Environment Variables** (in Settings after first deploy):
   ```
   DB_SERVER=...
   DB_PORT=1433
   DB_DATABASE=...
   DB_USER=...
   DB_PASSWORD=...
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=true
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4
   NODE_ENV=production
   ```

2. **Redeploy** after adding environment variables

3. **Test** your deployment!

