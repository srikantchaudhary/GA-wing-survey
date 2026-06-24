import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireRole, requireStateAccess } from "../middleware/auth.js";

const router = Router();

function rowToResponse(row) {
  return {
    id: Number(row.id),
    formId: row.form_id,
    formName: row.form_name,
    state: row.state,
    surveyYear: row.survey_year,
    data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    submittedAt: new Date(row.created_date).toISOString(),
    officerId: row.officer_id ? Number(row.officer_id) : null,
    officerName: row.officer_name || null,
    officerEmail: row.officer_email || null,
    approvalStatus: row.approval_status || "pending",
    approvedBy: row.approved_by ? Number(row.approved_by) : null,
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : null,
  };
}

// GET /api/responses - Admin only
router.get("/", authRequired, requireRole("admin"), async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM responses ORDER BY created_date DESC");
    res.json(rows.map(rowToResponse));
  } catch (err) {
    console.error("GET /responses", err);
    res.status(500).json({ error: "Failed to load responses." });
  }
});

// GET /api/responses/form/:formId - Admin only
router.get("/form/:formId", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM responses WHERE form_id = ? ORDER BY created_date DESC",
      [req.params.formId]
    );
    res.json(rows.map(rowToResponse));
  } catch (err) {
    console.error("GET /responses/form/:formId", err);
    res.status(500).json({ error: "Failed to load responses." });
  }
});

// GET /api/responses/is-finalized?state=&formId=
// Returns per-record summary: hasApproved, hasRejected (used for officer banners)
router.get("/is-finalized", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, formId } = req.query;
    if (!state || !formId) {
      return res.status(400).json({ error: "state and formId are required." });
    }
    const [rows] = await pool.query(
      "SELECT approval_status FROM responses WHERE LOWER(state) = LOWER(?) AND form_id = ?",
      [state, formId]
    );
    const hasApproved = rows.some(r => r.approval_status === "approved");
    const hasRejected = rows.some(r => r.approval_status === "rejected");
    res.json({
      isFinalized: hasApproved,
      hasApproved,
      hasRejected,
      finalizedAt: null,
    });
  } catch (err) {
    console.error("GET /responses/is-finalized", err);
    res.status(500).json({ error: "Failed to check finalization status." });
  }
});

// GET /api/responses/lookup - returns the first (primary) response for a state+form
router.get("/lookup", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, formId } = req.query;
    if (!state || !formId) {
      return res.status(400).json({ error: "state and formId are required." });
    }
    const [rows] = await pool.query(
      "SELECT * FROM responses WHERE LOWER(state) = LOWER(?) AND form_id = ? ORDER BY created_date ASC LIMIT 1",
      [state, formId]
    );
    res.json(rows.length ? rowToResponse(rows[0]) : null);
  } catch (err) {
    console.error("GET /responses/lookup", err);
    res.status(500).json({ error: "Failed to lookup response." });
  }
});

// GET /api/responses/lookup-all - returns ALL responses for a state+form
router.get("/lookup-all", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, formId } = req.query;
    if (!state || !formId) {
      return res.status(400).json({ error: "state and formId are required." });
    }
    const [rows] = await pool.query(
      "SELECT * FROM responses WHERE LOWER(state) = LOWER(?) AND form_id = ? ORDER BY created_date ASC",
      [state, formId]
    );
    res.json(rows.map(rowToResponse));
  } catch (err) {
    console.error("GET /responses/lookup-all", err);
    res.status(500).json({ error: "Failed to load responses." });
  }
});

// POST /api/responses/approve-bulk — Admin: approve or reject individual response records by ID
router.post("/approve-bulk", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { responseIds, status = "approved" } = req.body;
    if (!Array.isArray(responseIds) || responseIds.length === 0) {
      return res.status(400).json({ error: "responseIds[] is required." });
    }
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'." });
    }
    await pool.query(
      "UPDATE responses SET approval_status = ?, approved_by = ?, approved_at = NOW() WHERE id IN (?)",
      [status, req.user.id, responseIds]
    );
    res.json({ ok: true, count: responseIds.length, status });
  } catch (err) {
    console.error("POST /responses/approve-bulk", err);
    res.status(500).json({ error: "Failed to update record status." });
  }
});

