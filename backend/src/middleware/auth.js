import jwt from "jsonwebtoken";

// Block direct browser URL-bar navigation to API endpoints.
// Browsers set Sec-Fetch-Mode: "navigate" on address-bar requests and
// "cors" / "same-origin" on fetch() calls from the app.
// Non-browser clients (Postman, curl, mobile apps) don't send this header
// at all, so they are unaffected.
export function apiOnly(req, res, next) {
  if (req.headers["sec-fetch-mode"] === "navigate") {
    return res.status(403).json({ ok: false, error: "Direct browser access to API endpoints is not allowed." });
  }
  next();
}

export function authRequired(req, res, next) {
  // Try to get token from cookie first, then fall back to Authorization header
  const token = req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (!token) {
    return res.status(401).json({ ok: false, error: "Authentication required." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid or expired token." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Access denied. Insufficient permissions." });
    }
    next();
  };
}

// Ensure officers can only access their own state data
export function requireStateAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "Authentication required." });
  }

  // Admins can access any state
  if (req.user.role === "admin") {
    return next();
  }

  // Officers must have a state assigned
  if (!req.user.state) {
    return res.status(403).json({ ok: false, error: "No state assigned to your account." });
  }

  // Officers can only access their assigned state
  const requestedState = (req.body && req.body.state) || (req.query && req.query.state);
  if (requestedState && requestedState.toLowerCase() !== req.user.state.toLowerCase()) {
    return res.status(403).json({ ok: false, error: "Access denied. You can only access data for your assigned state." });
  }

  next();
}
