import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

// Access Control:
// - All authenticated users can view custom sections (global components)
// - Only admins can create and delete custom sections
// - Custom sections are not state-specific

function rowToSection(row) {
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  return payload;
}

// GET /api/custom-sections - All authenticated users can view custom sections
router.get("/", authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM custom_sections ORDER BY created_date ASC");
    res.json(rows.map(rowToSection));
  } catch (err) {
    console.error("GET /custom-sections", err);
    res.status(500).json({ error: "Failed to load custom sections." });
  }
});

// POST /api/custom-sections - Admin only
router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const section = req.body;
    if (!section?.id) {
      return res.status(400).json({ error: "Invalid section payload." });
    }
    await pool.query(
      `INSERT INTO custom_sections (id, payload, created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_by = VALUES(updated_by), updated_date = VALUES(updated_date)`,
      [section.id, JSON.stringify(section), req.user.id || null, new Date(), req.user.id || null, new Date()]
    );
    const [rows] = await pool.query("SELECT * FROM custom_sections ORDER BY created_date ASC");
    res.json(rows.map(rowToSection));
  } catch (err) {
    console.error("POST /custom-sections", err);
    res.status(500).json({ error: "Failed to save custom section." });
  }
});

// DELETE /api/custom-sections/:id - Admin only
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM custom_sections WHERE id = ?", [req.params.id]);
    const [rows] = await pool.query("SELECT * FROM custom_sections ORDER BY created_date ASC");
    res.json(rows.map(rowToSection));
  } catch (err) {
    console.error("DELETE /custom-sections/:id", err);
    res.status(500).json({ error: "Failed to remove custom section." });
  }
});

export default router;
