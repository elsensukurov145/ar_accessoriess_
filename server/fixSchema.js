/**
 * fixSchema.js — Run this once to fix the database schema.
 * 
 * Problem: order_items.product_id was an INTEGER with a FK to products(id),
 * but our app uses string-based product IDs like "case-001".
 * 
 * This script removes that broken FK constraint and alters product_id to VARCHAR.
 * It also ensures all required columns exist.
 * 
 * Usage: node fixSchema.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function fixSchema() {
  const client = await pool.connect();
  try {
    console.log('🔧 Starting schema fix...');

    await client.query('BEGIN');

    // 1. Drop the broken FK constraint on order_items.product_id (any name)
    const fkResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'order_items'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'product_id';
    `);

    for (const row of fkResult.rows) {
      console.log(`  Dropping FK constraint: ${row.constraint_name}`);
      await client.query(`ALTER TABLE order_items DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
    }

    // 2. Alter product_id column to VARCHAR (handles any existing type)
    await client.query(`
      ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(100) USING product_id::text;
    `);
    console.log('  ✅ product_id changed to VARCHAR(100)');

    // 3. Add missing columns if they don't exist
    await client.query(`
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NOT NULL DEFAULT '';
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_color VARCHAR(100) DEFAULT '';
    `);
    console.log('  ✅ Added product_name and selected_color columns');

    // 4. Fix orders table — ensure all needed columns exist
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(200);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'manual';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_name VARCHAR(100) DEFAULT 'manual';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_payment_url TEXT;
    `);
    console.log('  ✅ Orders table columns ensured');

    // 5. Make user_id nullable if it exists
    const userIdCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='user_id';
    `);
    if (userIdCheck.rows.length > 0) {
      await client.query(`ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL`);
      console.log('  ✅ user_id made nullable');
    }

    await client.query('COMMIT');
    console.log('\n✅ Schema fix completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Schema fix failed:', err.message);
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

fixSchema();
