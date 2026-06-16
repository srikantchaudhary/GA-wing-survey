import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

// Access Control:
// - Static admin form (Nomination of DA Cadre Official).
// - Only admins can view, create and delete nominations.

function rowToNomination(row) {
  return {
    id: Number(row.id),
    state: row.state,
    name: row.employee_name,
    designation: row.designation,
    email: row.email,
    mobile: row.mobile,
    createdBy: row.created_by ? Number(row.created_by) : null,
    createdAt: new Date(row.created_date).toISOString(),
    updatedBy: row.updated_by ? Number(row.updated_by) : null,
    updatedAt: new Date(row.updated_date).toISOString(),
  };
}

// GET /api/nominations - Admin only
router.get("/", authRequired, requireRole("admin"), async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM da_nominations ORDER BY created_date DESC");
    res.json(rows.map(rowToNomination));
  } catch (err) {
    console.error("GET /nominations", err);
    res.status(500).json({ error: "Failed to load nominations." });
  }
});

// POST /api/nominations - Admin only
router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { state, name, designation, email, mobile } = req.body || {};
    if (!state || !name?.trim() || !designation || !email?.trim() || !mobile?.trim()) {
      return res.status(400).json({ error: "state, name, designation, email and mobile are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "Please provide a valid email." });
    }

    const id = Date.now();
    await pool.query(
      `INSERT INTO da_nominations (id, state, employee_name, designation, email, mobile, created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        state,
        name.trim(),
        designation,
        email.trim(),
        mobile.trim(),
        req.user.id || null,
        new Date(),
        req.user.id || null,
        new Date(),
      ]
    );

    const [rows] = await pool.query("SELECT * FROM da_nominations WHERE id = ?", [id]);
    res.status(201).json(rowToNomination(rows[0]));
  } catch (err) {
    console.error("POST /nominations", err);
    res.status(500).json({ error: "Failed to save nomination." });
  }
});

// DELETE /api/nominations/:id - Admin only
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM da_nominations WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /nominations/:id", err);
    res.status(500).json({ error: "Failed to delete nomination." });
  }
});

export default router;
