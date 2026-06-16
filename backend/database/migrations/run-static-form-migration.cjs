const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gawing_survey',
    multipleStatements: true,
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add_static_form_tables.sql'), 'utf8');
    await connection.query(sql);
    console.log('Static-form tables migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

runMigration();
