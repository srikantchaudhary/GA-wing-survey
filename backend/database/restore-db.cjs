const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_DIR = __dirname;
const MIGRATIONS_DIR = path.join(DB_DIR, 'migrations');

async function runSqlFile(conn, filePath) {
  let sql = fs.readFileSync(filePath, 'utf8');
  // Strip USE and CREATE DATABASE lines — we already connect to the target DB
  sql = sql
    .replace(/^\s*CREATE\s+DATABASE\s+.*?;/gim, '')
    .replace(/^\s*USE\s+\S+\s*;/gim, '');

  // Split on statement-ending semicolons (skip empty chunks)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^--/.test(s));

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      // Silently skip "already exists" and "duplicate key" errors — idempotent
      if (
        err.code === 'ER_TABLE_EXISTS_ERROR' ||
        err.code === 'ER_DUP_KEYNAME' ||
        err.code === 'ER_DUP_ENTRY' ||
        err.code === 'ER_CANT_DROP_FIELD_OR_KEY'
      ) {
        continue;
      }
      // Skip "duplicate column" errors from ALTER TABLE migrations run on fresh schema
      if (err.code === 'ER_DUP_FIELDNAME') {
        continue;
      }
      console.error(`  ✗ Error in ${path.basename(filePath)}: ${err.message}`);
      console.error(`    Statement: ${stmt.slice(0, 120)}...`);
    }
  }
}

async function restore() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'ims',
    password: process.env.DB_PASSWORD || 'ims',
    database: process.env.DB_NAME || 'ims',
    multipleStatements: true,
  });

  try {
    const files = [
      { label: 'Schema', file: path.join(DB_DIR, 'schema.sql') },
      { label: 'Seed data', file: path.join(DB_DIR, 'seed.sql') },
      { label: 'Migration: add_officer_info_to_responses', file: path.join(MIGRATIONS_DIR, 'add_officer_info_to_responses.sql') },
      { label: 'Migration: add_reference_data', file: path.join(MIGRATIONS_DIR, 'add_reference_data.sql') },
      { label: 'Migration: add_static_form_tables', file: path.join(MIGRATIONS_DIR, 'add_static_form_tables.sql') },
      { label: 'Migration: add_grievances_table', file: path.join(MIGRATIONS_DIR, 'add_grievances_table.sql') },
      { label: 'Migration: drop_responses_unique_key', file: path.join(MIGRATIONS_DIR, 'drop_responses_unique_key.sql') },
    ];

    for (const { label, file } of files) {
      if (!fs.existsSync(file)) {
        console.log(`  ⚠ Skipping ${label} — file not found: ${file}`);
        continue;
      }
      console.log(`Running: ${label}...`);
      await runSqlFile(conn, file);
      console.log(`  ✓ Done`);
    }

    console.log('\n✅ Database restore complete!');
  } finally {
    await conn.end();
  }
}

restore().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
