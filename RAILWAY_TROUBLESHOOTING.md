# Railway Backend Offline - Troubleshooting Guide

## Quick Fixes to Try

### 1. Check Railway Deployment Logs
1. In Railway dashboard, click on your **"DataAnalyst"** service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Check the **"Logs"** tab for errors

**Common errors to look for:**
- ❌ "Cannot find module" → Missing dependencies
- ❌ "Port already in use" → Port conflict
- ❌ "Database connection failed" → Wrong DB credentials
- ❌ "ENOENT: no such file" → Wrong file path

### 2. Verify Settings

In Railway service **Settings** → **Source** tab:
- ✅ **Root Directory:** Should be `server` (not `/server`)
- ✅ **Branch:** Should be `main` (or your main branch name)

In Railway service **Settings** → **Deploy** tab:
- ✅ **Custom Start Command:** Should be `node src/server.js`
  - Alternative: `npm start` (which should run `node src/server.js`)

### 3. Check Environment Variables

Go to **Variables** tab and verify all are set:
```
DB_SERVER=your_server
DB_PORT=1433
DB_DATABASE=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
PORT=4000
NODE_ENV=production
```

**Important Notes:**
- Remove any spaces around the `=` sign
- Don't use quotes around values
- Make sure there are no trailing spaces

### 4. Force Redeploy

1. Go to **Deployments** tab
2. Click **"..."** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Watch the logs to see what happens

### 5. Common Issues & Solutions

#### Issue: "Cannot find module 'express'" or similar
**Solution:** Railway might not have installed dependencies
- Go to **Settings** → **Build** tab
- **Build Command:** Should be `npm install` or leave empty (Railway auto-detects)
- Redeploy

#### Issue: "Port 4000 is already in use"
**Solution:** Railway assigns its own PORT, you should use it
- Check if your code uses `process.env.PORT`
- Your `server.js` should have: `const PORT = process.env.PORT || 4000;`

#### Issue: Database connection fails
**Solution:** 
- Verify DB_SERVER format (just IP/hostname, no port)
- Check DB_PORT is set to `1433`
- Make sure your SQL Server allows connections from Railway's IP addresses
- Test connection locally first

#### Issue: Service starts then immediately stops
**Solution:**
- Check logs for runtime errors
- Verify all environment variables are correct
- Check if the service is listening on the PORT Railway provides

### 6. Verify Your server.js File

Make sure your `server/src/server.js` starts the server correctly:

```javascript
const PORT = process.env.PORT || 4000;  // ✅ Uses Railway's PORT

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

### 7. Check Build Logs

1. Go to **Deployments** tab
2. Click on latest deployment
3. Check **"Build Logs"** section
4. Look for:
   - ✅ "Build successful"
   - ✅ "Installing dependencies"
   - ❌ Any errors

### 8. Test Health Endpoint (After Service is Online)

Once online, test:
```
GET https://your-service.up.railway.app/health
```

Should return: `{"status":"ok","database":"connected"}`

---

## Step-by-Step Debug Process

1. ✅ **Check Root Directory:**
   - Settings → Source → Root Directory = `server` (without leading slash)

2. ✅ **Check Start Command:**
   - Settings → Deploy → Custom Start Command = `node src/server.js`

3. ✅ **Check Environment Variables:**
   - Variables tab → All variables set correctly

4. ✅ **Check Deployment Logs:**
   - Deployments → Latest → Logs tab → Look for errors

5. ✅ **Force Redeploy:**
   - Deployments → Latest → Redeploy → Watch logs

6. ✅ **Verify PORT:**
   - Make sure code uses `process.env.PORT` (Railway provides this)

---

## Still Not Working?

If still offline after trying above:

1. **Share the error logs** from Railway (Deployments → Latest → Logs)
2. **Check if the service name matches** your repository structure
3. **Verify the GitHub repo** is connected correctly
4. **Try creating a new service** if current one seems corrupted

---

## Quick Checklist

- [ ] Root Directory is `server` (not `/server`)
- [ ] Start Command is `node src/server.js`
- [ ] All environment variables are set
- [ ] No errors in deployment logs
- [ ] Service is listening on `process.env.PORT`
- [ ] Database connection details are correct
- [ ] OpenAI API key is valid

