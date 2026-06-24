// run-add-status-column.cjs
// Adds status + rejection_reason columns to form_final_status (idempotent)
const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || "localhost",
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
    database: process.env.DB_NAME     || "ga_wing",
  });

  const db = process.env.DB_NAME || "ga_wing";

  async function columnExists(table, column) {
    const [rows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
      [db, table, column]
    );
    return rows[0].cnt > 0;
  }

  if (!(await columnExists("form_final_status", "status"))) {
    await conn.query(
      "ALTER TABLE form_final_status ADD COLUMN status ENUM('approved','rejected') NOT NULL DEFAULT 'approved'"
    );
    console.log("✅ Added column: status");
  } else {
    console.log("ℹ️  Column already exists: status");
  }

  if (!(await columnExists("form_final_status", "rejection_reason"))) {
    await conn.query(
      "ALTER TABLE form_final_status ADD COLUMN rejection_reason VARCHAR(500) DEFAULT NULL"
    );
    console.log("✅ Added column: rejection_reason");
  } else {
    console.log("ℹ️  Column already exists: rejection_reason");
  }

  await conn.end();
  console.log("Done.");
}

run().catch(err => { console.error(err); process.exit(1); });
