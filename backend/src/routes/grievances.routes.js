import { Router } from "express";
import pool from "../config/db.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads/grievances");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

function rowToGrievance(row) {
  let statesArr = row.states;
  if (typeof statesArr === "string") {
    try { statesArr = JSON.parse(statesArr); } catch { statesArr = []; }
  }
  return {
    id: Number(row.id),
    states: Array.isArray(statesArr) ? statesArr : [],
    name: row.name,
    type: row.type,
    reason: row.reason,
    fileName: row.file_name || null,
    filePath: row.file_path || null,
    fileMime: row.file_mime || null,
    fileSize: row.file_size || null,
    createdBy: row.created_by ? Number(row.created_by) : null,
    createdAt: new Date(row.created_date).toISOString(),
    updatedBy: row.updated_by ? Number(row.updated_by) : null,
    updatedAt: row.updated_date ? new Date(row.updated_date).toISOString() : null,
  };
}

// GET /api/grievances — admins see all; officers see only their state's grievances
router.get("/", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM grievances ORDER BY created_date DESC");
    const all = rows.map(rowToGrievance);
    if (req.user.role === "admin") return res.json(all);
    const userState = (req.user.state || "").toLowerCase();
    res.json(all.filter(g => g.states.some(s => s.toLowerCase() === userState)));
  } catch (err) {
    console.error("GET /grievances", err);
    res.status(500).json({ error: "Failed to load grievances." });
  }
});

// GET /api/grievances/:id/view — stream file inline (admin sees all; officer sees own state only)
router.get("/:id/view", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT file_path, file_name, file_mime, states FROM grievances WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length || !rows[0].file_path) {
      return res.status(404).json({ error: "No file attached to this record." });
    }

    // Officers can only access files from grievances addressed to their own state
    if (req.user.role !== "admin") {
      let statesArr = rows[0].states;
      if (typeof statesArr === "string") { try { statesArr = JSON.parse(statesArr); } catch { statesArr = []; } }
      const userState = (req.user.state || "").toLowerCase();
      if (!Array.isArray(statesArr) || !statesArr.some(s => s.toLowerCase() === userState)) {
        return res.status(403).json({ error: "Access denied." });
      }
    }

    const { file_path, file_name, file_mime } = rows[0];
    const fullPath = path.join(uploadsDir, file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found on disk." });
    }
    res.setHeader("Content-Type", file_mime || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file_name)}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error("GET /grievances/:id/view", err);
    res.status(500).json({ error: "Failed to serve file." });
  }
});

// POST /api/grievances
router.post("/", authRequired, requireRole("admin"), upload.single("file"), async (req, res) => {
  try {
    const { states, name, type, reason } = req.body || {};
    if (!states || !name?.trim() || !type?.trim() || !reason?.trim()) {
      return res.status(400).json({ error: "states, name, type, and reason are required." });
    }
    let statesArr;
    try { statesArr = JSON.parse(states); } catch { statesArr = [states]; }
    if (!Array.isArray(statesArr) || !statesArr.length) {
      return res.status(400).json({ error: "At least one state is required." });
    }

    const id = Date.now();
    const f = req.file;
    await pool.query(
      `INSERT INTO grievances (id, states, name, type, reason, file_name, file_path, file_mime, file_size, created_by, created_date, updated_by, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [
        id, JSON.stringify(statesArr), name.trim(), type.trim(), reason.trim(),
        f?.originalname || null, f?.filename || null, f?.mimetype || null, f?.size || null,
        req.user.id || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM grievances WHERE id = ?", [id]);
    res.status(201).json(rowToGrievance(rows[0]));
  } catch (err) {
    console.error("POST /grievances", err);
    res.status(500).json({ error: "Failed to save grievance." });
  }
});

// PUT /api/grievances/:id
router.put("/:id", authRequired, requireRole("admin"), upload.single("file"), async (req, res) => {
  try {
    const { states, name, type, reason } = req.body || {};
    if (!states || !name?.trim() || !type?.trim() || !reason?.trim()) {
      return res.status(400).json({ error: "states, name, type, and reason are required." });
    }
    let statesArr;
    try { statesArr = JSON.parse(states); } catch { statesArr = [states]; }
    if (!Array.isArray(statesArr) || !statesArr.length) {
      return res.status(400).json({ error: "At least one state is required." });
    }

    const [existing] = await pool.query("SELECT file_path FROM grievances WHERE id = ?", [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: "Record not found." });

    const f = req.file;
    if (f && existing[0].file_path) {
      const oldFile = path.join(uploadsDir, existing[0].file_path);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    if (f) {
      await pool.query(
        `UPDATE grievances SET states=?, name=?, type=?, reason=?, file_name=?, file_path=?, file_mime=?, file_size=?, updated_by=?, updated_date=NOW() WHERE id=?`,
        [JSON.stringify(statesArr), name.trim(), type.trim(), reason.trim(),
         f.originalname, f.filename, f.mimetype, f.size, req.user.id || null, req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE grievances SET states=?, name=?, type=?, reason=?, updated_by=?, updated_date=NOW() WHERE id=?`,
        [JSON.stringify(statesArr), name.trim(), type.trim(), reason.trim(), req.user.id || null, req.params.id]
      );
    }

    const [rows] = await pool.query("SELECT * FROM grievances WHERE id = ?", [req.params.id]);
    res.json(rowToGrievance(rows[0]));
  } catch (err) {
    console.error("PUT /grievances/:id", err);
    res.status(500).json({ error: "Failed to update grievance." });
  }
});

// DELETE /api/grievances/:id
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT file_path FROM grievances WHERE id = ?", [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: "Record not found." });

    if (existing[0].file_path) {
      const fp = path.join(uploadsDir, existing[0].file_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await pool.query("DELETE FROM grievances WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /grievances/:id", err);
    res.status(500).json({ error: "Failed to delete grievance." });
  }
});

export default router;
