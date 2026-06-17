import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireRole, requireStateAccess } from "../middleware/auth.js";

const router = Router();

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

// GET /api/nominations
router.get("/", authRequired, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const [rows] = await pool.query("SELECT * FROM da_nominations ORDER BY created_date DESC");
      return res.json(rows.map(rowToNomination));
    }
    const [rows] = await pool.query(
      "SELECT * FROM da_nominations WHERE LOWER(state) = LOWER(?) ORDER BY created_date DESC",
      [req.user.state]
    );
    res.json(rows.map(rowToNomination));
  } catch (err) {
    console.error("GET /nominations", err);
    res.status(500).json({ error: "Failed to load nominations." });
  }
});

// POST /api/nominations
router.post("/", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, name, designation, email, mobile } = req.body || {};
    if (!state || !name?.trim() || !designation || !email?.trim() || !mobile?.trim()) {
      return res.status(400).json({ error: "state, name, designation, email and mobile are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "Please provide a valid email." });
    }
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return res.status(400).json({ error: "Please provide a valid 10-digit mobile number." });
    }

    const id = Date.now();
    await pool.query(
      `INSERT INTO da_nominations (id, state, employee_name, designation, email, mobile, created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, state, name.trim(), designation, email.trim(), mobile.trim(), req.user.id || null, new Date(), req.user.id || null, new Date()]
    );
    const [rows] = await pool.query("SELECT * FROM da_nominations WHERE id = ?", [id]);
    res.status(201).json(rowToNomination(rows[0]));
  } catch (err) {
    console.error("POST /nominations", err);
    res.status(500).json({ error: "Failed to save nomination." });
  }
});

// PUT /api/nominations/:id
router.put("/:id", authRequired, async (req, res) => {
  try {
    const { state, name, designation, email, mobile } = req.body || {};
    if (!state || !name?.trim() || !designation || !email?.trim() || !mobile?.trim()) {
      return res.status(400).json({ error: "state, name, designation, email and mobile are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "Please provide a valid email." });
    }
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return res.status(400).json({ error: "Please provide a valid 10-digit mobile number." });
    }

    // Officers may only edit records belonging to their own state
    if (req.user.role !== "admin") {
      const [existing] = await pool.query("SELECT state FROM da_nominations WHERE id = ?", [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: "Record not found." });
      if (existing[0].state.toLowerCase() !== req.user.state.toLowerCase()) {
        return res.status(403).json({ error: "Access denied." });
      }
    }

    await pool.query(
      `UPDATE da_nominations SET state = ?, employee_name = ?, designation = ?, email = ?, mobile = ?, updated_by = ?, updated_date = ? WHERE id = ?`,
      [state, name.trim(), designation, email.trim(), mobile.trim(), req.user.id || null, new Date(), req.params.id]
    );
    const [rows] = await pool.query("SELECT * FROM da_nominations WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Record not found after update." });
    res.json(rowToNomination(rows[0]));
  } catch (err) {
    console.error("PUT /nominations/:id", err);
    res.status(500).json({ error: "Failed to update nomination." });
  }
});

// DELETE /api/nominations/:id — admins can delete any; officers can only delete their own state
router.delete("/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      const [existing] = await pool.query("SELECT state FROM da_nominations WHERE id = ?", [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: "Record not found." });
      if (existing[0].state.toLowerCase() !== req.user.state.toLowerCase()) {
        return res.status(403).json({ error: "Access denied." });
      }
    }
    await pool.query("DELETE FROM da_nominations WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /nominations/:id", err);
    res.status(500).json({ error: "Failed to delete nomination." });
  }
});

export default router;
