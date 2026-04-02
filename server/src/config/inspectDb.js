const db = require('./db');

async function inspectSchema() {
  try {
    console.log('Products columns:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? 'DEFAULT ' + row.column_default : ''}`);
    });

    console.log('\nUsers columns:');
    usersResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? 'DEFAULT ' + row.column_default : ''}`);
    });

    console.log('\nOrders columns:');
    ordersResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? 'DEFAULT ' + row.column_default : ''}`);
    });

    console.log('\nAll products data:');
    const allProducts = await db.query('SELECT * FROM products;');
    console.log(JSON.stringify(allProducts.rows, null, 2));

    console.log('\nSample users data:');
    const users = await db.query('SELECT id, email, role, created_at FROM users;');
    console.log(users.rows);

  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    process.exit();
  }
}

inspectSchema();