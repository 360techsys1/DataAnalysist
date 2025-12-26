# Railway Service Offline - Quick Fix

## ⚠️ Most Common Issue: Root Directory

**I can see in your Railway settings that Root Directory is set to `/server`**

**It should be:** `server` (without the leading slash `/`)

### Fix Root Directory:

1. Go to Railway → Your Service → **Settings** tab
2. Click **"Source"** section (in the right sidebar)
3. Find **"Root Directory"** field
4. **Change from:** `/server`
5. **Change to:** `server` (remove the leading slash)
6. Save/Update
7. Railway will automatically redeploy

---

## 🔍 Check Deployment Logs

1. Go to **"Deployments"** tab in Railway
2. Click on the **latest deployment**
3. Check the **"Logs"** tab

**Look for these errors:**

### ❌ "Cannot find module"
- Means dependencies aren't installing
- **Fix:** Make sure Root Directory is correct (see above)

### ❌ "Database connection failed"
- Wrong DB credentials
- **Fix:** Check all DB_* environment variables

### ❌ "Port already in use"
- **Fix:** Remove `PORT=4000` from environment variables
- Railway provides PORT automatically, your code uses `process.env.PORT || 4000` ✅

### ❌ "ENOENT: no such file"
- Wrong file path
- **Fix:** Root Directory should be `server` (not `/server`)

---

## ✅ Quick Checklist

1. **Root Directory:** `server` (not `/server`) ✅
2. **Start Command:** `node src/server.js` ✅
3. **Environment Variables:** All set ✅
4. **Check Logs:** Deployments → Latest → Logs tab
5. **Remove PORT variable:** Railway provides PORT automatically

---

## 🚀 After Fixing Root Directory

1. Railway will auto-redeploy
2. Watch the deployment logs
3. Wait for "Build successful"
4. Service should show as "Online" (green)
5. Test: Visit your Railway URL + `/health`

---

## Still Offline?

**Share the error from the logs:**
1. Go to Deployments → Latest deployment
2. Copy the error message from logs
3. Share it with me and I'll help fix it!

