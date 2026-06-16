import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const dbDir = path.join(__dirname, "../../database");

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(dbDir, "schema.sql"), "utf8");
  const seed = fs.readFileSync(path.join(dbDir, "seed.sql"), "utf8");

  console.log("Running schema.sql …");
  await connection.query(schema);

  console.log("Running seed.sql …");
  await connection.query(seed);

  await connection.end();
  console.log("Database setup complete.");
}

run().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
