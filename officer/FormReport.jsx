import { useState, useEffect } from "react";
import { getAllResponsesByStateAndForm, duplicateResponseRecord } from "../store.js";
import { getFormSections, SUBMISSION_FIELDS } from "../formSchema.js";

function formatValue(field, value) {
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

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const actionBtnCls =
  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-ga-muted transition-colors hover:bg-ga-cream hover:text-ga-ink disabled:opacity-40 disabled:cursor-not-allowed";
const thCls =
  "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted bg-ga-cream whitespace-nowrap";
const tdCls = "px-3 py-3 text-[13px] text-ga-ink";

function SectionTable({ section, responses, onEdit, onDuplicate, duplicatingId }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ga-border bg-white">
      <div
        className="flex items-center gap-2.5 border-b border-ga-border px-5 py-3"
        style={{ backgroundColor: section.bg }}
      >
        <div className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ backgroundColor: section.color }} />
        <span className="text-sm font-bold" style={{ color: section.color }}>{section.label}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ga-border">
              <th className={`${thCls} w-20`}>ACTIONS</th>
              <th className={thCls}>S.NO</th>
              {section.fields.map(f => (
                <th key={f.id} className={thCls}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map((resp, idx) => (
              <tr key={resp.id} className="border-t border-ga-border hover:bg-ga-cream/30 transition-colors">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button className={actionBtnCls} title="Edit" onClick={() => onEdit(resp)} disabled={!!duplicatingId}>
                      <PencilIcon />
                    </button>
                    <button className={actionBtnCls} title="Duplicate row" onClick={() => onDuplicate(resp.id)} disabled={!!duplicatingId}>
                      {duplicatingId === resp.id
                        ? <span className="text-[10px] animate-pulse">…</span>
                        : <CopyIcon />}
                    </button>
                  </div>
                </td>
                <td className={`${tdCls} text-ga-muted`}>{idx + 1}</td>
                {section.fields.map(f => (
                  <td key={f.id} className={tdCls}>{formatValue(f, resp.data[f.id])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubmissionTable({ responses, onEdit, onDuplicate, duplicatingId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-ga-border">
            <th className={`${thCls} w-20`}>ACTIONS</th>
            <th className={thCls}>S.NO</th>
            {SUBMISSION_FIELDS.map(f => (
              <th key={f.id} className={thCls}>{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((resp, idx) => (
            <tr key={resp.id} className="border-t border-ga-border hover:bg-ga-cream/30 transition-colors">
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <button className={actionBtnCls} title="Edit" onClick={() => onEdit(resp)} disabled={!!duplicatingId}>
                    <PencilIcon />
                  </button>
                  <button className={actionBtnCls} title="Duplicate row" onClick={() => onDuplicate(resp.id)} disabled={!!duplicatingId}>
                    {duplicatingId === resp.id
                      ? <span className="text-[10px] animate-pulse">…</span>
                      : <CopyIcon />}
                  </button>
                </div>
              </td>
              <td className={`${tdCls} text-ga-muted`}>{idx + 1}</td>
              {SUBMISSION_FIELDS.map(f => (
                <td key={f.id} className={tdCls}>{formatValue(f, resp.data[f.id])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FormReport({ form, state, customSections, onBack, onAdd }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const load = async () => {
    try {
      const all = await getAllResponsesByStateAndForm(state, form.formId);
      setResponses(Array.isArray(all) ? all : []);
    } catch {
      setResponses([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const all = await getAllResponsesByStateAndForm(state, form.formId);
        if (!cancelled) setResponses(Array.isArray(all) ? all : []);
      } catch {
        if (!cancelled) setResponses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [state, form.formId]);

  const handleDuplicate = async (responseId) => {
    setDuplicatingId(responseId);
    try {
      const newResp = await duplicateResponseRecord(responseId);
      // Insert the duplicate immediately after the source row
      setResponses(prev => {
        const idx = prev.findIndex(r => r.id === responseId);
        const next = [...prev];
        next.splice(idx + 1, 0, newResp);
        return next;
      });
    } catch (err) {
      console.error("Duplicate failed:", err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const allSections = getFormSections(form, customSections || []);
  const hasAny = responses.length > 0;

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
            {hasAny ? (
              <span className="rounded-full bg-[#E1F5EE] px-[9px] py-0.5 text-[10px] font-bold text-ga-green">✓ Submitted</span>
            ) : (
              <span className="rounded-full bg-[#FAEEDA] px-[9px] py-0.5 text-[10px] font-bold text-ga-amber">⏳ Pending</span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-ga-muted">{form.formId} · Survey Year: {form.surveyYear}</p>
          {form.description && (
            <p className="mt-1 max-w-[540px] text-[13px] leading-relaxed text-ga-body">{form.description}</p>
          )}
        </div>

        {!hasAny && (
          <button
            onClick={() => onAdd(null)}
            className="cursor-pointer shrink-0 flex items-center gap-2 rounded-lg bg-ga-blue px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
          >
            + Add Response
          </button>
        )}
      </div>

      {!hasAny ? (
        <div className="overflow-hidden rounded-2xl border border-ga-border bg-white">
          <div className="flex items-center justify-between border-b border-ga-border bg-ga-cream px-6 py-4">
            <h2 className="font-bold text-ga-ink">Form Response</h2>
            <span className="text-[12px] text-ga-muted">0 records</span>
          </div>
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ga-cream text-3xl">📋</div>
            <p className="mb-1 text-[14px] font-semibold text-ga-ink">No submission yet</p>
            <p className="mb-6 text-[13px] text-ga-muted">Click "Add Response" to open the form and submit your data.</p>
            <button
              onClick={() => onAdd(null)}
              className="cursor-pointer rounded-lg bg-ga-blue px-6 py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
            >
              + Add Response
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {allSections.map(section => (
            <SectionTable
              key={section.id}
              section={section}
              responses={responses}
              onEdit={(resp) => onAdd(resp)}
              onDuplicate={handleDuplicate}
              duplicatingId={duplicatingId}
            />
          ))}

          <div className="overflow-hidden rounded-2xl border border-[#185FA533] bg-white">
            <div className="flex items-center gap-2.5 border-b border-[#185FA522] bg-[#E6F1FB] px-5 py-3">
              <div className="h-[10px] w-[10px] shrink-0 rounded-full bg-ga-blue" />
              <span className="text-sm font-bold text-ga-blue">Submission Details</span>
            </div>
            <SubmissionTable
              responses={responses}
              onEdit={(resp) => onAdd(resp)}
              onDuplicate={handleDuplicate}
              duplicatingId={duplicatingId}
            />
            {responses[0]?.submittedAt && (
              <div className="border-t border-ga-border bg-ga-cream/40 px-5 py-3 text-[12px] text-ga-muted">
                First submitted on{" "}
                {new Date(responses[0].submittedAt).toLocaleString("en-IN", {
                  dateStyle: "long", timeStyle: "short",
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
