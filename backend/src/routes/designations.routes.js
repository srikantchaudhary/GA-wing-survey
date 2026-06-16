import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

// Public reference data — designation list for nomination dropdowns.

// GET /api/designations -> ["Divisional Accountant", ...]
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT name FROM designations ORDER BY sort_order ASC, id ASC");
    res.json(rows.map(r => r.name));
  } catch (err) {
    console.error("GET /designations", err);
    res.status(500).json({ error: "Failed to load designations." });
  }
});

export default router;
