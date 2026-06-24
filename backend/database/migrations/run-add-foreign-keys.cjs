const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CONSTRAINTS = [
  // users
  { table: 'users', name: 'fk_users_created_by', sql: 'ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'users', name: 'fk_users_updated_by', sql: 'ALTER TABLE users ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'users', name: 'fk_users_state',      sql: 'ALTER TABLE users ADD CONSTRAINT fk_users_state FOREIGN KEY (state) REFERENCES states (name) ON DELETE RESTRICT ON UPDATE CASCADE' },

  // forms
  { table: 'forms', name: 'fk_forms_created_by', sql: 'ALTER TABLE forms ADD CONSTRAINT fk_forms_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'forms', name: 'fk_forms_updated_by', sql: 'ALTER TABLE forms ADD CONSTRAINT fk_forms_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },

  // custom_sections
  { table: 'custom_sections', name: 'fk_custom_sections_created_by', sql: 'ALTER TABLE custom_sections ADD CONSTRAINT fk_custom_sections_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'custom_sections', name: 'fk_custom_sections_updated_by', sql: 'ALTER TABLE custom_sections ADD CONSTRAINT fk_custom_sections_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },

  // responses
  { table: 'responses', name: 'fk_responses_form_id', sql: 'ALTER TABLE responses ADD CONSTRAINT fk_responses_form_id FOREIGN KEY (form_id) REFERENCES forms (form_id) ON DELETE RESTRICT ON UPDATE CASCADE' },
  { table: 'responses', name: 'fk_responses_state',   sql: 'ALTER TABLE responses ADD CONSTRAINT fk_responses_state FOREIGN KEY (state) REFERENCES states (name) ON DELETE RESTRICT ON UPDATE CASCADE' },
  { table: 'responses', name: 'fk_responses_officer', sql: 'ALTER TABLE responses ADD CONSTRAINT fk_responses_officer FOREIGN KEY (officer_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'responses', name: 'fk_responses_created', sql: 'ALTER TABLE responses ADD CONSTRAINT fk_responses_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'responses', name: 'fk_responses_updated', sql: 'ALTER TABLE responses ADD CONSTRAINT fk_responses_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },

  // draft_responses
  { table: 'draft_responses', name: 'fk_drafts_form_id', sql: 'ALTER TABLE draft_responses ADD CONSTRAINT fk_drafts_form_id FOREIGN KEY (form_id) REFERENCES forms (form_id) ON DELETE CASCADE ON UPDATE CASCADE' },
  { table: 'draft_responses', name: 'fk_drafts_state',   sql: 'ALTER TABLE draft_responses ADD CONSTRAINT fk_drafts_state FOREIGN KEY (state) REFERENCES states (name) ON DELETE CASCADE ON UPDATE CASCADE' },
  { table: 'draft_responses', name: 'fk_drafts_created', sql: 'ALTER TABLE draft_responses ADD CONSTRAINT fk_drafts_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'draft_responses', name: 'fk_drafts_updated', sql: 'ALTER TABLE draft_responses ADD CONSTRAINT fk_drafts_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },

  // da_nominations
  { table: 'da_nominations', name: 'fk_da_nom_state',       sql: 'ALTER TABLE da_nominations ADD CONSTRAINT fk_da_nom_state FOREIGN KEY (state) REFERENCES states (name) ON DELETE RESTRICT ON UPDATE CASCADE' },
  { table: 'da_nominations', name: 'fk_da_nom_designation', sql: 'ALTER TABLE da_nominations ADD CONSTRAINT fk_da_nom_designation FOREIGN KEY (designation) REFERENCES designations (name) ON DELETE RESTRICT ON UPDATE CASCADE' },
  { table: 'da_nominations', name: 'fk_da_nom_created',     sql: 'ALTER TABLE da_nominations ADD CONSTRAINT fk_da_nom_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'da_nominations', name: 'fk_da_nom_updated',     sql: 'ALTER TABLE da_nominations ADD CONSTRAINT fk_da_nom_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },

  // mca_mki_records
  { table: 'mca_mki_records', name: 'fk_mca_mki_state',   sql: 'ALTER TABLE mca_mki_records ADD CONSTRAINT fk_mca_mki_state FOREIGN KEY (state) REFERENCES states (name) ON DELETE RESTRICT ON UPDATE CASCADE' },
  { table: 'mca_mki_records', name: 'fk_mca_mki_created', sql: 'ALTER TABLE mca_mki_records ADD CONSTRAINT fk_mca_mki_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'mca_mki_records', name: 'fk_mca_mki_updated', sql: 'ALTER TABLE mca_mki_records ADD CONSTRAINT fk_mca_mki_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },

  // grievances
  { table: 'grievances', name: 'fk_grievances_created', sql: 'ALTER TABLE grievances ADD CONSTRAINT fk_grievances_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
  { table: 'grievances', name: 'fk_grievances_updated', sql: 'ALTER TABLE grievances ADD CONSTRAINT fk_grievances_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE' },
];

async function constraintExists(conn, db, table, name) {
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [db, table, name]
  );
  return row.cnt > 0;
}

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'ims',
    password: process.env.DB_PASSWORD || 'ims',
    database: process.env.DB_NAME     || 'ims',
  });

  const db = process.env.DB_NAME || 'ims';
  let added = 0, skipped = 0;

  try {
    for (const c of CONSTRAINTS) {
      const exists = await constraintExists(conn, db, c.table, c.name);
      if (exists) {
        console.log(`  skip  ${c.name}`);
        skipped++;
        continue;
      }
      try {
        await conn.query(c.sql);
        console.log(`  ✓ add  ${c.name}`);
        added++;
      } catch (err) {
        console.error(`  ✗ fail ${c.name}: ${err.message}`);
      }
    }

    // Add performance indexes (ignore if already exist)
    const indexes = [
      'ALTER TABLE responses    ADD INDEX idx_responses_form_id (form_id)',
      'ALTER TABLE responses    ADD INDEX idx_responses_state   (state)',
      'ALTER TABLE responses    ADD INDEX idx_responses_officer (officer_id)',
      'ALTER TABLE da_nominations  ADD INDEX idx_da_nominations_state (state)',
      'ALTER TABLE mca_mki_records ADD INDEX idx_mca_mki_state        (state)',
    ];
    for (const sql of indexes) {
      try { await conn.query(sql); } catch (_) { /* index already exists — skip */ }
    }

    console.log(`\nDone: ${added} added, ${skipped} already existed.`);
  } finally {
    await conn.end();
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
