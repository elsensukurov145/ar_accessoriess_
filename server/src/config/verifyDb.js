const { pool } = require('./db');

async function verify() {
  console.log('🔍 Testing Database Connection...');
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    const end = Date.now();
    
    console.log('✅ Connection Successful!');
    console.log(`⏱️  Latency: ${end - start}ms`);
    console.log(`📦 Database: ${res.rows[0].db_name}`);
    console.log(`⏰ Server Time: ${res.rows[0].current_time}`);
    
    // Check tables
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📊 Tables found:');
    if (tableRes.rows.length === 0) {
      console.log('⚠️  No tables found in public schema.');
    } else {
      tableRes.rows.forEach(row => console.log(` - ${row.table_name}`));
    }
    
    // Check products count
    try {
      const productCount = await pool.query('SELECT COUNT(*) FROM products');
      console.log(`\n🛍️  Product count: ${productCount.rows[0].count}`);
    } catch (e) {
      console.log('\n❌ Could not query products table (maybe it doesn\'t exist yet)');
    }

  } catch (err) {
    console.error('\n❌ Connection Failed!');
    console.error('Error Details:', err.message);
    if (err.code === 'ENOTFOUND') {
      console.error('Hint: Check if your DB_HOST is correct.');
    } else if (err.message.includes('SSL')) {
      console.error('Hint: SSL is required but might be failing. Check your SSL settings.');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verify();
