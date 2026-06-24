import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./config/db.js";
import { authRequired, apiOnly } from "./middleware/auth.js";
import authRoutes from "./routes/auth.routes.js";
import formsRoutes from "./routes/forms.routes.js";
import sectionsRoutes from "./routes/sections.routes.js";
import responsesRoutes from "./routes/responses.routes.js";
import draftsRoutes from "./routes/drafts.routes.js";
import nominationsRoutes from "./routes/nominations.routes.js";
import mcaMkiRoutes from "./routes/mca-mki.routes.js";
import statesRoutes from "./routes/states.routes.js";
import designationsRoutes from "./routes/designations.routes.js";
import grievancesRoutes from "./routes/grievances.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
// Uploaded files (grievance attachments) are only accessible to authenticated users.
// Use GET /api/grievances/:id/view for state-scoped access instead of direct URL.
app.use("/uploads", authRequired, express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, message: "GA Wing API is running" });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Database unavailable", error: err.message });
  }
});

// Block direct browser URL-bar navigation to all API routes (except /health above)
app.use("/api", apiOnly);

app.use("/api/auth", authRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/custom-sections", sectionsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/drafts", draftsRoutes);
app.use("/api/nominations", nominationsRoutes);
app.use("/api/mca-mki", mcaMkiRoutes);
app.use("/api/states", statesRoutes);
app.use("/api/designations", designationsRoutes);
app.use("/api/grievances", grievancesRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`GA Wing API listening on http://localhost:${PORT}`);
});
