import { useState } from "react";
import Badge from "../components/Badge.jsx";
import MultiStateSelect from "../components/MultiStateSelect.jsx";
import CreateSectionWizard from "./wizard/CreateSectionWizard.jsx";
import { formatDateDdMmYyyy } from "../dateUtils.js";

function SectionToggleCard({ enabled, onChange, disabled, customSections, onAddCustom, onRemoveCustom }) {
  const [showWizard, setShowWizard] = useState(false);

  const toggle = (id) => {
    if (disabled) return;
    onChange(enabled.includes(id) ? enabled.filter(x => x !== id) : [...enabled, id]);
  };

  const handleAdd = (sec) => { onAddCustom(sec); onChange([...enabled, sec.id]); };
  const handleRemove = (id) => { onRemoveCustom(id); onChange(enabled.filter(x => x !== id)); };
  const allEmpty = customSections.length === 0;

  return (
    <>
      {showWizard && <CreateSectionWizard onClose={() => setShowWizard(false)} onAdd={handleAdd} />}
      <div className="mb-[18px] overflow-hidden rounded-xl border border-ga-border bg-white">
        <div className="flex items-center justify-between border-b border-ga-surface bg-[#FAFAF8] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#E1F5EE] text-sm">☑️</div>
            <span className="text-[13px] font-bold text-ga-ink">Sections Included</span>
            <span className="text-[11px] text-ga-muted">({enabled.length}/{customSections.length} selected)</span>
          </div>
          {!disabled && (
            <button onClick={() => setShowWizard(true)} className="flex cursor-pointer items-center gap-[5px] rounded-md border-[1.5px] border-ga-blue bg-[#E6F1FB] px-3.5 py-1.5 text-[11px] font-bold text-ga-blue">
              ＋ Create Section
            </button>
          )}
        </div>

        {allEmpty && (
          <div className="px-5 py-7 text-center">
            <div className="mb-2 text-[28px]">📋</div>
            <div className="mb-1 text-[13px] font-semibold text-ga-body">No sections yet</div>
            {!disabled && (
              <button onClick={() => setShowWizard(true)} className="cursor-pointer rounded-lg border-[1.5px] border-ga-blue bg-[#E6F1FB] px-[18px] py-2 text-xs font-bold text-ga-blue">
                ＋ Create Your First Section
              </button>
            )}
          </div>
        )}

        {!allEmpty && (
          <div className="grid grid-cols-2 gap-2.5 p-4 px-5">
            {customSections.map(s => {
              const on = enabled.includes(s.id);
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-2.5 rounded-lg border-[1.5px] p-2.5 px-3.5 transition-all duration-[130ms] ${
                    on ? `bg-[${s.bg}] border-[${s.color}55]` : "border-ga-border bg-[#FAFAF8]"
                  }`}
                >
                  <div
                    onClick={() => toggle(s.id)}
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-all duration-[120ms] ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    } ${on ? `border-[${s.color}] bg-[${s.color}]` : "border-ga-line bg-white"}`}
                  >
                    {on && <span className="text-[11px] text-white">✓</span>}
                  </div>
                  <div onClick={() => toggle(s.id)} className={`flex-1 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                    <div className={`text-xs font-semibold ${on ? `text-[${s.color}]` : "text-[#444441]"}`}>{s.label}</div>
                    <div className="text-[10px] text-ga-muted">{s.columns?.length || 0} columns</div>
                  </div>
                  {!disabled && (
                    <button onClick={() => handleRemove(s.id)} className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#FCEBEB] text-sm text-ga-error">×</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function FieldPreview({ label, type, options, required }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-2 border-b border-ga-surface/50 py-2">
      <div className="text-xs font-semibold text-ga-body">
        {label}{required && <span className="ml-0.5 text-ga-error">*</span>}
      </div>
      <div className="rounded-md bg-ga-surface px-2.5 py-1 text-[11px] italic text-ga-muted">
        {type}{options ? ` — ${options}` : ""}
      </div>
    </div>
  );
}

export default function Editor({ form, onUpdate, onSaveDraft, onSendReview, onPublish, onClone, customSections, onAddCustom, onRemoveCustom }) {
  const isLocked = ["published", "superseded", "archived"].includes(form.status);
  const [publishConfirm, setPublishConfirm] = useState(false);

  const canPublish = form.states.length > 0 && form.sections.length > 0 && !isLocked && form.status === "review";
  const canReview  = form.sections.length > 0 && !isLocked && form.status === "draft";

  return (
    <div className="w-full max-w-[860px] flex-1 overflow-y-auto p-7 px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ga-muted">Form Builder · {form.formId}</div>
          <h1 className="m-0 font-serif text-[22px] font-extrabold text-ga-ink">{form.name}</h1>
          <div className="mt-1 text-xs text-ga-muted">
            Created {typeof form.createdAt === "string" && form.createdAt.includes("T") ? formatDateDdMmYyyy(form.createdAt) : form.createdAt} · Last saved {typeof form.savedAt === "string" && form.savedAt.includes("T") ? new Date(form.savedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : form.savedAt}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge status={form.status} />
          {isLocked && <button onClick={() => onClone(form.id)} className="cursor-pointer rounded-lg border-[1.5px] border-ga-line bg-ga-surface px-4 py-2 text-xs font-bold text-[#444441]">🔀 Clone Version</button>}
          {!isLocked && (
            <>
              <button onClick={() => onSaveDraft(form.id)} className="cursor-pointer rounded-lg border-[1.5px] border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-xs font-bold text-ga-purple">💾 Save Draft</button>
              {form.status === "draft" && (
                <button
                  onClick={() => canReview && onSendReview(form.id)}
                  disabled={!canReview}
                  className={`rounded-lg border-[1.5px] px-4 py-2 text-xs font-bold ${
                    canReview
                      ? "cursor-pointer border-[#FAC775] bg-[#FAEEDA] text-ga-amber"
                      : "cursor-not-allowed border-ga-line bg-ga-surface text-ga-faint"
                  }`}
                >
                  🔍 Send for Review
                </button>
              )}
              {form.status === "review" && (
                <button
                  onClick={() => { if (!publishConfirm) { setPublishConfirm(true); return; } onPublish(form.id); setPublishConfirm(false); }}
                  disabled={!canPublish}
                  className={`rounded-lg border-none px-[18px] py-2 text-xs font-bold transition-colors duration-150 ${
                    canPublish
                      ? publishConfirm
                        ? "cursor-pointer bg-ga-error text-white"
                        : "cursor-pointer bg-ga-green text-white"
                      : "cursor-not-allowed bg-ga-line text-ga-muted"
                  }`}
                >
                  {publishConfirm ? "⚠️ Confirm Publish?" : "🚀 Publish Form"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status hints */}
      {form.status === "draft" && (
        <div className="mb-[18px] flex items-center gap-2 rounded-[10px] border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2.5 text-xs text-ga-purple">
          ✏️ <strong>Draft</strong> — Fill sections &amp; states, then click &quot;Send for Review&quot;
        </div>
      )}
      {form.status === "review" && (
        <div className="mb-[18px] flex items-center gap-2 rounded-[10px] border border-[#FAC775] bg-[#FAEEDA] px-4 py-2.5 text-xs text-ga-amber">
          🔍 <strong>In Review</strong> — Assign states &amp; click &quot;Publish Form&quot; to go live
        </div>
      )}
      {isLocked && (
        <div className="mb-[18px] flex items-center gap-2.5 rounded-[10px] border border-[#FAC775] bg-[#FAEEDA] px-4 py-2.5 text-[13px] font-medium text-[#633806]">
          🔒 <strong>{form.status}</strong> — Cannot edit. Use &quot;Clone Version&quot; to create a new editable copy.
        </div>
      )}

      {/* Form Info */}
      <div className="mb-[18px] overflow-hidden rounded-xl border border-ga-border bg-white">
        <div className="flex items-center gap-2.5 border-b border-ga-surface bg-[#FAFAF8] px-5 py-3.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#E6F1FB] text-sm">ℹ️</div>
          <span className="text-[13px] font-bold text-ga-ink">Form Information</span>
        </div>
        <div className="grid grid-cols-2 gap-4 p-[18px] px-5">
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ga-muted">Form Title *</div>
            <input value={form.name} disabled={isLocked} onChange={e => onUpdate(form.id, { name: e.target.value })} className={`box-border w-full rounded-lg border-[1.5px] border-ga-line px-[13px] py-[9px] text-[13px] text-ga-ink ${isLocked ? "bg-ga-surface" : "bg-white"}`} />
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ga-muted">Survey Year</div>
            <input value={form.surveyYear} disabled={isLocked} onChange={e => onUpdate(form.id, { surveyYear: e.target.value })} className={`box-border w-full rounded-lg border-[1.5px] border-ga-line px-[13px] py-[9px] text-[13px] text-ga-ink ${isLocked ? "bg-ga-surface" : "bg-white"}`} />
          </div>
          <div className="col-span-2">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ga-muted">Description / Instructions</div>
            <textarea value={form.description} disabled={isLocked} onChange={e => onUpdate(form.id, { description: e.target.value })} rows={2} className={`box-border w-full resize-y rounded-lg border-[1.5px] border-ga-line px-[13px] py-[9px] font-inherit text-[13px] text-ga-ink ${isLocked ? "bg-ga-surface" : "bg-white"}`} />
          </div>
        </div>
      </div>

      {/* State Assignment */}
      <div className={`mb-[18px] overflow-visible rounded-xl border-[1.5px] bg-white ${form.states.length > 0 ? "border-[#9FE1CB]" : "border-ga-border"}`}>
        <div className={`flex items-center gap-2.5 border-b border-ga-surface px-5 py-3.5 ${form.states.length > 0 ? "bg-[#E1F5EE]" : "bg-[#FAFAF8]"}`}>
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#E1F5EE] text-sm">📍</div>
          <span className="text-[13px] font-bold text-ga-ink">State Assignment</span>
          <span className={`ml-auto text-xs font-semibold ${form.states.length > 0 ? "text-ga-green" : "text-ga-error"}`}>
            {form.states.length > 0 ? `✓ ${form.states.length} state${form.states.length > 1 ? "s" : ""} selected` : "⚠ No state — Publish disabled"}
          </span>
        </div>
        <div className="px-5 py-4">
          <MultiStateSelect value={form.states} onChange={val => onUpdate(form.id, { states: val })} disabled={isLocked} />
        </div>
      </div>

      {/* Sections */}
      <SectionToggleCard enabled={form.sections} onChange={val => onUpdate(form.id, { sections: val })} disabled={isLocked} customSections={customSections} onAddCustom={onAddCustom} onRemoveCustom={onRemoveCustom} />

      {/* Field Preview */}
      {form.sections.length > 0 && customSections.filter(s => form.sections.includes(s.id)).length > 0 && (
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-ga-faint">Field Preview — Enabled Sections</div>
          {customSections.filter(s => form.sections.includes(s.id)).map(s => (
            <div key={s.id} className="mb-3.5 overflow-hidden rounded-xl border border-ga-border bg-white">
              <div className="flex items-center gap-2.5 border-b border-ga-surface bg-[#FAFAF8] px-5 py-3">
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full bg-[${s.color}]`} />
                <span className="text-[13px] font-bold text-ga-ink">{s.label}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-[${s.color}] bg-[${s.bg}]`}>
                  CUSTOM · {s.columns?.length} fields
                </span>
              </div>
              <div className="px-5 pb-3 pt-1">
                {s.columns?.map((col, i) => (
                  <div key={i} className="grid grid-cols-[160px_1fr] items-center gap-2 border-b border-ga-surface/50 py-2">
                    <div className="text-xs font-semibold text-ga-body">{col.name}</div>
                    <input readOnly value="" placeholder={col.placeholder} className="rounded-md border-[1.5px] border-dashed border-ga-line bg-[#FAFAF8] px-2.5 py-1.5 text-xs italic text-[#C0BEBA]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="mb-3.5 overflow-hidden rounded-xl border border-ga-border bg-white">
            <div className="flex items-center gap-2.5 border-b border-ga-surface bg-[#FAFAF8] px-5 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-ga-blue" />
              <span className="text-[13px] font-bold text-ga-ink">Submission Details</span>
              <span className="ml-auto rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-semibold text-ga-blue">Always Included</span>
            </div>
            <div className="px-5 pb-3 pt-1">
              {[{ label: "Officer Name", type: "Text Input", required: true }, { label: "Designation", type: "Text Input" }, { label: "Office / A&E Branch", type: "Text Input" }, { label: "Date of Submission", type: "Date Picker", required: true }, { label: "Email Address", type: "Email" }, { label: "Phone / Extension", type: "Tel Input" }, { label: "Additional Remarks", type: "Textarea", options: "max 1,000 chars" }].map((f, i) => <FieldPreview key={i} {...f} />)}
            </div>
          </div>
        </div>
      )}
      <div className="h-10" />
    </div>
  );
}
