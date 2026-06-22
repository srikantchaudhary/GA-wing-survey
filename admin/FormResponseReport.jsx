import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { getForms, getResponses, getCustomSections, logoutUser } from "../store.js";
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

// Build ordered column list for a form
function buildColumns(form, customSections) {
  if (!form) return [];
  const cols = [];

  // Submission fields (skip sub_date — auto-set, not useful in table)
  SUBMISSION_FIELDS.forEach(f => {
    if (f.id !== "sub_date") {
      cols.push({ key: f.id, label: f.label, sectionLabel: "Submission Details", sectionColor: "#888780" });
    }
  });

  // Built-in + custom section fields
  getFormSections(form, customSections).forEach(section => {
    (section.fields || []).forEach(field => {
      cols.push({ key: field.id, label: field.label, sectionLabel: section.label, sectionColor: section.color || "#185FA5" });
    });
  });

  return cols;
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
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E8E6DF]">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#2C2C2A] font-serif leading-snug">
              {response.data?.sub_name || response.officerName || "Response Detail"}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[10px] font-semibold text-[#185FA5]">
                {response.state}
              </span>
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

        {/* Body — group by section */}
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

  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedFormId, setSelectedFormId] = useState(""); // form.id as string
  const [selectedState, setSelectedState] = useState("");

  // Detail view
  const [detailRow, setDetailRow] = useState(null);

  useEffect(() => {
    document.title = "GAMIS - Form Response Report";
    (async () => {
      try {
        const [f, r, cs] = await Promise.all([getForms(), getResponses(), getCustomSections()]);
        const formsArr = Array.isArray(f) ? f : [];
        setForms(formsArr);
        setResponses(Array.isArray(r) ? r : []);
        setCustomSections(Array.isArray(cs) ? cs : []);
        if (formsArr.length > 0) setSelectedFormId(String(formsArr[0].id));
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    window.dispatchEvent(new StorageEvent("storage", { key: "gawing_session", newValue: null }));
    navigate("/login", { replace: true });
  };

  // Derived
  const selectedForm = forms.find(f => String(f.id) === selectedFormId);
  const columns = buildColumns(selectedForm, customSections);

  const filtered = responses
    .filter(r => !selectedForm || r.formId === selectedForm.formId)
    .filter(r => !selectedState || r.state === selectedState)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const statesForForm = selectedForm
    ? [...new Set(
        responses
          .filter(r => r.formId === selectedForm.formId)
          .map(r => r.state)
          .filter(Boolean)
      )].sort()
    : [...new Set(responses.map(r => r.state).filter(Boolean))].sort();

  // Summary counts
  const totalResponses = filtered.length;
  const uniqueStates = [...new Set(filtered.map(r => r.state).filter(Boolean))].length;

  // Export to Excel
  function exportExcel() {
    if (!filtered.length) return;
    const headers = ["#", "Form", "State", "Officer Name", "Officer Email", "Submitted On",
      ...columns.map(c => c.label)];
    const rows = filtered.map((r, i) => [
      i + 1,
      r.formName || selectedForm?.name || "",
      r.state || "",
      r.data?.sub_name || r.officerName || "",
      r.officerEmail || "",
      fmtDate(r.submittedAt),
      ...columns.map(c => rawVal(r.data?.[c.key])),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Column widths
    ws["!cols"] = headers.map((h, i) => ({ wch: i < 6 ? 18 : Math.max(h.length + 2, 14) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `${selectedForm?.name || "Form"}_Responses.xlsx`);
  }

  // ── table columns to always show in the table (abbreviated set for readability)
  // Show: Name, Designation, Office + all section fields (not all sub_* to keep width sane)
  const TABLE_ALWAYS = new Set(["sub_name", "sub_desig", "sub_office"]);
  const tableColumns = columns.filter(c => TABLE_ALWAYS.has(c.key) || !c.key.startsWith("sub_"));

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
          <button
            onClick={() => navigate("/")}
            className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body"
          >
            🏠 Home
          </button>
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body"
          >
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
            {/* Page heading */}
            <div className="mb-5">
              <h1 className="text-xl font-extrabold text-[#2C2C2A] font-serif">Form Response Report</h1>
              <p className="text-sm text-[#888780] mt-0.5">
                View and export dynamic form responses filtered by form and state.
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
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#B4B2A9]">
                        Form
                      </label>
                      <select
                        value={selectedFormId}
                        onChange={e => { setSelectedFormId(e.target.value); setSelectedState(""); }}
                        className="w-full px-4 py-2.5 text-sm border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5] bg-white cursor-pointer"
                      >
                        <option value="">— Select a form —</option>
                        {forms.map(f => (
                          <option key={f.id} value={String(f.id)}>
                            {f.name || f.formId}
                            {f.surveyYear ? ` (${f.surveyYear})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 sm:w-56">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#B4B2A9]">
                        State
                      </label>
                      <select
                        value={selectedState}
                        onChange={e => setSelectedState(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5] bg-white cursor-pointer"
                      >
                        <option value="">All States</option>
                        {statesForForm.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
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

                {/* ── Summary chips ── */}
                {selectedForm && (
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 rounded-full bg-[#E6F1FB] px-3 py-1 text-[11px] font-semibold text-[#185FA5]">
                      <span className="font-bold text-[#185FA5]">{totalResponses}</span> response{totalResponses !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-[#E1F5EE] px-3 py-1 text-[11px] font-semibold text-[#0F6E56]">
                      <span className="font-bold">{uniqueStates}</span> state{uniqueStates !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-[#F7F5EF] px-3 py-1 text-[11px] font-semibold text-[#888780]">
                      {selectedForm.formId}
                      {selectedForm.surveyYear ? ` · ${selectedForm.surveyYear}` : ""}
                    </div>
                    {selectedState && (
                      <button
                        onClick={() => setSelectedState("")}
                        className="flex items-center gap-1 rounded-full bg-[#FAEEDA] px-3 py-1 text-[11px] font-semibold text-[#854F0B] border-none cursor-pointer hover:bg-[#f5d9b5]"
                      >
                        {selectedState} ×
                      </button>
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
                      <div className="text-xs text-[#B4B2A9]">
                        {selectedState
                          ? `No submissions from ${selectedState} for this form`
                          : "This form has no submissions yet"}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm" style={{ minWidth: `${Math.max(900, 180 + tableColumns.length * 160)}px` }}>
                        <thead>
                          <tr className="bg-[#F7F5EF] border-b border-[#E8E6DF]">
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Actions</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap w-10">#</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">State</th>
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
                          {filtered.map((r, i) => (
                            <tr
                              key={r.id}
                              className="border-b border-[#F1EFE8] hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                              onClick={() => setDetailRow(r)}
                            >
                              <td className="px-4 py-3.5">
                                <button
                                  onClick={e => { e.stopPropagation(); setDetailRow(r); }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#E6F1FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors cursor-pointer border-none"
                                >
                                  View
                                </button>
                              </td>
                              <td className="px-4 py-3.5 text-[#888780] text-xs">{i + 1}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[10px] font-semibold text-[#185FA5]">
                                  {r.state || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-[#888780] text-xs whitespace-nowrap">
                                {fmtDate(r.submittedAt)}
                              </td>
                              {tableColumns.map(col => (
                                <td
                                  key={col.key}
                                  className="px-4 py-3.5 text-[#5F5E5A] text-xs max-w-[200px]"
                                >
                                  <div className="truncate" title={cellVal(r.data?.[col.key])}>
                                    {cellVal(r.data?.[col.key])}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {filtered.length > 0 && (
                  <div className="mt-4 text-[11px] text-[#B4B2A9]">
                    {filtered.length} response{filtered.length !== 1 ? "s" : ""} · Click any row to view full details
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
