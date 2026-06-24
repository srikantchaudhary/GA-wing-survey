import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireStateAccess } from "../middleware/auth.js";

const router = Router();

// State-Based Access Control:
// - All authenticated users can access drafts
// - Officers can only access, save, and delete drafts for their assigned state
// - requireStateAccess middleware enforces state restrictions

// GET /api/drafts - All authenticated users (officers can only access their state)
router.get("/", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, formId } = req.query;
    if (!state || !formId) {
      return res.status(400).json({ error: "state and formId are required." });
    }

    // Ensure officers can only access their own state (case-insensitive)
    if (req.user.role === "officer" && state.toLowerCase() !== req.user.state.toLowerCase()) {
      return res.status(403).json({ error: "You can only access drafts for your assigned state." });
    }

    const [rows] = await pool.query(
      "SELECT * FROM draft_responses WHERE LOWER(state) = LOWER(?) AND form_id = ? LIMIT 1",
      [state, formId]
    );
    if (!rows.length) return res.json(null);

    const row = rows[0];
    res.json({
      data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
      savedAt: new Date(row.updated_date).toISOString(),
    });
  } catch (err) {
    console.error("GET /drafts", err);
    res.status(500).json({ error: "Failed to load draft." });
  }
});

// PUT /api/drafts - All authenticated users (officers can only save for their state)
router.put("/", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, formId, data } = req.body;
    if (!state || !formId || !data) {
      return res.status(400).json({ error: "state, formId, and data are required." });
    }

    // Ensure officers can only save for their own state (case-insensitive)
    if (req.user.role === "officer" && state.toLowerCase() !== req.user.state.toLowerCase()) {
      return res.status(403).json({ error: "You can only save drafts for your assigned state." });
    }

    const savedAt = new Date();
    await pool.query(
      `INSERT INTO draft_responses (state, form_id, data, created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, NOW(), NULL, NULL)
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_by = ?, updated_date = NOW()`,
      [state, formId, JSON.stringify(data), req.user.id || null, req.user.id || null]
    );
    res.json({ data, savedAt: savedAt.toISOString() });
  } catch (err) {
    console.error("PUT /drafts", err);
    res.status(500).json({ error: "Failed to save draft." });
  }
});

// DELETE /api/drafts - All authenticated users (officers can only delete their state)
router.delete("/", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, formId } = req.query;
    if (!state || !formId) {
      return res.status(400).json({ error: "state and formId are required." });
    }

    // Ensure officers can only delete their own state (case-insensitive)
    if (req.user.role === "officer" && state.toLowerCase() !== req.user.state.toLowerCase()) {
      return res.status(403).json({ error: "You can only delete drafts for your assigned state." });
    }

    await pool.query("DELETE FROM draft_responses WHERE LOWER(state) = LOWER(?) AND form_id = ?", [state, formId]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /drafts", err);
    res.status(500).json({ error: "Failed to clear draft." });
  }
});

export default router;
