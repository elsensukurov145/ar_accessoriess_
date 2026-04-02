#!/bin/bash
# Diagnostic script to check Render deployment
# Run this to see what's happening on Render

echo "=== RENDER DEPLOYMENT DIAGNOSTIC ==="
echo ""
echo "🔍 Checking environment:"
echo "NODE_ENV: $NODE_ENV"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_USER: $DB_USER"
echo "DB_PASSWORD: (hidden)"
echo "DB_NAME: $DB_NAME"
echo ""
echo "🔍 Checking if .env file exists:"
[ -f .env ] && echo "✓ .env EXISTS locally" || echo "✗ .env does NOT exist"
echo ""
echo "🔍 If tests pass, database should work:"
node -e "
const db = require('./src/config/db');
const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const database = process.env.DB_NAME;
console.log('Database config:', { host, user, database });
"
