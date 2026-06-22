const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const tables = [
  {
    name: 'da_nominations',
    sql: `CREATE TABLE IF NOT EXISTS da_nominations (
      id BIGINT PRIMARY KEY,
      state VARCHAR(255) NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      designation VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      mobile VARCHAR(32) NOT NULL,
      created_by BIGINT DEFAULT NULL,
      created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_by BIGINT DEFAULT NULL,
      updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  },
  {
    name: 'states',
    sql: `CREATE TABLE IF NOT EXISTS states (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      is_ut TINYINT(1) NOT NULL DEFAULT 0,
      created_by BIGINT DEFAULT NULL,
      created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_by BIGINT DEFAULT NULL,
      updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  },
];

const statesSeed = `INSERT INTO states (name, is_ut) VALUES
  ('Andaman and Nicobar Islands', 1),('Andhra Pradesh', 0),('Arunachal Pradesh', 0),
  ('Assam', 0),('Bihar', 0),('Chandigarh', 1),('Chhattisgarh', 0),
  ('Dadra and Nagar Haveli and Daman and Diu', 1),('Delhi', 1),('Goa', 0),
  ('Gujarat', 0),('Haryana', 0),('Himachal Pradesh', 0),('Jammu and Kashmir', 1),
  ('Jharkhand', 0),('Karnataka', 0),('Kerala', 0),('Ladakh', 1),('Lakshadweep', 1),
  ('Madhya Pradesh', 0),('Maharashtra', 0),('Manipur', 0),('Meghalaya', 0),
  ('Mizoram', 0),('Nagaland', 0),('Odisha', 0),('Puducherry', 1),('Punjab', 0),
  ('Rajasthan', 0),('Sikkim', 0),('Tamil Nadu', 0),('Telangana', 0),('Tripura', 0),
  ('Uttar Pradesh', 0),('Uttarakhand', 0),('West Bengal', 0)
ON DUPLICATE KEY UPDATE is_ut = VALUES(is_ut)`;

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'ims',
    password: process.env.DB_PASSWORD || 'ims',
    database: process.env.DB_NAME || 'ims',
  });

  try {
    for (const t of tables) {
      await conn.query(t.sql);
      console.log('✓ Created table:', t.name);
    }

    // Seed states if empty
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) as cnt FROM states');
    if (cnt === 0) {
      await conn.query(statesSeed);
      console.log('✓ Seeded states table');
    } else {
      console.log('  states already has', cnt, 'rows — skipping seed');
    }

    const [rows] = await conn.query('SHOW TABLES');
    console.log('\nAll tables:', rows.map(r => Object.values(r)[0]).join(', '));
  } finally {
    await conn.end();
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
