# ✅ STEP-BY-STEP VERIFICATION GUIDE

Use this guide to verify each step is working correctly.

---

## VERIFICATION STEP 1: Local Development Works

### Run This
```bash
cd /home/admin123/Downloads/electronics/LC9/azeri-tech-essentials-main/server
npm run dev
```

### Exact Output You Should See
```
🔓 SSL/TLS disabled (Local Development)
✅ Connected to PostgreSQL database
🚀 Starting server in development mode
📍 Allowed CLIENT_URL: http://localhost:8081
✅ Server running on port 5000
   Health: http://localhost:5000/api/health
   Orders: http://localhost:5000/api/order
   Products: http://localhost:5000/api/products
```

### If You See The Above: ✅ PASS

### If You See Error Messages:

**"FATAL: Missing required environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"**
- .env file missing or incomplete
- Solution: Ensure .env exists with localhost credentials
- Run: `ls -la .env`

**"Error: connect ECONNREFUSED"**
- PostgreSQL not running
- Solution: Start PostgreSQL (varies by OS)
- Check: `psql -U postgres -c "SELECT version();"`

**"database 'ecommerce' does not exist"**
- Database not created
- Solution: `createdb ecommerce`

---

## VERIFICATION STEP 2: Local API /api/health

### Run This
```bash
# In another terminal while npm run dev is running
curl http://localhost:5000/api/health | jq .
```

