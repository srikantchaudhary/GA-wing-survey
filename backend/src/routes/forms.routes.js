import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { rowToForm, formToRow } from "../utils/formMapper.js";

const router = Router();

// State-Based Access Control:
// - Admins can see and manage all forms
// - Officers can only see forms assigned to their state or published globally (no state restrictions)
// - Officers cannot create, delete, or publish forms

async function fetchAllForms() {
  const [rows] = await pool.query("SELECT * FROM forms ORDER BY updated_date DESC");
  return rows.map(rowToForm);
}

async function fetchFormsForState(state) {
  // Officers only see PUBLISHED forms assigned to their state or globally published
  const [rows] = await pool.query(
    `SELECT * FROM forms
     WHERE status = 'published'
       AND (JSON_CONTAINS(states, ?) OR states IS NULL OR JSON_LENGTH(states) = 0)
     ORDER BY updated_date DESC`,
    [JSON.stringify(state)]
  );
  return rows.map(rowToForm);
}

// GET /api/forms - All authenticated users can view forms
// Officers see forms assigned to their state, admins see all forms
router.get("/", authRequired, async (req, res) => {
  try {
    let forms;
    if (req.user.role === "admin") {
      forms = await fetchAllForms();
    } else {
      forms = await fetchFormsForState(req.user.state);
    }
    res.json(forms);
  } catch (err) {
    console.error("GET /forms", err);
    res.status(500).json({ error: "Failed to load forms." });
  }
});

// POST /api/forms - Admin only — returns the saved form only
router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const form = req.body;
    if (!form?.id || !form?.formId || !form?.name) {
      return res.status(400).json({ error: "Invalid form payload." });
    }

    const row = formToRow(form);
    await pool.query(
      `INSERT INTO forms (id, form_id, name, sections, states, status, survey_year, description, created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)
       ON DUPLICATE KEY UPDATE
         form_id = VALUES(form_id),
         name = VALUES(name),
         sections = VALUES(sections),
         states = VALUES(states),
         status = VALUES(status),
         survey_year = VALUES(survey_year),
         description = VALUES(description),
         updated_by = ?,
         updated_date = NOW()`,
      [
        row.id,
        row.form_id,
        row.name,
        row.sections,
        row.states,
        row.status,
        row.survey_year,
        row.description,
        req.user.id || null,
        req.user.id || null,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM forms WHERE id = ?", [row.id]);
    res.status(201).json(rowToForm(rows[0]));
  } catch (err) {
    console.error("POST /forms", err);
    res.status(500).json({ error: "Failed to save form." });
  }
});

// DELETE /api/forms/:id - Admin only — returns { ok, id }
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query("SELECT status FROM forms WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Form not found." });
    }
    if (rows[0].status === "published") {
      return res.status(400).json({ error: "Published forms cannot be deleted." });
    }
    await pool.query("DELETE FROM forms WHERE id = ?", [id]);
    res.json({ ok: true, id });
  } catch (err) {
    console.error("DELETE /forms/:id", err);
    res.status(500).json({ error: "Failed to delete form." });
  }
});

// PATCH /api/forms/:id/publish - Admin only — returns the updated form only
router.patch("/:id/publish", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const states = req.body.states ?? [];
    const savedAt = new Date();
    await pool.query(
      `UPDATE forms SET status = 'published', states = ?, updated_by = ?, updated_date = ? WHERE id = ?`,
      [JSON.stringify(states), req.user.id || null, savedAt, id]
    );
    const [rows] = await pool.query("SELECT * FROM forms WHERE id = ?", [id]);
    res.json(rowToForm(rows[0]));
  } catch (err) {
    console.error("PATCH /forms/:id/publish", err);
    res.status(500).json({ error: "Failed to publish form." });
  }
});

export default router;
