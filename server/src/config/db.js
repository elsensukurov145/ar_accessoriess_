const { Pool } = require('pg');
require('dotenv').config();

/**
 * DATABASE CONFIGURATION
 * 
 * Local Development: Usually requires no SSL.
 * Render Production: Requires SSL ({ rejectUnauthorized: false }).
 * 
 * Priority: 
 * 1. DATABASE_URL (Standard for Render/Heroku)
 * 2. Individual DB_* variables (Fallback/Local)
 */

const isLocal = 
  process.env.DB_HOST === 'localhost' || 
  process.env.DB_HOST === '127.0.0.1' || 
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost'));

const sslConfig = isLocal ? false : { rejectUnauthorized: false };

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
  };
} else {
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: sslConfig,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err.message);
});

pool.on('connect', () => {
  const host = poolConfig.host || 'Remote/DATABASE_URL';
  const mode = isLocal ? 'LOCAL' : 'PRODUCTION/SSL';
  console.log(`✅ Connected to PostgreSQL [${mode}] on ${host}`);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};

