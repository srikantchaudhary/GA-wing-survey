const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mysql = require("mysql2/promise");

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
    database: process.env.DB_NAME     || "ims",
  });

  try {
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME
      FROM   information_schema.COLUMNS
      WHERE  TABLE_SCHEMA = DATABASE()
        AND  TABLE_NAME   = 'users'
        AND  COLUMN_NAME  IN ('reset_otp', 'reset_otp_expires')
    `);
    const existing = new Set(cols.map(c => c.COLUMN_NAME));

    if (!existing.has("reset_otp")) {
      await pool.query("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(255) DEFAULT NULL");
      console.log("✓ Added column: reset_otp");
    } else {
      console.log("  Skipped: reset_otp already exists");
    }

    if (!existing.has("reset_otp_expires")) {
      await pool.query("ALTER TABLE users ADD COLUMN reset_otp_expires DATETIME DEFAULT NULL");
      console.log("✓ Added column: reset_otp_expires");
    } else {
      console.log("  Skipped: reset_otp_expires already exists");
    }

    console.log("\nMigration complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
