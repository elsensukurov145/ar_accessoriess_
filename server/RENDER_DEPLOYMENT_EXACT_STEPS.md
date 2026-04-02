# 🚀 EXACT RENDER DEPLOYMENT STEPS

## STEP 1: Get Your Render Database Credentials (5 minutes)

**Action Items:**
1. Go to https://render.com/dashboard
2. Click **"PostgreSQL"** on the left sidebar
3. Click on your database (e.g., "ecommerce-db" or similar)
4. Scroll down to **"Connections"** section
5. You will see a table with these columns:
   - **Host** (e.g., `dpg-abc123def456.render.com`)
   - **Database** (e.g., `ecommerce_prod_abcd`)
   - **User** (usually `postgres`)
   - **Password** (a long random string)
   - **Port** (usually `5432`)

**Copy these exact values - you'll need them in Step 2**

---

## STEP 2: Set Environment Variables in Render Dashboard (5 minutes)

**⚠️ CRITICAL: These must be set EXACTLY as shown, with EXACT values from Step 1**

1. In the same Render dashboard, find your **Web Service** (backend)
   - Click on it to open the service details

2. Go to **Settings** tab on the left

3. Scroll down to **"Environment"** section

4. Click **"Add Environment Variable"** and add THESE variables:

   ```
   NODE_ENV = production
   DB_HOST = [paste your Host from Step 1]
   DB_PORT = 5432
   DB_USER = postgres
   DB_PASSWORD = [paste your Password from Step 1]
   DB_NAME = [paste your Database from Step 1]
   CLIENT_URL = https://your-frontend-url.com
   PORT = 3000
   STRIPE_SECRET_KEY = sk_test_...
   JWT_SECRET = your_secret_key
   EMAIL_USER = your_email@gmail.com
   EMAIL_PASS = your_app_password
   ```

   **Example of what it should look like:**
   ```
   NODE_ENV production
   DB_HOST dpg-abc123def456.render.com
   DB_PORT 5432
   DB_USER postgres
   DB_PASSWORD abcdef123456ghijkl789
   DB_NAME ecommerce_prod_abcd1234
   CLIENT_URL https://example.com
   ```

5. Click **"Save Changes"**

6. Render will automatically redeploy with these new variables ✓

**Important:** Do NOT put quotes around the values in Render dashboard

---

## STEP 3: Deploy Updated Code from Git (2 minutes)

Your earlier changes (SSL support, validation) are already in git. Now:

```bash
cd /home/admin123/Downloads/electronics/LC9/azeri-tech-essentials-main
git add -A
git commit -m "chore: add environment validation for db connection"
git push
```

Render will auto-deploy. Watch the logs to see the deployment progress.

**What to look for in Render logs:**
- ✅ `npm install` completes
- ✅ `npm start` runs
- ✅ `🚀 Starting server in production mode`
- ✅ `✅ Connected to PostgreSQL database`
- ✅ `🔒 SSL/TLS enabled for PostgreSQL connection (Render)`
- ✓ Server running on port 3000

---

## STEP 4: Initialize Database Tables on Render (3 minutes)

**CRITICAL: This MUST be done or /api/products will fail with "relation does not exist"**

1. In Render Dashboard, go to your Web Service

2. Scroll to the bottom and click **"Shell"** tab

3. You should see a bash shell. Run this command:

   ```bash
   npm run init-db
   ```

4. Watch the output - you should see:
   ```
   ✅ Database tables successfully initialized and seeded!
   ```

   If you see errors, show me the exact error message.

---

## STEP 5: Test It Works (2 minutes)

### Test 1: Check Health Endpoint ✓

```bash
curl https://YOUR_RENDER_BACKEND_URL.onrender.com/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T10:30:45.123Z",
  "environment": "production",
  "database": "dpg-abc123.render.com"
}
```

If you see database host here, it means environment variables ARE SET ✓

### Test 2: Check Products Endpoint ✓

```bash
curl https://YOUR_RENDER_BACKEND_URL.onrender.com/api/products
```

**Expected response:** (array of products)
```json
{
  "success": true,
  "products": [
    {
      "id": "case-001",
      "name": {
        "en": "Premium Silicone Case — Black",
        "az": "Premium Silikon Keys — Qara",
        "ru": "Премиум Силиконовый Чехол — Чёрный"
      },
      "price": 25,
      ...
    },
    ...
  ]
}
```

**If you see this, CONGRATULATIONS! 🎉 It works!**

---

## TROUBLESHOOTING: If It Doesn't Work

### Error: "DB_HOST is missing" or similar

**Cause:** Environment variables not set in Render dashboard

**Fix:** 
1. Go back to Render Dashboard → Settings → Environment
2. Verify all variables are set
3. Check values are EXACTLY as shown in Step 2
4. No typos in variable names
5. Click "Save Changes"
6. Wait for Render to redeploy

### Error: "Connection refused"

**Cause:** Wrong database credentials OR database is "sleeping" (free tier)

**Fix:**
1. Double-check DB_HOST, DB_USER, DB_PASSWORD in Render
2. Compare with values from Database → Connections page
3. If database says "asleep" → click to wake it

### Error: "relation 'products' does not exist"

**Cause:** `npm run init-db` was not run

**Fix:**
1. Go to Render Web Shell
2. Run: `npm run init-db`
3. Wait for success message
4. Retry /api/products

### Error: Returns "Server Error" with no details

**Cause:** NODE_ENV is not "production"

**Fix:**
1. Check Render environment variables
2. Verify `NODE_ENV = production` is set
3. Save and wait for redeploy

---

## LOCAL DEVELOPMENT: Make Sure It Still Works

After setting up Render, verify your LOCAL setup still works:

```bash
cd /home/admin123/Downloads/electronics/LC9/azeri-tech-essentials-main/server

# Make sure local .env exists with localhost
cat .env
# Should show:
# DB_HOST=localhost
# DB_USER=postgres
# etc.

# Start local dev
npm run dev

# In another terminal, test:
curl http://localhost:5000/api/products

# Should return data
```

If local breaks, check:
- [ ] .env has `DB_HOST=localhost`
- [ ] Local PostgreSQL is running
- [ ] Database exists: `createdb ecommerce`
- [ ] Tables exist: run `npm run init-db` locally

---

## SUMMARY CHECKLIST

- [ ] Got Render database credentials (Host, Database, User, Password, Port)
- [ ] Set environment variables in Render Dashboard
- [ ] Rendered deployment auto-completed
- [ ] Ran `npm run init-db` in Render Web Shell
- [ ] /api/health returns with correct database host
- [ ] /api/products returns array of products (not error)
- [ ] Local /api/products still works
- [ ] All endpoints functioning correctly

---

## WHAT HAPPENS BEHIND THE SCENES

**Local Development:**
```
npm run dev
→ Loads .env (localhost config)
→ db.js connects to localhost:5432
→ initDb.js creates tables locally
→ /api/products returns data ✓
```

**Render Production:**
```
Render dashboard → Set environment variables
→ npm start reads process.env from Render
→ db.js connects to dpg-XXXXX.render.com:5432 WITH SSL
→ npm run init-db creates tables on Render
→ /api/products returns data from Render DB ✓
```

---

## NEED HELP?

If you get stuck:
1. Check Render logs (Render Dashboard → Logs)
2. Show me exact error messages
3. Verify all environment variables are set
4. Verify database credentials are correct
5. Make sure npm run init-db succeeded
