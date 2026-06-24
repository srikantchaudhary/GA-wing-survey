const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'ims',
    password: process.env.DB_PASSWORD || 'ims',
    database: process.env.DB_NAME || 'ims',
  });
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS form_final_status (
        state        VARCHAR(255) NOT NULL,
        form_id      VARCHAR(64)  NOT NULL,
        finalized_by BIGINT       DEFAULT NULL,
        finalized_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (state, form_id),
        CONSTRAINT fk_final_state FOREIGN KEY (state)        REFERENCES states (name)    ON DELETE CASCADE  ON UPDATE CASCADE,
        CONSTRAINT fk_final_form  FOREIGN KEY (form_id)      REFERENCES forms  (form_id) ON DELETE CASCADE  ON UPDATE CASCADE,
        CONSTRAINT fk_final_user  FOREIGN KEY (finalized_by) REFERENCES users  (id)      ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    console.log('✓ form_final_status table created.');
  } finally {
    await conn.end();
  }
}
run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
