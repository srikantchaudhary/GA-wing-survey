import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

try {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });
  await conn.query("SELECT 1");
  await conn.end();
  console.log("MySQL connection OK for user:", process.env.DB_USER);
} catch (err) {
  console.error("MySQL connection failed:", err.message);
  console.error("\nFix DB_USER / DB_PASSWORD in backend/.env to match MySQL Workbench or:");
  console.error('  mysql -u root -p');
  process.exit(1);
}
