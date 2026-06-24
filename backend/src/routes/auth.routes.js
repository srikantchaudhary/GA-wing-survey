import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import pool from "../config/db.js";

function createMailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendOtpEmail(toEmail, otp) {
  const transporter = createMailTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `GAMIS Portal <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "GAMIS – Your Password Reset Code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#F7F5EF;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#185FA5,#0F6E56);border-radius:12px;line-height:56px;color:#fff;font-size:20px;font-weight:900;font-family:serif;">GA</div>
          <h2 style="margin:12px 0 4px;color:#2C2C2A;font-family:serif;">GAMIS Portal</h2>
          <p style="margin:0;font-size:12px;color:#888780;">Office of the Controller General of Accounts · Ministry of Finance</p>
        </div>
        <div style="background:#fff;border-radius:12px;padding:28px 24px;border:1px solid #E8E6DF;">
          <h3 style="margin:0 0 8px;color:#2C2C2A;font-size:16px;">Password Reset Request</h3>
          <p style="margin:0 0 20px;color:#5F5E5A;font-size:13px;line-height:1.6;">
            We received a request to reset your password. Use the 6-digit code below to complete the process.
            This code is valid for <strong>15 minutes</strong>.
          </p>
          <div style="background:#F7F5EF;border:1px solid #E8E6DF;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:#888780;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">Your Reset Code</div>
            <div style="font-size:36px;font-weight:900;letter-spacing:0.4em;color:#185FA5;font-family:monospace;">${otp}</div>
          </div>
          <p style="margin:0;color:#B4B2A9;font-size:11px;line-height:1.6;">
            If you did not request a password reset, please ignore this email. Your password will not change.
          </p>
        </div>
        <p style="text-align:center;margin-top:20px;color:#B4B2A9;font-size:11px;">
          GA Wing IMS · Ministry of Finance · Do not reply to this email.
        </p>
      </div>
    `,
  });
}

const router = Router();

// ─── login rate limiter (in-memory) ──────────────────────────────────────────
// Tracks failed attempts per email. After MAX_ATTEMPTS consecutive failures
// the account is locked for BLOCK_MS milliseconds.

const MAX_ATTEMPTS = 5;
const BLOCK_MS     = 10 * 60 * 1000; // 10 minutes

const loginAttempts = new Map(); // email -> { count: number, blockedUntil: number | null }

function getAttemptRecord(email) {
  return loginAttempts.get(email) || { count: 0, blockedUntil: null };
}

function recordFailure(email) {
  const rec   = getAttemptRecord(email);
  const count = rec.count + 1;
  loginAttempts.set(email, {
    count,
    blockedUntil: count >= MAX_ATTEMPTS ? Date.now() + BLOCK_MS : null,
  });
  return count;
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

function checkBlocked(email) {
  const rec = loginAttempts.get(email);
  if (!rec?.blockedUntil) return null;
  if (Date.now() >= rec.blockedUntil) { loginAttempts.delete(email); return null; }
  return rec.blockedUntil; // timestamp until which login is blocked
}

// ─────────────────────────────────────────────────────────────────────────────

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
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ ok: false, error: "Password must be at least 8 characters and contain a letter, a number, and a special character." });
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

    // ── Rate-limit check ──────────────────────────────────────────────────────
    const blockedUntil = checkBlocked(normalizedEmail);
    if (blockedUntil) {
      const minsLeft = Math.ceil((blockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        ok: false,
        error: `Account temporarily locked due to too many failed attempts. Try again in ${minsLeft} minute${minsLeft !== 1 ? "s" : ""}.`,
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (!rows.length) {
      recordFailure(normalizedEmail);
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const row   = rows[0];
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      const failCount = recordFailure(normalizedEmail);
      const attemptsLeft = MAX_ATTEMPTS - failCount;
      if (attemptsLeft <= 0) {
        return res.status(429).json({
          ok: false,
          error: "Account locked for 10 minutes after too many failed login attempts.",
        });
      }
      return res.status(401).json({
        ok: false,
        error: `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before lockout.`,
      });
    }

    // Successful login — clear any previous failures
    clearAttempts(normalizedEmail);

    const user  = publicUser(row);
    const token = signToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
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
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true, message: "Logged out successfully" });
});

// POST /auth/forgot-password — generate a 6-digit OTP, store hashed, send via email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ ok: false, error: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);

    if (!rows.length) {
      // Don't reveal whether this email is registered (prevents enumeration)
      return res.json({ ok: true, message: "If this email is registered, a reset code has been sent." });
    }

    const otp     = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 8);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      "UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE email = ?",
      [otpHash, expires, normalizedEmail]
    );

    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr.message);
      return res.status(500).json({
        ok: false,
        error: "Could not send reset email. Please check the email configuration or try again later.",
      });
    }

    res.json({ ok: true, message: "A 6-digit reset code has been sent to your email address." });
  } catch (err) {
    console.error("POST /auth/forgot-password", err);
    res.status(500).json({ ok: false, error: "Failed to process request." });
  }
});

// POST /auth/reset-password — verify OTP and set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email?.trim() || !otp || !newPassword) {
      return res.status(400).json({ ok: false, error: "Email, reset code, and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id, reset_otp, reset_otp_expires FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (!rows.length || !rows[0].reset_otp) {
      return res.status(400).json({ ok: false, error: "Invalid or expired reset code." });
    }

    const row = rows[0];

    if (new Date() > new Date(row.reset_otp_expires)) {
      return res.status(400).json({ ok: false, error: "Reset code has expired. Please request a new one." });
    }

    const match = await bcrypt.compare(String(otp), row.reset_otp);
    if (!match) {
      return res.status(400).json({ ok: false, error: "Invalid reset code." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?",
      [passwordHash, row.id]
    );

    res.json({ ok: true, message: "Password reset successfully. You can now sign in." });
  } catch (err) {
    console.error("POST /auth/reset-password", err);
    res.status(500).json({ ok: false, error: "Failed to reset password." });
  }
});

export default router;
