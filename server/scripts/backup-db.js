#!/usr/bin/env node

/**
 * Database Migration Script
 * Exports PostgreSQL database to SQL backup file
 * 
 * Usage Examples:
 *   npm run backup              (exports from current .env DB)
 *   npm run backup -- backup.sql (custom filename)
 * 
 * Then import to Render:
 *   psql -h dpg-XXXXX.render.com -U postgres -d dbname < ecommerce_backup.sql
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Parse custom filename from args, or use default
const customFilename = process.argv[2];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = customFilename || `${DB_NAME}_backup_${timestamp}.sql`;
const filepath = path.join(__dirname, '..', 'data', filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('📦 Database Backup Utility');
console.log('='.repeat(50));
console.log(`📍 Source Database: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
console.log(`💾 Backup File: ${filename}`);
console.log('='.repeat(50));

// Set password for pg_dump (avoid interactive prompt)
const env = Object.assign({}, process.env, {
  PGPASSWORD: DB_PASSWORD,
});

// Build pg_dump command
const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} > "${filepath}"`;

console.log('\n⏳ Starting backup...\n');

exec(command, { env }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:');
    console.error(stderr || error.message);
    process.exit(1);
  }

  // Check file was created
  if (fs.existsSync(filepath)) {
    const fileSize = (fs.statSync(filepath).size / 1024).toFixed(2);
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📄 File: ${filepath}`);
    console.log(`📊 Size: ${fileSize} KB\n`);

    console.log('📋 Next Steps:\n');

    if (process.env.NODE_ENV === 'production' || DB_HOST.includes('render.com')) {
      console.log('✓ Database appears to be PRODUCTION (Render)');
      console.log('✗ Cannot backup from production into production!');
      process.exit(1);
    }

    console.log('1️⃣  Copy the backup file to your Render database:\n');
    console.log(`   psql -h <YOUR_RENDER_HOST>.render.com \\`);
    console.log(`        -U postgres \\`);
    console.log(`        -d <YOUR_DB_NAME> \\`);
    console.log(`        < "${filename}"\n`);

    console.log('2️⃣  When prompted, enter your Render database password\n');

    console.log('3️⃣  Or pipe directly:\n');
    console.log(`   cat "${filename}" | psql -h <YOUR_RENDER_HOST>.render.com -U postgres -d <YOUR_DB_NAME>\n`);

  } else {
    console.error('❌ Backup file was not created!');
    process.exit(1);
  }
});
