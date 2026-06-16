import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = Router();

function publicUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    state: row.state,
    role: row.role,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, state: user.state, name: user.name },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "24h" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, state, role, password } = req.body;
    if (!name?.trim() || !email?.trim() || !state || !role || !password) {
      return res.status(400).json({ ok: false, error: "All fields are required." });
    }
    if (!["admin", "officer"].includes(role)) {
      return res.status(400).json({ ok: false, error: "Invalid role." });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ ok: false, error: "An account with this email already exists." });
    }

    const id = Date.now();
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, state, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), normalizedEmail, state, role, passwordHash]
    );

    const user = { id, name: name.trim(), email: normalizedEmail, state, role };
    res.status(201).json({ ok: true, user });
  } catch (err) {
    console.error("POST /auth/register", err);
    res.status(500).json({ ok: false, error: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (!rows.length) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const row = rows[0];
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const user = publicUser(row);
    const token = signToken(user);

    // Set httpOnly cookie with 24-hour expiration
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: '/'
    });

    res.json({ ok: true, user });
  } catch (err) {
    console.error("POST /auth/login", err);
    res.status(500).json({ ok: false, error: "Login failed." });
  }
});

router.get("/me", async (req, res) => {
  try {
    // Try to get token from cookie first, then fall back to Authorization header
    const token = req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
    
    if (!token) {
      return res.status(401).json({ ok: false, error: "Not authenticated." });
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const [rows] = await pool.query(
      "SELECT id, name, email, state, role FROM users WHERE id = ?",
      [payload.id]
    );
    if (!rows.length) {
      return res.status(401).json({ ok: false, error: "User not found." });
    }
    res.json({ ok: true, user: publicUser(rows[0]) });
  } catch {
    res.status(401).json({ ok: false, error: "Invalid or expired token." });
  }
});

router.post("/logout", async (req, res) => {
  res.clearCookie('token', {
    path: '/'
  });
  res.json({ ok: true, message: "Logged out successfully" });
});

export default router;