// POST /api/responses - Create a new response (always allowed; starts as pending)
router.post("/", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { formId, formName, state, surveyYear, data } = req.body;
    if (!formId || !state || !data) {
      return res.status(400).json({ error: "formId, state, and data are required." });
    }
    if (req.user.role === "officer" && state.toLowerCase() !== req.user.state.toLowerCase()) {
      return res.status(403).json({ error: "You can only submit responses for your assigned state." });
    }

    const id = Date.now();
    const payload = { ...data, sub_date: new Date().toISOString().slice(0, 10) };

    await pool.query(
      `INSERT INTO responses
         (id, form_id, form_name, state, survey_year, data,
          officer_id, officer_name, officer_email,
          created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [id, formId, formName || null, state, surveyYear || null, JSON.stringify(payload),
       req.user.id, req.user.name, req.user.email,
       req.user.id]
    );

    await pool.query(
      "DELETE FROM draft_responses WHERE LOWER(state) = LOWER(?) AND form_id = ?",
      [state, formId]
    );

    const [rows] = await pool.query("SELECT * FROM responses WHERE id = ?", [id]);
    res.status(201).json(rowToResponse(rows[0]));
  } catch (err) {
    console.error("POST /responses", err);
    res.status(500).json({ error: "Failed to save response." });
  }
});

// PUT /api/responses/:id - Update an existing response by ID
router.put("/:id", authRequired, requireStateAccess, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "data is required." });
    }

    const [existing] = await pool.query("SELECT * FROM responses WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ error: "Response not found." });
    }
    if (req.user.role === "officer" &&
        existing[0].state.toLowerCase() !== req.user.state.toLowerCase()) {
      return res.status(403).json({ error: "You can only update your own state's responses." });
    }

    // Block edits on individually approved records
    if (existing[0].approval_status === "approved") {
      return res.status(403).json({ error: "This record has been approved and cannot be edited." });
    }

    const payload = { ...data, sub_date: new Date().toISOString().slice(0, 10) };
    await pool.query(
      `UPDATE responses
       SET data = ?, officer_id = ?, officer_name = ?, officer_email = ?,
           updated_by = ?, updated_date = NOW()
       WHERE id = ?`,
      [JSON.stringify(payload), req.user.id, req.user.name, req.user.email,
       req.user.id, id]
    );

    const [rows] = await pool.query("SELECT * FROM responses WHERE id = ?", [id]);
    res.json(rowToResponse(rows[0]));
  } catch (err) {
    console.error("PUT /responses/:id", err);
    res.status(500).json({ error: "Failed to update response." });
  }
});

// POST /api/responses/:id/duplicate - Insert a copy; duplicate always starts as pending
router.post("/:id/duplicate", authRequired, requireStateAccess, async (req, res) => {
  try {
    const sourceId = Number(req.params.id);
    const [existing] = await pool.query("SELECT * FROM responses WHERE id = ?", [sourceId]);
    if (!existing.length) {
      return res.status(404).json({ error: "Response not found." });
    }
    if (req.user.role === "officer" &&
        existing[0].state.toLowerCase() !== req.user.state.toLowerCase()) {
      return res.status(403).json({ error: "You can only duplicate your own state's responses." });
    }

    const src = existing[0];
    const newId = Date.now();
    await pool.query(
      `INSERT INTO responses
         (id, form_id, form_name, state, survey_year, data,
          officer_id, officer_name, officer_email,
          created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [newId, src.form_id, src.form_name, src.state, src.survey_year,
       src.data, req.user.id, req.user.name, req.user.email,
       req.user.id]
    );

    const [rows] = await pool.query("SELECT * FROM responses WHERE id = ?", [newId]);
    res.status(201).json(rowToResponse(rows[0]));
  } catch (err) {
    console.error("POST /responses/:id/duplicate", err);
    res.status(500).json({ error: "Failed to duplicate response." });
  }
});

export default router;
