const { Pool } = require('pg');
require('dotenv').config();

// Validate that required environment variables are set
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:', missingVars.join(', '));
  console.error('');
  console.error('For LOCAL DEVELOPMENT: Create server/.env with:');
  console.error('  DB_HOST=localhost');
  console.error('  DB_PORT=5432');
  console.error('  DB_USER=postgres');
  console.error('  DB_PASSWORD=your_password');
  console.error('  DB_NAME=ecommerce');
  console.error('');
  console.error('For RENDER PRODUCTION: Set these in Render Dashboard → Settings → Environment:');
  console.error('  DB_HOST=dpg-XXXXX.render.com (from Render database)');
  console.error('  DB_PORT=5432');
  console.error('  DB_USER=postgres (from Render database)');
  console.error('  DB_PASSWORD=your_password (from Render database)');
  console.error('  DB_NAME=your_db_name (from Render database)');
  console.error('');
  process.exit(1);
}

// Detect environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('render.com') || process.env.DB_HOST?.startsWith('dpg-');

// Build connection config
const poolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
};

// Add SSL configuration for Render (production)
if (isProduction) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
  console.log('🔒 SSL/TLS enabled for PostgreSQL connection (Render)');
} else {
  console.log('🔓 SSL/TLS disabled (Local Development)');
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
