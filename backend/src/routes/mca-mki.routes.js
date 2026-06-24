import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireStateAccess } from "../middleware/auth.js";

const router = Router();

function toDate(v) {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function rowToRecord(row) {
  const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
  return {
    id: Number(row.id),
    state: row.state,
    mcaDue: iso(row.mca_due_date),
    mcaAlloc: iso(row.mca_allocation_date),
    mcaComment: row.mca_comment || "",
    mkiDue: iso(row.mki_due_date),
    mkiAlloc: iso(row.mki_allocation_date),
    mkiComment: row.mki_comment || "",
    createdBy: row.created_by ? Number(row.created_by) : null,
    createdAt: new Date(row.created_date).toISOString(),
    updatedBy: row.updated_by ? Number(row.updated_by) : null,
    updatedAt: row.updated_date ? new Date(row.updated_date).toISOString() : null,
  };
}

// GET /api/mca-mki
router.get("/", authRequired, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const [rows] = await pool.query("SELECT * FROM mca_mki_records ORDER BY created_date DESC");
      return res.json(rows.map(rowToRecord));
    }
    const [rows] = await pool.query(
      "SELECT * FROM mca_mki_records WHERE LOWER(state) = LOWER(?) ORDER BY created_date DESC",
      [req.user.state]
    );
    res.json(rows.map(rowToRecord));
  } catch (err) {
    console.error("GET /mca-mki", err);
    res.status(500).json({ error: "Failed to load MCA/MKI records." });
  }
});

// POST /api/mca-mki
router.post("/", authRequired, requireStateAccess, async (req, res) => {
  try {
    const { state, mcaDue, mcaAlloc, mcaComment, mkiDue, mkiAlloc, mkiComment } = req.body || {};
    if (!state) return res.status(400).json({ error: "state is required." });

    const id = Date.now();
    await pool.query(
      `INSERT INTO mca_mki_records
         (id, state, mca_due_date, mca_allocation_date, mca_comment, mki_due_date, mki_allocation_date, mki_comment, created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [
        id, state,
        toDate(mcaDue), toDate(mcaAlloc), (mcaComment || "").trim() || null,
        toDate(mkiDue), toDate(mkiAlloc), (mkiComment || "").trim() || null,
        req.user.id || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM mca_mki_records WHERE id = ?", [id]);
    res.status(201).json(rowToRecord(rows[0]));
  } catch (err) {
    console.error("POST /mca-mki", err);
    res.status(500).json({ error: "Failed to save MCA/MKI record." });
  }
});

// PUT /api/mca-mki/:id
router.put("/:id", authRequired, async (req, res) => {
  try {
    const { state, mcaDue, mcaAlloc, mcaComment, mkiDue, mkiAlloc, mkiComment } = req.body || {};
    if (!state) return res.status(400).json({ error: "state is required." });

    // Officers may only edit records belonging to their own state
    if (req.user.role !== "admin") {
      const [existing] = await pool.query("SELECT state FROM mca_mki_records WHERE id = ?", [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: "Record not found." });
      if (existing[0].state.toLowerCase() !== req.user.state.toLowerCase()) {
        return res.status(403).json({ error: "Access denied." });
      }
    }

    await pool.query(
      `UPDATE mca_mki_records
       SET state = ?, mca_due_date = ?, mca_allocation_date = ?, mca_comment = ?,
           mki_due_date = ?, mki_allocation_date = ?, mki_comment = ?,
           updated_by = ?, updated_date = ?
       WHERE id = ?`,
      [
        state,
        toDate(mcaDue), toDate(mcaAlloc), (mcaComment || "").trim() || null,
        toDate(mkiDue), toDate(mkiAlloc), (mkiComment || "").trim() || null,
        req.user.id || null, new Date(), req.params.id,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM mca_mki_records WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Record not found after update." });
    res.json(rowToRecord(rows[0]));
  } catch (err) {
    console.error("PUT /mca-mki/:id", err);
    res.status(500).json({ error: "Failed to update MCA/MKI record." });
  }
});

// DELETE /api/mca-mki/:id — admins can delete any; officers can only delete their own state
router.delete("/:id", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      const [existing] = await pool.query("SELECT state FROM mca_mki_records WHERE id = ?", [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: "Record not found." });
      if (existing[0].state.toLowerCase() !== req.user.state.toLowerCase()) {
        return res.status(403).json({ error: "Access denied." });
      }
    }
    await pool.query("DELETE FROM mca_mki_records WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /mca-mki/:id", err);
    res.status(500).json({ error: "Failed to delete MCA/MKI record." });
  }
});

export default router;
