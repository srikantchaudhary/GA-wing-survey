import { useState, useEffect } from "react";
import { getAllResponsesByStateAndForm } from "../store.js";
import { getFormSections } from "../formSchema.js";

// Fixed submission columns always shown left of section columns
const FIXED_COLS = [
  { id: "sub_name",   label: "Officer Name" },
  { id: "sub_desig",  label: "Designation" },
  { id: "sub_office", label: "Office / A&E Branch" },
];

// Extra submission fields shown only in the detail modal
const EXTRA_SUB_COLS = [
  { id: "sub_email", label: "Email" },
  { id: "sub_phone", label: "Phone" },
  { id: "sub_rem",   label: "Remarks" },
  { id: "sub_date",  label: "Date of Submission" },
];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function cellVal(field, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (field?.type === "date" && value) {
    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch { return value; }
  }
  return String(value);
}

// ─── icons ────────────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ─── detail modal ─────────────────────────────────────────────────────────────

function DetailModal({ response, sections, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

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
              {response.data?.sub_name || "Response Detail"}
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

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#888780] mb-3 pb-1 border-b border-[#E8E6DF]">
              Submission Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[...FIXED_COLS, ...EXTRA_SUB_COLS].map(col => (
                <div key={col.id} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#B4B2A9] uppercase tracking-wider">{col.label}</span>
                  <span className="text-[13px] text-[#2C2C2A] leading-snug">
                    {cellVal(null, response.data?.[col.id])}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {sections.map(section => (
            <div key={section.id}>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                style={{ color: section.color, borderColor: section.color + "40" }}
              >
                {section.label}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {(section.fields || []).map(field => (
                  <div key={field.id} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-[#B4B2A9] uppercase tracking-wider">{field.label}</span>
                    <span className="text-[13px] text-[#2C2C2A] leading-snug">
                      {cellVal(field, response.data?.[field.id])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

export default function FormReport({ form, state, customSections, onBack, onAdd, onAddNew }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [viewRow, setViewRow]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllResponsesByStateAndForm(state, form.formId)
      .then(all => { if (!cancelled) setResponses(Array.isArray(all) ? all : []); })
      .catch(() => { if (!cancelled) setResponses([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [state, form.formId]);

  // Derived approval state from individual records
  const hasApproved = responses.some(r => r.approvalStatus === "approved");
  const hasRejected = responses.some(r => r.approvalStatus === "rejected");
  const allApproved = responses.length > 0 && responses.every(r => r.approvalStatus === "approved");

  const allSections = getFormSections(form, customSections || []);
  const hasAny = responses.length > 0;

  const sectionCols = allSections.flatMap(section =>
    (section.fields || []).map(field => ({
      ...field,
      sectionColor: section.color || "#185FA5",
      sectionLabel: section.label,
    }))
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-ga-muted">
        Loading report…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="mb-2 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-ga-muted hover:text-ga-ink"
          >
            ← All Forms
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-serif text-xl font-extrabold text-ga-ink">{form.name}</h1>
            {allApproved ? (
              <span className="rounded-full bg-[#E1F5EE] px-[9px] py-0.5 text-[10px] font-bold text-ga-green">
                ✅ All Approved
              </span>
            ) : hasApproved ? (
              <span className="rounded-full bg-[#E6F1FB] px-[9px] py-0.5 text-[10px] font-bold text-[#185FA5]">
                ✅ Partially Approved
              </span>
            ) : hasRejected ? (
              <span className="rounded-full bg-[#FEE8E8] px-[9px] py-0.5 text-[10px] font-bold text-[#A32D2D]">
                ❌ Rejected by Admin
              </span>
            ) : hasAny ? (
              <span className="rounded-full bg-[#E1F5EE] px-[9px] py-0.5 text-[10px] font-bold text-ga-green">
                ✓ Submitted
              </span>
            ) : (
              <span className="rounded-full bg-[#FAEEDA] px-[9px] py-0.5 text-[10px] font-bold text-ga-amber">
                ⏳ Pending
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-ga-muted">
            {form.formId} · Survey Year: {form.surveyYear}
          </p>
          {form.description && (
            <p className="mt-1 max-w-[540px] text-[13px] leading-relaxed text-ga-body">{form.description}</p>
          )}
        </div>

        {!hasAny && (
          <button
            onClick={() => onAdd(null)}
            className="cursor-pointer shrink-0 flex items-center gap-2 rounded-lg bg-ga-blue px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-opacity border-none"
          >
            + Add Response
          </button>
        )}

      </div>

      {/* Banners — based on aggregate record-level approval status */}
      {allApproved && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#9FE1CB] bg-[#E1F5EE] px-5 py-4">
          <span className="text-xl shrink-0">✅</span>
          <div>
            <div className="text-[13px] font-bold text-ga-green">All records have been approved by the Admin</div>
            <div className="text-[12px] text-ga-green mt-0.5 opacity-80">No further edits are allowed on approved records.</div>
          </div>
        </div>
      )}
      {!allApproved && hasApproved && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#9FE1CB] bg-[#E1F5EE] px-5 py-4">
          <span className="text-xl shrink-0">✅</span>
          <div>
            <div className="text-[13px] font-bold text-ga-green">Some records have been approved by the Admin</div>
            <div className="text-[12px] text-ga-green mt-0.5 opacity-80">Approved records are locked. Pending or rejected records can still be edited.</div>
          </div>
        </div>
      )}
      {hasRejected && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#F5B8B8] bg-[#FEF2F2] px-5 py-4">
          <span className="text-xl shrink-0">❌</span>
          <div>
            <div className="text-[13px] font-bold text-[#A32D2D]">Some records have been rejected by the Admin</div>
            <div className="text-[12px] text-[#A32D2D] mt-0.5 opacity-80">Please review and update the rejected records, then resubmit.</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAny ? (
        <div className="overflow-hidden rounded-2xl border border-ga-border bg-white">
          <div className="flex items-center justify-between border-b border-ga-border bg-ga-cream px-6 py-4">
            <h2 className="font-bold text-ga-ink">Form Response</h2>
            <span className="text-[12px] text-ga-muted">0 records</span>
          </div>
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ga-cream text-3xl">📋</div>
            <p className="mb-1 text-[14px] font-semibold text-ga-ink">No submission yet</p>
            <p className="text-[13px] text-ga-muted">
              Click "+ Add Response" at the top right to open the form and submit your data.
            </p>
          </div>
        </div>
      ) : (
        /* ── Unified flat table ── */
        <div className="overflow-hidden rounded-2xl border border-[#E8E6DF] bg-white shadow-sm">
          {/* Table header bar */}
          <div className="flex items-center justify-between border-b border-[#E8E6DF] bg-[#F7F5EF] px-5 py-3">
            <div className="text-sm font-bold text-[#2C2C2A]">Submitted Responses</div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#888780]">
                {responses.length} record{responses.length !== 1 ? "s" : ""}
              </span>

              {/* Add New Record — always visible; officer can always add new records */}
              <button
                onClick={() => onAddNew?.()}
                className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#154e8a] transition-colors border-none"
              >
                + Add New Record
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: `${Math.max(900, 260 + sectionCols.length * 150)}px` }}
            >
              <thead>
                <tr className="border-b border-[#E8E6DF] bg-[#F7F5EF]">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">
                    Actions
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">
                    State
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">
                    Submitted On
                  </th>
                  {FIXED_COLS.map(col => (
                    <th
                      key={col.id}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  {sectionCols.map(col => (
                    <th
                      key={col.id}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: col.sectionColor }}
                      title={col.sectionLabel}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((resp, i) => (
                  <tr
                    key={resp.id}
                    className="border-b border-[#F1EFE8] hover:bg-[#FAFAF8] transition-colors"
                  >
                    {/* Actions — first column */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {/* Edit disabled only when THIS record is approved */}
                        {resp.approvalStatus === "approved" ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F1EFE8] px-2.5 py-1.5 text-[11px] font-semibold text-[#B4B2A9] cursor-not-allowed whitespace-nowrap select-none" title="Approved — cannot edit">
                            <PencilIcon />
                            Edit
                          </span>
                        ) : (
                          <button
                            onClick={() => onAdd(resp)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#E6F1FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors cursor-pointer border-none whitespace-nowrap"
                          >
                            <PencilIcon />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => setViewRow(resp)}
                          className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#DDD9D0] px-2.5 py-1.5 text-[11px] font-semibold text-[#5F5E5A] hover:bg-[#F7F5EF] transition-colors cursor-pointer border-solid whitespace-nowrap"
                        >
                          View
                        </button>
                      </div>
                    </td>

                    {/* # */}
                    <td className="px-4 py-3.5 text-[#888780] text-xs">{i + 1}</td>

                    {/* State chip */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[10px] font-semibold text-[#185FA5]">
                        {resp.state || "—"}
                      </span>
                    </td>

                    {/* Per-record approval badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {resp.approvalStatus === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E1F5EE] px-2.5 py-0.5 text-[10px] font-bold text-[#0F6E56]">✅ Approved</span>
                      )}
                      {resp.approvalStatus === "rejected" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE8E8] px-2.5 py-0.5 text-[10px] font-bold text-[#A32D2D]">❌ Rejected</span>
                      )}
                      {(resp.approvalStatus === "pending" || !resp.approvalStatus) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FAEEDA] px-2.5 py-0.5 text-[10px] font-bold text-[#854F0B]">⏳ Pending</span>
                      )}
                    </td>

                    {/* Submitted On */}
                    <td className="px-4 py-3.5 text-[#888780] text-xs whitespace-nowrap">
                      {fmtDate(resp.submittedAt)}
                    </td>

                    {/* Fixed submission fields */}
                    {FIXED_COLS.map(col => (
                      <td key={col.id} className="px-4 py-3.5 text-[#5F5E5A] text-xs max-w-[180px]">
                        <div className="truncate" title={cellVal(null, resp.data?.[col.id])}>
                          {cellVal(null, resp.data?.[col.id])}
                        </div>
                      </td>
                    ))}

                    {/* Section field values */}
                    {sectionCols.map(col => (
                      <td key={col.id} className="px-4 py-3.5 text-[#5F5E5A] text-xs max-w-[180px]">
                        <div className="truncate" title={cellVal(col, resp.data?.[col.id])}>
                          {cellVal(col, resp.data?.[col.id])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {viewRow && (
        <DetailModal
          response={viewRow}
          sections={allSections}
          onClose={() => setViewRow(null)}
        />
      )}
    </div>
  );
}
