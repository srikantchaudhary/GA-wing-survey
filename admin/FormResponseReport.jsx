import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { getForms, getResponses, getCustomSections, logoutUser, approveFormsBulk } from "../store.js";
import { getFormSections, SUBMISSION_FIELDS } from "../formSchema.js";
import AdminSidebar from "./AdminSidebar.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function cellVal(val) {
  if (val === null || val === undefined || val === "") return "—";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function rawVal(val) {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function buildColumns(form, customSections) {
  if (!form) return [];
  const cols = [];
  SUBMISSION_FIELDS.forEach(f => {
    if (f.id !== "sub_date") {
      cols.push({ key: f.id, label: f.label, sectionLabel: "Submission Details", sectionColor: "#888780" });
    }
  });
  getFormSections(form, customSections).forEach(section => {
    (section.fields || []).forEach(field => {
      cols.push({ key: field.id, label: field.label, sectionLabel: section.label, sectionColor: section.color || "#185FA5" });
    });
  });
  return cols;
}

// ─── form searchable select ───────────────────────────────────────────────────

function FormSearchableSelect({ value, onChange, forms }) {
  const [query, setQuery]           = useState("");
  const [open, setOpen]             = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  const getLabel = (f) => `${f.name || f.formId}${f.surveyYear ? ` (${f.surveyYear})` : ""}`;
  const selectedForm = forms.find(f => String(f.id) === value);
  const displayValue = open ? query : (selectedForm ? getLabel(selectedForm) : "");

  const filtered = forms.filter(f =>
    !query || getLabel(f).toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setHighlighted(0); }, [query]);

  const select = (f) => { onChange(f ? String(f.id) : ""); setQuery(""); setOpen(false); };

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted === 0) select(null);
      else if (filtered[highlighted - 1]) select(filtered[highlighted - 1]);
    } else if (e.key === "Escape") { setOpen(false); setQuery(""); }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={value ? "" : "Search forms…"}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2.5 pr-8 text-sm border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5] bg-white cursor-text"
          autoComplete="off"
        />
        <span
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B4B2A9] cursor-pointer select-none ${value ? "text-base leading-none" : "text-xs"}`}
          onClick={() => { if (value) { select(null); } else { setOpen(o => !o); inputRef.current?.focus(); } }}
        >
          {value ? "×" : "▾"}
        </span>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E8E6DF] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div
            className={`px-4 py-2.5 text-sm cursor-pointer ${highlighted === 0 ? "bg-[#E6F1FB] text-[#185FA5] font-semibold" : "text-[#888780] hover:bg-[#F7F5EF]"}`}
            onMouseDown={() => select(null)}
            onMouseEnter={() => setHighlighted(0)}
          >
            — Select a form —
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 py-2.5 text-sm text-[#B4B2A9]">No forms found</div>
          ) : (
            filtered.map((f, i) => (
              <div
                key={f.id}
                className={`px-4 py-2.5 text-sm cursor-pointer ${
                  highlighted === i + 1
                    ? "bg-[#E6F1FB] text-[#185FA5] font-semibold"
                    : String(f.id) === value
                    ? "bg-[#F4FBF8] text-[#0F6E56] font-semibold"
                    : "text-[#2C2C2A] hover:bg-[#F7F5EF]"
                }`}
                onMouseDown={() => select(f)}
                onMouseEnter={() => setHighlighted(i + 1)}
              >
                {getLabel(f)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── searchable select ────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, options, placeholder = "Search…", allLabel = "All States" }) {
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  // Display text in the input: if closed and a value is selected, show the value
  const displayValue = open ? query : (value || "");

  const filtered = options.filter(o =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => { setHighlighted(0); }, [query]);

  const select = (v) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length)); // +1 for "All" row
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted === 0) select("");
      else if (filtered[highlighted - 1]) select(filtered[highlighted - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={value ? "" : placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2.5 pr-8 text-sm border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5] bg-white cursor-text"
          autoComplete="off"
        />
        {/* Caret / clear button */}
        <span
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B4B2A9] cursor-pointer select-none text-xs"
          onClick={() => {
            if (value) { select(""); }
            else { setOpen(o => !o); inputRef.current?.focus(); }
          }}
        >
          {value ? "×" : "▾"}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E8E6DF] rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {/* All States row */}
          <div
            className={`px-4 py-2.5 text-sm cursor-pointer ${highlighted === 0 ? "bg-[#E6F1FB] text-[#185FA5] font-semibold" : "text-[#888780] hover:bg-[#F7F5EF]"}`}
            onMouseDown={() => select("")}
            onMouseEnter={() => setHighlighted(0)}
          >
            {allLabel}
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-2.5 text-sm text-[#B4B2A9]">No states found</div>
          ) : (
            filtered.map((o, i) => (
              <div
                key={o}
                className={`px-4 py-2.5 text-sm cursor-pointer ${
                  highlighted === i + 1
                    ? "bg-[#E6F1FB] text-[#185FA5] font-semibold"
                    : o === value
                    ? "bg-[#F4FBF8] text-[#0F6E56] font-semibold"
                    : "text-[#2C2C2A] hover:bg-[#F7F5EF]"
                }`}
                onMouseDown={() => select(o)}
                onMouseEnter={() => setHighlighted(i + 1)}
              >
                {o}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E1F5EE] px-2.5 py-0.5 text-[10px] font-bold text-[#0F6E56]">
        ✅ Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE8E8] px-2.5 py-0.5 text-[10px] font-bold text-[#A32D2D]">
        ❌ Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FAEEDA] px-2.5 py-0.5 text-[10px] font-bold text-[#854F0B]">
      ⏳ Pending
    </span>
  );
}

// ─── detail modal ─────────────────────────────────────────────────────────────

function DetailModal({ response, form, customSections, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const cols = buildColumns(form, customSections);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E8E6DF]">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#2C2C2A] font-serif leading-snug">
              {response.data?.sub_name || response.officerName || "Response Detail"}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[10px] font-semibold text-[#185FA5]">
                {response.state}
              </span>
              <StatusBadge status={response.approvalStatus} />
              <span className="text-[11px] text-[#888780]">{fmtDate(response.submittedAt)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1EFE8] cursor-pointer border-none text-[#888780] text-xl leading-none shrink-0 ml-4"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {(() => {
            const bySection = {};
            cols.forEach(col => {
              if (!bySection[col.sectionLabel]) bySection[col.sectionLabel] = { color: col.sectionColor, fields: [] };
              bySection[col.sectionLabel].fields.push(col);
            });
            return Object.entries(bySection).map(([sectionLabel, { color, fields }]) => (
              <div key={sectionLabel}>
                <div
                  className="text-[10px] font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                  style={{ color, borderColor: color + "40" }}
                >
                  {sectionLabel}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {fields.map(col => (
                    <div key={col.key} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-[#B4B2A9] uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="text-[13px] text-[#2C2C2A] leading-snug">
                        {cellVal(response.data?.[col.key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>

        <div className="px-6 py-4 border-t border-[#E8E6DF] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#DDD9D0] bg-white px-5 py-2 text-xs font-semibold text-[#5F5E5A] cursor-pointer hover:bg-[#F7F5EF]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function FormResponseReport() {
  const navigate = useNavigate();

  const [forms, setForms]               = useState([]);
  const [responses, setResponses]       = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  // Filters
  const [selectedFormId, setSelectedFormId] = useState("");
  const [selectedState, setSelectedState]   = useState("");
  const [statusFilter, setStatusFilter]     = useState("");   // ""|"pending"|"approved"|"rejected"

  // Selection — keyed by response ID (number)
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  const [detailRow, setDetailRow] = useState(null);

  useEffect(() => {
    document.title = "GAMIS - Form Response Report";
    (async () => {
      try {
        const [f, r, cs] = await Promise.all([getForms(), getResponses(), getCustomSections()]);
        const formsArr    = Array.isArray(f) ? f : [];
        const responsesArr = Array.isArray(r) ? r : [];
        setForms(formsArr);
        setResponses(responsesArr);
        setCustomSections(Array.isArray(cs) ? cs : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reset selection when form/filters change
  useEffect(() => { setSelectedIds(new Set()); }, [selectedFormId, selectedState, statusFilter]);

  const selectedForm = forms.find(f => String(f.id) === selectedFormId);

  const handleLogout = async () => {
    await logoutUser();
    window.dispatchEvent(new StorageEvent("storage", { key: "gawing_session", newValue: null }));
    navigate("/login", { replace: true });
  };

  const toggleId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const ids = filtered.map(r => r.id);
    const allSelected = ids.every(id => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(ids));
  };

  // Apply approve or reject to selected record IDs
  const handleAction = async (status) => {
    if (!selectedIds.size) return;
    const ids = [...selectedIds];
    const label = status === "approved" ? "Approve" : "Reject";
    if (!window.confirm(
      `${label} ${ids.length} record(s)?\n\n${
        status === "approved"
          ? "Approved records will be locked — the officer cannot edit them."
          : "Rejected records will be returned to the officer for correction."
      }`
    )) return;
    setActionLoading(true);
    try {
      await approveFormsBulk(ids, status);
      // Update local state immediately — no reload needed
      setResponses(prev => prev.map(r =>
        selectedIds.has(r.id)
          ? { ...r, approvalStatus: status, approvedAt: new Date().toISOString() }
          : r
      ));
      setSelectedIds(new Set());
    } catch (err) {
      alert(err.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Derived
  const responseFormIds    = new Set(responses.map(r => r.formId));
  const formsWithResponses = forms.filter(f => responseFormIds.has(f.formId));

  const columns      = buildColumns(selectedForm, customSections);
  const TABLE_ALWAYS = new Set(["sub_name", "sub_desig", "sub_office"]);
  const tableColumns = columns.filter(c => TABLE_ALWAYS.has(c.key) || !c.key.startsWith("sub_"));

  const filtered = responses
    .filter(r => !selectedForm || r.formId === selectedForm.formId)
    .filter(r => !selectedState || r.state === selectedState)
    .filter(r => !statusFilter || r.approvalStatus === statusFilter)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const statesForForm = selectedForm
    ? [...new Set(responses.filter(r => r.formId === selectedForm.formId).map(r => r.state).filter(Boolean))].sort()
    : [];

  // Counts for the form
  const formResponses = selectedForm ? responses.filter(r => r.formId === selectedForm.formId) : [];
  const approvedCount = formResponses.filter(r => r.approvalStatus === "approved").length;
  const rejectedCount = formResponses.filter(r => r.approvalStatus === "rejected").length;
  const pendingCount  = formResponses.filter(r => r.approvalStatus === "pending").length;

  const allSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id));

  function exportExcel() {
    if (!filtered.length) return;
    const headers = ["#", "Form", "State", "Status", "Officer Name", "Officer Email", "Submitted On",
      ...columns.map(c => c.label)];
    const rows = filtered.map((r, i) => [
      i + 1,
      r.formName || selectedForm?.name || "",
      r.state || "",
      r.approvalStatus,
      r.data?.sub_name || r.officerName || "",
      r.officerEmail || "",
      fmtDate(r.submittedAt),
      ...columns.map(c => rawVal(r.data?.[c.key])),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((h, i) => ({ wch: i < 7 ? 18 : Math.max(h.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `${selectedForm?.name || "Form"}_Responses.xlsx`);
  }

  return (
    <div className="min-h-screen bg-ga-cream font-sans flex flex-col">
      {/* Header */}
      <header className="h-[60px] bg-white border-b border-[#E8E6DF] flex items-center justify-between px-8 gap-3.5">
        <div className="flex items-center gap-3.5">
          <div
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[13px] font-extrabold font-serif shrink-0 cursor-pointer"
          >
            GA
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#2C2C2A] leading-tight font-serif">GAMIS</div>
            <div className="text-[10px] text-[#888780]">
              Office of the Controller General of Accounts · Ministry of Finance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/")} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">
            🏠 Home
          </button>
          <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <AdminSidebar activePage="form-report" />

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b border-ga-border bg-white px-6 py-3">
            <Breadcrumb />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-5">
              <h1 className="text-xl font-extrabold text-[#2C2C2A] font-serif">Form Response Report</h1>
              <p className="text-sm text-[#888780] mt-0.5">
                Select individual records to approve or reject. Approved records are locked for officers.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-sm text-[#888780]">Loading…</div>
            ) : error ? (
              <div className="flex items-center justify-center py-24 text-sm text-[#A32D2D]">{error}</div>
            ) : (
              <>
                {/* ── Filter bar ── */}
                <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 mb-5">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end flex-wrap">
                    <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#B4B2A9]">Form</label>
                      <FormSearchableSelect
                        value={selectedFormId}
                        onChange={v => { setSelectedFormId(v); setSelectedState(""); }}
                        forms={formsWithResponses}
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:w-52">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#B4B2A9]">State</label>
                      <SearchableSelect
                        value={selectedState}
                        onChange={v => setSelectedState(v)}
                        options={statesForForm}
                        placeholder="Search state…"
                        allLabel="All States"
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:w-40">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#B4B2A9]">Status</label>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5] bg-white cursor-pointer"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="approved">✅ Approved</option>
                        <option value="rejected">❌ Rejected</option>
                      </select>
                    </div>

                    <button
                      onClick={exportExcel}
                      disabled={!filtered.length}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0F6E56] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer border-none hover:bg-[#0a5a46] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      ⬇ Export Excel
                    </button>
                  </div>
                </div>

                {/* ── Summary + action bar ── */}
                {selectedForm && (
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 rounded-full bg-[#FAEEDA] px-3 py-1 text-[11px] font-semibold text-[#854F0B]">
                        ⏳ <span className="font-bold">{pendingCount}</span> pending
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-[#E1F5EE] px-3 py-1 text-[11px] font-semibold text-[#0F6E56]">
                        ✅ <span className="font-bold">{approvedCount}</span> approved
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-[#FEE8E8] px-3 py-1 text-[11px] font-semibold text-[#A32D2D]">
                        ❌ <span className="font-bold">{rejectedCount}</span> rejected
                      </div>
                      {(selectedState || statusFilter) && (
                        <button
                          onClick={() => { setSelectedState(""); setStatusFilter(""); }}
                          className="flex items-center gap-1 rounded-full bg-[#F1EFE8] px-3 py-1 text-[11px] font-semibold text-[#5F5E5A] border-none cursor-pointer hover:bg-[#E8E6DF]"
                        >
                          Clear filters ×
                        </button>
                      )}
                    </div>

                    {/* Approve / Reject buttons shown when records are selected */}
                    {selectedIds.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#888780] mr-1">
                          {selectedIds.size} record{selectedIds.size !== 1 ? "s" : ""} selected
                        </span>
                        <button
                          onClick={() => handleAction("approved")}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-4 py-2 text-[12px] font-bold text-white cursor-pointer border-none hover:bg-[#0a5a46] transition-colors disabled:opacity-60"
                        >
                          {actionLoading ? "Processing…" : "✅ Approve"}
                        </button>
                        <button
                          onClick={() => handleAction("rejected")}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#A32D2D] px-4 py-2 text-[12px] font-bold text-white cursor-pointer border-none hover:bg-[#8a2424] transition-colors disabled:opacity-60"
                        >
                          {actionLoading ? "Processing…" : "❌ Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-sm">
                  {!selectedForm ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="text-4xl">📋</div>
                      <div className="text-sm font-medium text-[#5F5E5A]">Select a form above to view responses</div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="text-4xl">📭</div>
                      <div className="text-sm font-medium text-[#5F5E5A]">No responses found</div>
                      <div className="text-xs text-[#B4B2A9]">Try clearing the filters above</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm" style={{ minWidth: `${Math.max(1060, 300 + tableColumns.length * 160)}px` }}>
                        <thead>
                          <tr className="bg-[#F7F5EF] border-b border-[#E8E6DF]">
                            {/* Select-all */}
                            <th className="px-4 py-3 w-10">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 cursor-pointer accent-[#185FA5]"
                                title="Select / deselect all visible records"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Actions</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap w-10">#</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">State</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Submitted On</th>
                            {tableColumns.map(col => (
                              <th
                                key={col.key}
                                className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                                style={{ color: col.sectionColor || "#888780" }}
                                title={col.sectionLabel}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((r, i) => {
                            const isChecked = selectedIds.has(r.id);
                            const rowBg = isChecked
                              ? "bg-[#EBF4FF]"
                              : r.approvalStatus === "approved"
                              ? "bg-[#F4FBF8]"
                              : r.approvalStatus === "rejected"
                              ? "bg-[#FFF7F7]"
                              : "hover:bg-[#FAFAF8]";

                            return (
                              <tr
                                key={r.id}
                                className={`border-b border-[#F1EFE8] transition-colors cursor-pointer ${rowBg}`}
                                onClick={() => toggleId(r.id)}
                              >
                                {/* Per-record checkbox */}
                                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleId(r.id)}
                                    className="w-4 h-4 cursor-pointer accent-[#185FA5]"
                                  />
                                </td>

                                {/* View button */}
                                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => setDetailRow(r)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#E6F1FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors cursor-pointer border-none"
                                  >
                                    View
                                  </button>
                                </td>

                                <td className="px-4 py-3.5 text-[#888780] text-xs">{i + 1}</td>

                                {/* State chip */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[10px] font-semibold text-[#185FA5]">
                                    {r.state || "—"}
                                  </span>
                                </td>

                                {/* Per-record status badge */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <StatusBadge status={r.approvalStatus} />
                                </td>

                                <td className="px-4 py-3.5 text-[#888780] text-xs whitespace-nowrap">
                                  {fmtDate(r.submittedAt)}
                                </td>

                                {tableColumns.map(col => (
                                  <td key={col.key} className="px-4 py-3.5 text-[#5F5E5A] text-xs max-w-[200px]">
                                    <div className="truncate" title={cellVal(r.data?.[col.key])}>
                                      {cellVal(r.data?.[col.key])}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {filtered.length > 0 && (
                  <div className="mt-3 text-[11px] text-[#B4B2A9]">
                    {filtered.length} record{filtered.length !== 1 ? "s" : ""} shown · Click a row (or checkbox) to select · Approved records are locked for officers
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {detailRow && (
        <DetailModal
          response={detailRow}
          form={selectedForm}
          customSections={customSections}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  );
}
