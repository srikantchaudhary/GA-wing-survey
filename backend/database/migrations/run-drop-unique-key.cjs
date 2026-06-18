const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gawing_survey'
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'drop_responses_unique_key.sql'), 'utf8');
    await connection.query(sql);
    console.log('Migration completed: unique key dropped from responses table.');
  } catch (error) {
    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('Index uq_state_form does not exist — already migrated.');
    } else {
      console.error('Migration failed:', error.message);
    }
  } finally {
    await connection.end();
  }
}

runMigration();
