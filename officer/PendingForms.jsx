import { useState, useEffect } from "react";
import { getResponseByStateAndForm, getDraftResponse } from "../store.js";
import FormView from "./FormView.jsx";
import FormReport from "./FormReport.jsx";
import NoFormsWindow from "./NoFormsWindow.jsx";

const SECTIONS_META = {
  ifmis:    { color: "#185FA5", bg: "#E6F1FB" },
  ehrms:    { color: "#0F6E56", bg: "#E1F5EE" },
  wamis:    { color: "#854F0B", bg: "#FAEEDA" },
  evoucher: { color: "#533AB7", bg: "#EEEDFE" },
};

const SECTION_LABELS = { ifmis: "IFMIS", ehrms: "e-HRMS", wamis: "WAMIS", evoucher: "e-Voucher" };

export default function PendingForms({ state, forms, customSections, onLogout }) {
  const [activeForm, setActiveForm] = useState(null);
  const [showFill, setShowFill] = useState(false);
  const [editResponse, setEditResponse] = useState(null); // response to edit, or null for new
  const [forceNew, setForceNew] = useState(false); // true = open blank form, always POST
  const [reportKey, setReportKey] = useState(0);
  const [formStatus, setFormStatus] = useState({});

  const stateForms = (forms || []).filter(f =>
    f.status === "published" &&
    f.states &&
    f.states.some(s => s.toLowerCase() === state.toLowerCase())
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!state) {
        return;
      }

      const status = {};
      await Promise.all(
        stateForms.map(async (f) => {
          try {
            const [existing, draft] = await Promise.all([
              getResponseByStateAndForm(state, f.formId),
              getDraftResponse(state, f.formId),
            ]);
            status[f.id] = { submitted: !!existing, draft: !!draft && !existing };
          } catch (err) {
            if (!err.suppressLog) {
              console.error(`Failed to load status for form ${f.formId}:`, err);
            }
            if (err.status === 403) {
              onLogout();
            }
            status[f.id] = { submitted: false, draft: false };
          }
        })
      );
      if (!cancelled) setFormStatus(status);
    })();
    return () => { cancelled = true; };
  }, [state, forms, onLogout]);

  if (activeForm && showFill) {
    return (
      <FormView
        form={activeForm}
        state={state}
        customSections={customSections || []}
        editResponse={editResponse}
        forceNew={forceNew}
        onBack={() => { setShowFill(false); setEditResponse(null); setForceNew(false); setReportKey(k => k + 1); }}
      />
    );
  }

  if (activeForm) {
    return (
      <FormReport
        key={reportKey}
        form={activeForm}
        state={state}
        customSections={customSections || []}
        onBack={() => { setActiveForm(null); setShowFill(false); setEditResponse(null); setForceNew(false); }}
        onAdd={(resp) => { setEditResponse(resp); setForceNew(false); setShowFill(true); }}
        onAddNew={() => { setEditResponse(null); setForceNew(true); setShowFill(true); }}
      />
    );
  }

  const pendingForms = stateForms.filter(f => {
    const st = formStatus[f.id] || {};
    return !st.submitted;
  });

  const submittedForms = stateForms.filter(f => {
    const st = formStatus[f.id] || {};
    return st.submitted;
  });

  if (pendingForms.length === 0 && submittedForms.length === 0) {
    return <NoFormsWindow state={state} onLogout={onLogout} />;
  }

  return (
    <div className="flex-1 flex">
      {/* Main content - Pending forms */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {pendingForms.length === 0 ? (
          <div className="mx-auto max-w-[720px]">
            <div className="mb-7">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-ga-faint">All Forms Completed</div>
              <h2 className="mb-1.5 mt-0 font-serif text-xl font-extrabold text-ga-ink">
                {state} — All assigned forms have been submitted
              </h2>
              <div className="text-[13px] text-ga-muted">Great job! You can view your submitted forms in the sidebar.</div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[720px]">
            <div className="mb-7">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-ga-faint">Pending Survey Forms</div>
              <h2 className="mb-1.5 mt-0 font-serif text-xl font-extrabold text-ga-ink">
                {state} — {pendingForms.length} form{pendingForms.length > 1 ? "s" : ""} pending
              </h2>
              <div className="text-[13px] text-ga-muted">Please complete all assigned survey forms at the earliest.</div>
            </div>

            {pendingForms.map(f => {
              const st = formStatus[f.id] || {};
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveForm(f)}
                  className="mb-4 cursor-pointer rounded-[14px] border border-ga-border bg-white p-5 px-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-[#B5D4F4] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center gap-2.5">
                        <span className="text-[15px] font-bold text-ga-ink">{f.name}</span>
                        {st.draft ? (
                          <span className="rounded-full bg-[#EEEDFE] px-[9px] py-0.5 text-[10px] font-bold text-ga-purple">💾 DRAFT SAVED</span>
                        ) : (
                          <span className="rounded-full bg-[#FAEEDA] px-[9px] py-0.5 text-[10px] font-bold text-ga-amber">⏳ PENDING</span>
                        )}
                      </div>
                      <div className="mb-2 text-xs text-ga-muted">{f.formId} · Survey Year: {f.surveyYear}</div>
                      {f.description && <div className="text-xs leading-normal text-ga-body">{f.description}</div>}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {f.sections.map(sid => {
                          const meta = SECTIONS_META[sid];
                          if (!meta) return null;
                          return (
                            <span key={sid} className={`rounded-full px-[9px] py-0.5 text-[10px] font-semibold text-[${meta.color}] bg-[${meta.bg}]`}>
                              {SECTION_LABELS[sid]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="shrink-0 pt-1 text-[22px] text-ga-line">›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar - Submitted Forms */}
      {submittedForms.length > 0 && (
        <div className="w-80 border-l border-ga-border bg-white overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-ga-border bg-[#F7F5EF]">
            <h3 className="text-sm font-bold text-ga-ink">Submitted Forms</h3>
            <div className="text-xs text-ga-muted mt-1">{submittedForms.length} form{submittedForms.length > 1 ? "s" : ""} completed</div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-ga-border">
            {submittedForms.map(f => {
              const st = formStatus[f.id] || {};
              return (
                <div
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveForm(f)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setActiveForm(f);
                    }
                  }}
                  className="p-4 cursor-pointer hover:bg-[#F7F5EF] transition-colors"
                >
                  <div className="text-sm font-bold text-ga-ink mb-1">{f.name}</div>
                  <div className="text-xs text-ga-muted mb-2">{f.formId}</div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#E1F5EE] px-[9px] py-0.5 text-[10px] font-bold text-ga-green">✓ Submitted</span>
                    {f.sections.map(sid => {
                      const meta = SECTIONS_META[sid];
                      if (!meta) return null;
                      return (
                        <span key={sid} className={`rounded-full px-[9px] py-0.5 text-[10px] font-semibold text-[${meta.color}] bg-[${meta.bg}]`}>
                          {SECTION_LABELS[sid]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
