import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

// Public reference data — states/UTs are needed on the signup and
// officer-login screens before a user is authenticated.

// GET /api/states            -> ["Andaman and Nicobar Islands", ...]
// GET /api/states?full=1     -> [{ name, isUt }, ...]
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT name, is_ut FROM states ORDER BY name ASC");
    if (req.query.full) {
      return res.json(rows.map(r => ({ name: r.name, isUt: !!r.is_ut })));
    }
    res.json(rows.map(r => r.name));
  } catch (err) {
    console.error("GET /states", err);
    res.status(500).json({ error: "Failed to load states." });
  }
});

export default router;
