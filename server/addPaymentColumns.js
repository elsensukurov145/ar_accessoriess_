/**
 * addPaymentColumns.js — Migration script to add payment tracking columns to existing orders table
 * 
 * Run this once on existing databases:
 *   node addPaymentColumns.js
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

async function addPaymentColumns() {
  const client = await pool.connect();
  try {
    console.log('🔄 Adding payment columns to orders table...');
    await client.query('BEGIN');

    // Add payment tracking columns
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'manual';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_name VARCHAR(100) DEFAULT 'manual';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_payment_url TEXT;
    `);

    // Verify columns were added
    const colResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name='orders' 
      ORDER BY ordinal_position
    `);

    console.log('\n✅ Orders table columns after migration:');
    colResult.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type})`);
    });

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

addPaymentColumns();