### Exact Output You Should See
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T10:30:45.123Z",
  "environment": "development",
  "database": "localhost"
}
```

### Check These Details
- [ ] status = "ok"
- [ ] environment = "development" (NOT production)
- [ ] database = "localhost" (NOT dpg-xxxxx)

### If All Match: ✅ PASS

---

## VERIFICATION STEP 3: Local API /api/products

### Run This
```bash
# In another terminal while npm run dev is running
curl http://localhost:5000/api/products | jq . | head -20
```

### Exact Output You Should See (First 20 Lines)
```json
{
  "success": true,
  "products": [
    {
      "id": "case-001",
      "name": {
        "az": "Premium Silikon Keys — Qara",
        "ru": "Премиум Силиконовый Чехол — Чёрный",
        "en": "Premium Silicone Case — Black"
      },
      "description": {
        "az": "Yüksək keyfiyyətli silikon material, əl yaxşı hiss edir.",
        "ru": "Высококачественный силикон.",
        "en": "High-quality silicone material."
      },
      "price": 25,
      "discount_price": null,
      "category": "cases",
```

### Check These Details
- [ ] success = true (NOT false)
- [ ] products array is NOT empty
- [ ] First product has id, name, description, price, etc.

### If All Match: ✅ PASS

**If not, run locally: `npm run init-db` to seed tables**

---

## VERIFICATION STEP 4: Git Status After Commit

### Run This
```bash
cd /home/admin123/Downloads/electronics/LC9/azeri-tech-essentials-main
git log --oneline -3
```

### Exact Output You Should See
```
401ee01 fix: complete PostgreSQL Render deployment fix with environment validation
... (other commits)
```

### Check This Detail
- [ ] Latest commit message includes "PostgreSQL" or "environment validation"

### If Matches: ✅ PASS

---

## VERIFICATION STEP 5: Render Deployment

### What You Do
1. Go to https://render.com/dashboard
2. Click your Web Service
3. Click **Logs** tab
4. Wait 30-60 seconds for deploy

### Exact Output in Render Logs You Should See
```
=== Deploying commit 401ee01 ===
npm install
npm start
🚀 Starting server in production mode
📍 Allowed CLIENT_URL: https://...
✅ Connected to PostgreSQL database
🔒 SSL/TLS enabled for PostgreSQL connection (Render)
✅ Server running on port 3000
```

### Check These Details
- [ ] npm install completed
- [ ] npm start started
- [ ] "production mode" (NOT development)
- [ ] "✅ Connected to PostgreSQL database"
- [ ] "SSL/TLS enabled"

### If All Present: ✅ DEPLOY SUCCESSFUL

---

## VERIFICATION STEP 6: Render Environment Variables Set

### What You Do
1. Go to Render Dashboard → Your Web Service
2. Click **Settings**
3. Look for **Environment** section

### Exact Items You Should See
```
NODE_ENV = production
DB_HOST = dpg-abc123...  (NOT localhost)
DB_PORT = 5432
DB_USER = postgres
DB_PASSWORD = ******* (hidden)
DB_NAME = ecommerce_prod_...
CLIENT_URL = https://...
PORT = 3000
STRIPE_SECRET_KEY = sk_test_...
JWT_SECRET = ...
EMAIL_USER = your_email@...
EMAIL_PASS = ...
```

### Check These Details
- [ ] At least 11 variables present
- [ ] DB_HOST starts with "dpg-" (NOT localhost)
- [ ] NODE_ENV = "production"
- [ ] All values have content (not empty)

### If All Present: ✅ ENV VARS SET

---

## VERIFICATION STEP 7: Database Initialized on Render

### What You Do
1. Go to Render Dashboard → Your Web Service
2. Scroll to bottom → Click **Shell**
3. Type: `npm run init-db`
4. Press Enter
5. Wait for completion

### Exact Output You Should See
```
🔒 SSL/TLS enabled for PostgreSQL connection (Render)
✅ Connected to PostgreSQL database
Connecting to PostgreSQL to initialize tables...
Seeding Admin User...
Seeding Products...
✅ Database tables successfully initialized and seeded!
```

### Check These Details
- [ ] "OpenSSL/TLS enabled"
- [ ] "✅ Connected to PostgreSQL database"
- [ ] "✅ Database tables successfully initialized and seeded!" (at the end)
- [ ] No error messages about permissions, connections, or syntax

### If All Match: ✅ DATABASE INITIALIZED

**If you see error, run it again and show me the exact error**

---

## VERIFICATION STEP 8: Render /api/health Endpoint

### What You Do
1. Replace YOUR_URL with your actual Render backend URL
2. Run this command:
```bash
curl https://YOUR_URL.onrender.com/api/health | jq .
```

### Exact Output You Should See
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T10:35:12.456Z",
  "environment": "production",
  "database": "dpg-abc123def456.render.com"
}
```

### Check These Details
- [ ] status = "ok"
- [ ] environment = "production" (NOT development)
- [ ] database = "dpg-" (NOT localhost, NOT "not configured")
- [ ] timestamp is current (roughly now)

### If All Match: ✅ ENVIRONMENT VARIABLES WORKING

**This is the MOST important verification - if database shows dpg- host, you're winning!**

---

## VERIFICATION STEP 9: Render /api/products Endpoint

### What You Do
1. Replace YOUR_URL with your actual Render backend URL
2. Run this command:
```bash
curl https://YOUR_URL.onrender.com/api/products | jq . | head -20
```

### Exact Output You Should See
```json
{
  "success": true,
  "products": [
    {
      "id": "case-001",
      "name": {
        "az": "Premium Silikon Keys — Qara",
        "ru": "Премиум Силиконовый Чехол — Чёрный",
        "en": "Premium Silicone Case — Black"
      },
      "description": {
        "az": "Yüksək keyfiyyətli silikon material, əl yaxşı hiss edir.",
        "ru": "Высококачественный силикон.",
        "en": "High-quality silicone material."
      },
```

### Check These Details
- [ ] success = true (NOT false)
- [ ] products array is NOT empty (has items)
- [ ] First product has all expected fields

### If All Match: ✅ PRODUCTS API WORKING

**THIS MEANS YOUR FIX IS COMPLETE!**

---

## FINAL VERIFICATION CHECKLIST

```bash
# Run all these to verify everything works

echo "=== LOCAL VERIFICATION ==="
curl -s http://localhost:5000/api/health | jq -r '.environment'
curl -s http://localhost:5000/api/products | jq -r '.success'

echo ""
echo "=== RENDER VERIFICATION ==="
# Replace YOUR_URL with your actual Render URL
curl -s https://YOUR_URL.onrender.com/api/health | jq -r '.database'
curl -s https://YOUR_URL.onrender.com/api/products | jq -r '.success'
```

### Expected Output
```
=== LOCAL VERIFICATION ===
development
true

=== RENDER VERIFICATION ===
dpg-XXXXX.render.com
true
```

**If you see this, CONGRATULATIONS! Everything works! 🎉**

---

## TROUBLESHOOTING FROM HERE

### If /api/health shows "not configured"
- Environment variables not set in Render Dashboard
- Go back and complete STEP 6

### If /api/health shows localhost
- NODE_ENV might not be set to "production"
- Check Render → Settings → Environment variables

### If /api/products returns error or empty
- Database not initialized
- Go back and complete STEP 7
- Run `npm run init-db` again

### If you see "Server Error" without details
- Check Render → Logs for actual error
- Shows "relation 'products' does not exist" → run init-db
- Shows "Connection refused" → check environment variables

---

## SUCCESS INDICATORS

When you can run VERIFICATION STEP 9 and see products returning, you know:

✅ Environment variables are set correctly
✅ Database connection is working
✅ SSL is properly configured
✅ Tables exist in Render database
✅ Seed data was inserted
✅ Render backend is fully functional
✅ /api/products is working
✅ Local development still works

**You're done!**
