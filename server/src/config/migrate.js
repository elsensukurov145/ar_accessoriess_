/**
 * migrate.js — Safe migration for existing databases.
 * 
 * Run this to upgrade an existing database schema:
 *   node src/config/migrate.js
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

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');
    await client.query('BEGIN');

    // 1. Ensure all required orders columns exist (CORRECT schema matching orderController)
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS name VARCHAR(200);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS surname VARCHAR(200);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS email VARCHAR(200);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'manual';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_name VARCHAR(100) DEFAULT 'manual';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_payment_url TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // 2. Remove obsolete columns if they exist (customer_name, customer_email, etc. are wrong naming)
    const checkOldColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='orders' AND column_name IN ('customer_name', 'customer_email', 'customer_phone', 'customer_address', 'total_price')
    `);
    
    for (const row of checkOldColumns.rows) {
      console.log(`  ⚠️  Found obsolete column: ${row.column_name}`);
    }

    // If old columns exist and correct columns are also there, we can safely drop the old ones
    const hasNewColumns = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_name='orders' AND column_name IN ('name', 'surname', 'address')
    `);
    
    if (hasNewColumns.rows[0].count >= 3) {
      // New schema is in place, safe to drop old columns
      await client.query(`
        ALTER TABLE orders DROP COLUMN IF EXISTS customer_name;
        ALTER TABLE orders DROP COLUMN IF EXISTS customer_email;
        ALTER TABLE orders DROP COLUMN IF EXISTS customer_phone;
        ALTER TABLE orders DROP COLUMN IF EXISTS customer_address;
        ALTER TABLE orders DROP COLUMN IF EXISTS total_price;
      `);
      console.log('  ✅ Removed obsolete columns (customer_* and total_price)');
    }

    // 3. Make user_id nullable (optional foreign key)
    const hasUserId = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='user_id'
    `);
    if (hasUserId.rows.length > 0) {
      await client.query(`ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL`);
      console.log('  ✅ user_id is nullable');
    }

    // 4. Create order_items with VARCHAR product_id (no FK to products)
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(100) NOT NULL DEFAULT '',
        product_name VARCHAR(255) NOT NULL DEFAULT '',
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price_at_purchase NUMERIC(10, 2) NOT NULL DEFAULT 0,
        selected_color VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Fix order_items if it was already created with INTEGER/FK product_id
    const fkRows = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'order_items'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'product_id'
    `);
    for (const row of fkRows.rows) {
      await client.query(`ALTER TABLE order_items DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
      console.log(`  ✅ Dropped FK: ${row.constraint_name}`);
    }

    // Alter product_id to VARCHAR if still integer
    const colType = await client.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name='order_items' AND column_name='product_id'
    `);
    if (colType.rows.length > 0 && colType.rows[0].data_type !== 'character varying') {
      await client.query(`
        ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(100) USING product_id::text
      `);
      console.log('  ✅ product_id converted to VARCHAR');
    }

    // 6. Add missing columns to order_items
    await client.query(`
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NOT NULL DEFAULT '';
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_color VARCHAR(100) DEFAULT '';
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
