# 🚀 Render Deployment & Database Setup Guide

This guide walks through fixing your PostgreSQL connection for Render deployment.

---

## 📋 Problem Summary

- ✅ Backend is deployed on Render
- ✅ `/api/health` works
- ❌ `/api/products` returns error (likely database connection issue)
- ❌ Tables may not exist in Render database
- ❌ SSL/TLS not configured for Render PostgreSQL

---

## 🔧 Quick Fixes Applied

The following changes have been made to your codebase:

### 1. **db.js** - Added SSL Configuration
```javascript
// Automatically detects Render environment and enables SSL
if (isProduction) {
  poolConfig.ssl = { rejectUnauthorized: false };
}
```

### 2. **initDb.js** - SSL Support for Seed Script
- Same SSL detection as db.js
- Now works on both local and Render environments

### 3. **index.js** - Environment Detection
- Added `NODE_ENV` environment variable support
- CLIENT_URL now properly configured for production
- Health check returns environment info for debugging

---

## 📝 Configuration Steps

### Step 1: Get Render Database Credentials

1. Go to **https://render.com/dashboard**
2. Click **"PostgreSQL"** → **Create** (or select existing database)
3. Wait for database to be ready (green status)
4. Click on the database to view details
5. Copy the **"External Database URL"** and **Connections** info

**Example URL format:**
```
postgresql://username:password@host.render.com:5432/dbname
```

**Extract these values:**
- `DB_HOST` = host.render.com
- `DB_PORT` = 5432 (usually)
- `DB_USER` = username
- `DB_PASSWORD` = password
- `DB_NAME` = dbname

### Step 2: Update Your `.env` File

**⚠️ Never commit your `.env` file to git!**

Create or update `.env` in `/server/.env`:

```env
# Production (Render) Configuration
NODE_ENV=production
DB_HOST=dpg-XXXXX.render.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_actual_password
DB_NAME=ecommerce_prod
CLIENT_URL=https://your-frontend.vercel.app
PORT=3000

# Same for both local and production
STRIPE_SECRET_KEY=sk_test_...
JWT_SECRET=your_super_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Step 3: Deploy Backend Service to Render

If you haven't already:

1. Go to **https://render.com** → **Create** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** azeri-tech-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or paid)
4. Click **"Advanced"** → **Add Environment Variables**
5. Add all variables from your `.env` file

### Step 4: Seed the Render Database

**⚠️ CRITICAL:** You must run the seed script to create tables on Render!

#### Option A: Using Render Web Shell (Easiest)

1. Go to Render Dashboard → Your Web Service
2. Click on the service
3. Scroll down → Click **"Shell"** tab (or use console at bottom)
4. Run:
   ```bash
   npm run init-db
   ```
5. Watch for success message: `✅ Database tables successfully initialized and seeded!`

#### Option B: Using Local CLI (Advanced)

First, install Render CLI:
```bash
curl -O https://binaries.render.com/render/latest/render-cli-linux-latest
chmod +x render-cli-linux-latest
sudo mv render-cli-linux-latest /usr/local/bin/render
```

Then run:
```bash
render exec azeri-tech-backend npm run init-db
```

---

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# 1. Check health endpoint (should include database host)
curl https://your-backend.onrender.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-04-03T...",
  "environment": "production",
  "database": "dpg-XXXXX.render.com"
}

# 2. Check products endpoint (should return products, not error)
curl https://your-backend.onrender.com/api/products

# Expected response:
{
  "success": true,
  "products": [
    { "id": "case-001", "name": {...}, ... },
    ...
  ]
}

# 3. Check server logs
# Go to Render Dashboard → Your Service → Logs
# Look for: "✅ Connected to PostgreSQL database"
#           "✅ Database tables successfully initialized and seeded!"
```

---

## 🗄️ Data Migration (Local → Render)

If you want to migrate existing data from your local database to Render:

### Option 1: Using PostgreSQL Tools (Recommended)

1. **Export from local database:**
   ```bash
   pg_dump -U postgres -h localhost ecommerce > ecommerce_backup.sql
   ```

2. **Import to Render database:**
   ```bash
   psql -h dpg-XXXXX.render.com -U postgres -d ecommerce_prod < ecommerce_backup.sql
   ```
   (When prompted, enter Render database password)

### Option 2: Using DBeaver (GUI)

1. Install DBeaver: https://dbeaver.io
2. Create connection to local database
3. Export all tables/data
4. Create connection to Render database
5. Import data

### Option 3: Using Render's Manual SQL

1. Get your database credentials
2. Use a client like [Adminer](https://adminer.org) or SQL client
3. Connect and import your .sql backup

---

## 🐛 Troubleshooting

### Issue: `"status": "failed to connect to database"`

**Solution:**
1. Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct in `.env`
2. Check Render logs: Render Dashboard → Logs
3. Ensure database exists and is running
4. Try connecting from your local machine first:
   ```bash
   psql -h dpg-XXXXX.render.com -U postgres -d ecommerce_prod
   ```

### Issue: `/api/products` returns `"Server Error"`

**Likely causes:**
1. Tables don't exist → Run `npm run init-db` in Render Web Shell
2. Connection failed → Check credentials and SSL settings
3. Database empty → Seed script didn't run successfully

**Solution:**
1. Check logs in Render Dashboard
2. Open Web Shell
3. Run:
   ```bash
   npm run init-db
   # Watch output for errors
   ```

### Issue: "Pool query timeout" or "connection refused"

**Solution:**
1. Verify `DB_HOST` includes `.render.com` domain
2. Check if SSL is properly configured (it is, if you used updated code)
3. Ensure Render database is active (not sleeping)

### Issue: Render database "sleeping" (Free tier)

If using free tier:
- Database may sleep after 7 days of inactivity
- Upgrade to Standard tier for always-on database
- Or manually wake it up by connecting

---

## 📦 Environment Variables Reference

### For Local Development

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_NAME=ecommerce
CLIENT_URL=http://localhost:3000
PORT=5000
```

### For Render Production

```env
NODE_ENV=production
DB_HOST=dpg-XXXXX.render.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_render_password
DB_NAME=ecommerce_prod
CLIENT_URL=https://your-frontend.com
PORT=3000
```

---

## 🔄 Deployment Workflow

Once set up:

1. Make code changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub
4. Render auto-deploys (watch logs)
5. Frontend connects to your Render backend

That's it! 🎉

---

## 📚 Additional Resources

- [Render PostgreSQL Docs](https://render.com/docs/databases)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [Node.js pg Library](https://node-postgres.com)

---

## ❓ Still Having Issues?

1. Check Render logs: **Render Dashboard → Your Service → Logs**
2. Run health check: **`/api/health`** endpoint
3. Verify database exists: **Render Dashboard → Databases**
4. Check connection params: **Match .env with Render dashboard**
5. Re-run seed script: **Web Shell → `npm run init-db`**
