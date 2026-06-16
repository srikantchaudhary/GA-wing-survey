import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireRole, requireStateAccess } from "../middleware/auth.js";

const router = Router();

// State-Based Access Control:
// - Admins can view all responses across all states
// - Officers can only lookup and submit responses for their assigned state
// - requireStateAccess middleware enforces state restrictions

function rowToResponse(row) {
  return {
    id: Number(row.id),
    formId: row.form_id,
    formName: row.form_name,
    state: row.state,
    surveyYear: row.survey_year,
    data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    submittedAt: new Date(row.submitted_at).toISOString(),
    officerId: row.officer_id ? Number(row.officer_id) : null,
    officerName: row.officer_name || null,
    officerEmail: row.officer_email || null,
  };
}

// GET /api/responses - Admin only (view all responses)
router.get("/", authRequired, requireRole("admin"), async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM responses ORDER BY submitted_at DESC");
    res.json(rows.map(rowToResponse));
  } catch (err) {
    console.error("GET /responses", err);
    res.status(500).json({ error: "Failed to load responses." });
  }
});

// GET /api/responses/form/:formId - Admin only (view all responses for a form)
router.get("/form/:formId", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC",
      [req.params.formId]
    );
    res.json(rows.map(rowToResponse));
  } catch (err) {
    console.error("GET /responses/form/:formId", err);
    res.status(500).json({ error: "Failed to load responses." });
  }
});

// GET /api/responses/lookup - All authenticated users (officers can only lookup their own state)
router.get("/lookup", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, formId } = req.query;
    if (!state || !formId) {
      return res.status(400).json({ error: "state and formId are required." });
    }
    const [rows] = await pool.query(
      "SELECT * FROM responses WHERE LOWER(state) = LOWER(?) AND form_id = ? LIMIT 1",
      [state, formId]
    );
    res.json(rows.length ? rowToResponse(rows[0]) : null);
  } catch (err) {
    console.error("GET /responses/lookup", err);
    res.status(500).json({ error: "Failed to lookup response." });
  }
});

// POST /api/responses - All authenticated users (officers can only submit for their state)
router.post("/", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { formId, formName, state, surveyYear, data } = req.body;
    if (!formId || !state || !data) {
      return res.status(400).json({ error: "formId, state, and data are required." });
    }

    // Ensure officers can only submit for their own state (case-insensitive)
    if (req.user.role === "officer" && state.toLowerCase() !== req.user.state.toLowerCase()) {
      return res.status(403).json({ error: "You can only submit responses for your assigned state." });
    }

    const id = Date.now();
    const officerId = req.user.id;
    const officerName = req.user.name;
    const officerEmail = req.user.email;

    const payload = { ...data, sub_date: new Date().toISOString().slice(0, 10) };
    await pool.query(
      `INSERT INTO responses (id, form_id, form_name, state, survey_year, data, submitted_at, officer_id, officer_name, officer_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         form_name = VALUES(form_name),
         survey_year = VALUES(survey_year),
         data = VALUES(data),
         submitted_at = VALUES(submitted_at),
         officer_id = VALUES(officer_id),
         officer_name = VALUES(officer_name),
         officer_email = VALUES(officer_email)`,
      [id, formId, formName || null, state, surveyYear || null, JSON.stringify(payload), new Date(), officerId, officerName, officerEmail]
    );

    await pool.query("DELETE FROM draft_responses WHERE LOWER(state) = LOWER(?) AND form_id = ?", [state, formId]);

    const [rows] = await pool.query(
      "SELECT * FROM responses WHERE LOWER(state) = LOWER(?) AND form_id = ? LIMIT 1",
      [state, formId]
    );
    res.status(201).json(rowToResponse(rows[0]));
  } catch (err) {
    console.error("POST /responses", err);
    res.status(500).json({ error: "Failed to save response." });
  }
});

export default router;
