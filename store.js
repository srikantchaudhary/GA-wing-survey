// ─────────────────────────────────────────────────────────
//  store.js  —  GA Wing Data Layer (Express + MySQL API)
// ─────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SESSION_KEY = "gawing_session";

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || "Request failed");
    err.status = res.status;
    err.data = data;

    // Force logout on 403 errors (likely token issue)
    if (res.status === 403) {
      localStorage.removeItem(SESSION_KEY);
    }

    // Don't throw for 401 - let caller handle it
    if (res.status === 401) {
      err.suppressLog = true;
    }

    throw err;
  }
  return data;
}

export async function initStore() {
  try {
    await api("/health");
  } catch {
    console.warn("GA Wing API unavailable — check backend is running on port 3001.");
  }
}

// ══════════════════════════════════════════════════════════
//  AUTH API
// ══════════════════════════════════════════════════════════

export async function registerUser({ name, email, state, role, password }) {
  try {
    const result = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, state, role, password }),
    });
    return result;
  } catch (err) {
    return { ok: false, error: err.data?.error || err.message };
  }
}

export async function loginUser(email, password) {
  try {
    const result = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.ok && result.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    }
    return result;
  } catch (err) {
    return { ok: false, error: err.data?.error || err.message };
  }
}

export async function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // If no session in localStorage, try to fetch from backend
    const result = await api("/auth/me");
    if (result.ok && result.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      return result.user;
    }
    return null;
  } catch {
    // If API call fails, clear session and return null
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function logoutUser() {
  // Clear the local session up front (synchronously) so any auth check that runs
  // right after — e.g. the login page's "already logged in" redirect guard — sees
  // the user as logged out immediately. Otherwise a single logout click would
  // navigate to /login while the session still existed, bouncing the user back.
  localStorage.removeItem(SESSION_KEY);
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout errors — the local session is already cleared.
  }
}

// ══════════════════════════════════════════════════════════
//  FORMS API
// ══════════════════════════════════════════════════════════

export async function getForms() {
  return api("/forms");
}

export async function saveForm(form) {
  return api("/forms", {
    method: "POST",
    body: JSON.stringify(form),
  });
}

export async function deleteFormById(id) {
  return api(`/forms/${id}`, { method: "DELETE" });
}

export async function publishForm(id, states) {
  return api(`/forms/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ states }),
  });
}

// ══════════════════════════════════════════════════════════
//  CUSTOM SECTIONS API
// ══════════════════════════════════════════════════════════

export async function getCustomSections() {
  return api("/custom-sections");
}

export async function saveCustomSection(section) {
  return api("/custom-sections", {
    method: "POST",
    body: JSON.stringify(section),
  });
}

export async function removeCustomSection(id) {
  return api(`/custom-sections/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ══════════════════════════════════════════════════════════
//  RESPONSES API
// ══════════════════════════════════════════════════════════

export async function getResponses() {
  return api("/responses");
}

export async function saveResponse(response) {
  return api("/responses", {
    method: "POST",
    body: JSON.stringify(response),
  });
}

export async function getResponseByStateAndForm(state, formId) {
  const params = new URLSearchParams({ state, formId });
  return api(`/responses/lookup?${params}`);
}

// ══════════════════════════════════════════════════════════
//  DRAFT RESPONSES API
// ══════════════════════════════════════════════════════════

export async function getDraftResponse(state, formId) {
  const params = new URLSearchParams({ state, formId });
  return api(`/drafts?${params}`);
}

export async function saveDraftResponse(state, formId, data) {
  await api("/drafts", {
    method: "PUT",
    body: JSON.stringify({ state, formId, data }),
  });
}

// ══════════════════════════════════════════════════════════
//  REFERENCE DATA API  (states + designations)
// ══════════════════════════════════════════════════════════

export async function getStates() {
  const data = await api("/states");
  return Array.isArray(data) ? data : [];
}

export async function getDesignations() {
  const data = await api("/designations");
  return Array.isArray(data) ? data : [];
}

// ══════════════════════════════════════════════════════════
//  STATIC FORMS API  (DA cadre nominations + MCA/MKI records)
// ══════════════════════════════════════════════════════════

export async function getNominations() {
  return api("/nominations");
}

export async function saveNomination(nomination) {
  return api("/nominations", {
    method: "POST",
    body: JSON.stringify(nomination),
  });
}

export async function deleteNomination(id) {
  return api(`/nominations/${id}`, { method: "DELETE" });
}

export async function getMcaMkiRecords() {
  return api("/mca-mki");
}

export async function saveMcaMkiRecord(record) {
  return api("/mca-mki", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function deleteMcaMkiRecord(id) {
  return api(`/mca-mki/${id}`, { method: "DELETE" });
}

export async function updateNomination(id, data) {
  return api(`/nominations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateMcaMkiRecord(id, data) {
  return api(`/mca-mki/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
