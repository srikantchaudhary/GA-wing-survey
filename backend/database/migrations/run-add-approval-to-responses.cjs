// run-add-approval-to-responses.cjs
// Adds approval_status, approved_by, approved_at to responses table (idempotent)
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

  if (!(await columnExists("responses", "approval_status"))) {
    await conn.query(
      "ALTER TABLE responses ADD COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'"
    );
    console.log("✅ Added column: responses.approval_status");
  } else {
    console.log("ℹ️  Column already exists: responses.approval_status");
  }

  if (!(await columnExists("responses", "approved_by"))) {
    await conn.query(
      "ALTER TABLE responses ADD COLUMN approved_by INT DEFAULT NULL"
    );
    console.log("✅ Added column: responses.approved_by");
  } else {
    console.log("ℹ️  Column already exists: responses.approved_by");
  }

  if (!(await columnExists("responses", "approved_at"))) {
    await conn.query(
      "ALTER TABLE responses ADD COLUMN approved_at DATETIME DEFAULT NULL"
    );
    console.log("✅ Added column: responses.approved_at");
  } else {
    console.log("ℹ️  Column already exists: responses.approved_at");
  }

  await conn.end();
  console.log("Done.");
}

run().catch(err => { console.error(err); process.exit(1); });
