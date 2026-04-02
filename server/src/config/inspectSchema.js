const db = require('./db');

async function inspect() {
  try {
    const tables = ['products','users','orders'];
    for (const table of tables) {
      const result = await db.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [table]);
      console.log('---', table, '---');
      result.rows.forEach(r => console.log(r));
    }
    const sample = await db.query('SELECT * FROM products LIMIT 5');
    console.log('--- products sample ---');
    console.log(sample.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

inspect();