const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Edit these before running if needed
const USERS = [
  { name: 'Admin',  email: 'admin@gmail.com',        state: 'Delhi',      role: 'admin',   password: 'admin123' },
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'ims',
    password: process.env.DB_PASSWORD || 'ims',
    database: process.env.DB_NAME || 'ims',
  });

  try {
    for (const u of USERS) {
      const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length) {
        console.log('  already exists:', u.email);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      const id = Date.now() + Math.floor(Math.random() * 1000);
      await conn.query(
        'INSERT INTO users (id, name, email, state, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [id, u.name, u.email.toLowerCase(), u.state, u.role, hash]
      );
      console.log(`✓ Created ${u.role}: ${u.email}  (password: ${u.password})`);
    }

    const [rows] = await conn.query('SELECT name, email, role, state FROM users');
    console.log('\nAll users:');
    rows.forEach(r => console.log(`  ${r.role.padEnd(8)} ${r.email}  (${r.state})`));
  } finally {
    await conn.end();
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
