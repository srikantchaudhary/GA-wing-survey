import { useState, useRef, useEffect } from "react";
import { getResponseByStateAndForm, saveResponse, updateResponse, getDraftResponse, saveDraftResponse, getStates } from "../store.js";
import { SUBMISSION_FIELDS, getFormSections } from "../formSchema.js";
import { getTodayIsoDate } from "../dateUtils.js";
import FormField from "./FormField.jsx";
import SubmitSuccessOverlay from "./SubmitSuccessOverlay.jsx";

function ProgressBar({ pct, barClass }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-[10px] bg-ga-border">
      <div
        className={`h-full rounded-[10px] transition-[width] duration-[400ms] ease-out ${barClass} w-[${Math.min(pct, 100)}%]`}
      />
    </div>
  );
}

export default function FormView({ form, state, customSections, onBack, editResponse, forceNew = false }) {
  const safeCustomSections = customSections || [];
  const safeForm = form || { sections: [], formId: '', name: '', surveyYear: '', description: '' };

  const [formData, setFormData]         = useState({ sub_date: getTodayIsoDate() });
  const [errors, setErrors]             = useState({});
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [existingResponseId, setExistingResponseId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const draftTimer = useRef();
  const todayIso = getTodayIsoDate();

  // Load the authoritative states list for any state-sourced dropdown fields.
  useEffect(() => {
    let mounted = true;
    getStates()
      .then(list => { if (mounted && list.length) setStates(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Replace options for fields that source their list from reference data.
  const resolveField = (f) => {
    let resolved = f.optionsSource === "states" && states.length ? { ...f, options: states } : f;
    if (f.id === "sub_date") {
      resolved = { ...resolved, disabled: true };
    }
    return resolved;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Force-new: skip all lookups, open a completely blank form
        if (forceNew) {
          if (!cancelled) {
            setFormData({ sub_date: todayIso });
            setLoading(false);
          }
          return;
        }

        // If a specific response was passed for editing, pre-load it directly
        if (editResponse) {
          if (!cancelled) {
            setExistingResponseId(editResponse.id);
            setFormData({
              ...editResponse.data,
              sub_date: editResponse.data?.sub_date || editResponse.submittedAt?.slice(0, 10) || todayIso,
            });
            setHasExistingSubmission(true);
            setLoading(false);
          }
          return;
        }

        const [existing, savedDraft] = await Promise.all([
          getResponseByStateAndForm(state, safeForm.formId),
          getDraftResponse(state, safeForm.formId),
        ]);
        if (cancelled) return;
        if (existing) {
          setExistingResponseId(existing.id);
          setFormData({
            ...existing.data,
            sub_date: existing.data?.sub_date || existing.submittedAt?.slice(0, 10) || todayIso,
          });
          setHasExistingSubmission(true);
        } else if (savedDraft) {
          setFormData({ ...savedDraft.data, sub_date: todayIso });
          setDraftSavedAt(savedDraft.savedAt || null);
        } else {
          setFormData({ sub_date: todayIso });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [state, safeForm.formId, editResponse, forceNew]);

  const allSections = getFormSections(safeForm, safeCustomSections);

  const allFields = [
    ...allSections.flatMap(s => s.fields),
    ...SUBMISSION_FIELDS,
  ];

  const requiredFields  = allFields.filter(f => f.required);
  const filledCount     = allFields.filter(f => { const v = formData[f.id]; return v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true); }).length;
  const filledRequired  = requiredFields.filter(f => { const v = formData[f.id]; return v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true); });
  const progressPct     = allFields.length > 0 ? Math.round((filledCount / allFields.length) * 100) : 0;
  const requiredPct     = requiredFields.length > 0 ? Math.round((filledRequired.length / requiredFields.length) * 100) : 100;
  const isSubmitted     = hasExistingSubmission || submitted;
  const isExistingSubmission = hasExistingSubmission && !submitted;

  const setField = (id, val) => {
    const newData = { ...formData, [id]: val };
    setFormData(newData);
    setErrors(e => ({ ...e, [id]: undefined }));
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(async () => {
      try {
        await saveDraftResponse(state, safeForm.formId, newData);
        setDraftSavedAt(new Date().toISOString());
      } catch (err) {
        console.error(err);
      }
    }, 1500);
  };

  const validate = () => {
    const errs = {};
    requiredFields.forEach(f => {
      const v = formData[f.id];
      if (!v || v === "" || (Array.isArray(v) && v.length === 0)) errs[f.id] = "Ye field required hai";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const todayIso = getTodayIsoDate();
      const payload = { ...formData, sub_date: todayIso };
      if (existingResponseId) {
        // Edit — update the existing record, do not create a new one
        await updateResponse(existingResponseId, payload);
      } else {
        // First submission — create a new record
        const saved = await saveResponse({
          formId: safeForm.formId,
          formName: safeForm.name,
          state,
          surveyYear: safeForm.surveyYear,
          data: payload,
        });
        setExistingResponseId(saved?.id ?? null);
      }
      setFormData(d => ({ ...d, sub_date: todayIso }));
      setHasExistingSubmission(true);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit form. Please try again.");
    }
  };

  const formatDraft = (iso) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-ga-muted">
        Loading form…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden">

      {/* Left panel */}
      <div className="flex w-[220px] min-w-[220px] flex-col overflow-y-auto border-r border-ga-border bg-white p-[18px] px-3.5">
        <button onClick={onBack} className="mb-4 flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-1 py-1 text-xs font-semibold text-ga-muted">← All Forms</button>
        <div className="mb-0.5 text-xs font-bold leading-snug text-ga-ink">{safeForm.name}</div>
        <div className="mb-4 text-[11px] text-ga-muted">{safeForm.formId} · {safeForm.surveyYear}</div>

        <div className="mb-4 rounded-[10px] border border-ga-border bg-ga-cream p-3">
          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-ga-body">Progress</div>
          <div className="mb-2">
            <div className="mb-0.5 flex justify-between text-[11px] text-ga-muted">
              <span>Overall</span><span className="font-bold text-ga-blue">{progressPct}%</span>
            </div>
            <ProgressBar pct={progressPct} barClass="bg-ga-blue" />
          </div>
          <div>
            <div className="mb-0.5 flex justify-between text-[11px] text-ga-muted">
              <span>Required</span>
              <span className={`font-bold ${requiredPct === 100 ? "text-ga-green" : "text-ga-error"}`}>{filledRequired.length}/{requiredFields.length}</span>
            </div>
            <ProgressBar pct={requiredPct} barClass={requiredPct === 100 ? "bg-ga-green" : "bg-ga-error"} />
          </div>
          {draftSavedAt && !isSubmitted && <div className="mt-2 text-[11px] font-semibold text-ga-purple">💾 Draft saved at {formatDraft(draftSavedAt)}</div>}
          {isSubmitted && <div className="mt-2 text-[11px] font-semibold text-ga-green">✓ Submitted</div>}
        </div>

        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ga-faint">Jump To</div>
        {allSections.map(s => (
          <div
            key={s.id}
            onClick={() => document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-[5px] text-xs font-semibold text-[${s.color}]`}
          >
            <div className={`h-[7px] w-[7px] shrink-0 rounded-full bg-[${s.color}]`} />{s.label}
          </div>
        ))}
        <div
          onClick={() => document.getElementById("sec-submission")?.scrollIntoView({ behavior: "smooth" })}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-[5px] text-xs font-semibold text-ga-blue"
        >
          <div className="h-[7px] w-[7px] shrink-0 rounded-full bg-ga-blue" />Submission Details
        </div>
      </div>

      {/* Form Canvas */}
      <div className="max-w-[800px] flex-1 overflow-y-auto p-7 px-8">
        <div className="mb-[22px]">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ga-muted">
            Filling on behalf of: <span className="text-ga-blue">{state}</span>
          </div>
          <h2 className="mb-1.5 mt-0 font-serif text-xl font-extrabold text-ga-ink">{safeForm.name}</h2>
          {safeForm.description && (
            <div className="rounded-[10px] border border-ga-border bg-white px-4 py-2.5 text-[13px] leading-relaxed text-ga-body">{safeForm.description}</div>
          )}
          {isSubmitted && (
            <div className="mt-2.5 rounded-[10px] border border-[#9FE1CB] bg-[#E1F5EE] px-4 py-2.5 text-[13px] font-semibold text-ga-green">
              ✓ Submitted — you can still update the responses
            </div>
          )}
        </div>

        {allSections.map(s => {
          const fields = s.fields;
          return (
            <div key={s.id} id={`sec-${s.id}`} className={`mb-5 overflow-hidden rounded-[14px] border bg-white border-[${s.color}33]`}>
              <div className={`flex items-center gap-2.5 border-b px-[22px] py-3 border-[${s.color}22] bg-[${s.bg}]`}>
                <div className={`h-[11px] w-[11px] rounded-full bg-[${s.color}]`} />
                <span className={`text-sm font-bold text-[${s.color}]`}>{s.label}</span>
                {s.isCustom && (
                  <span className={`rounded-[10px] px-[7px] py-px text-[9px] font-bold text-white bg-[${s.color}]`}>CUSTOM</span>
                )}
              </div>
              <div className="px-[22px] py-5">
                {fields.map(f => <FormField key={f.id} field={resolveField(f)} value={formData[f.id]} onChange={val => setField(f.id, val)} error={errors[f.id]} disabled={false} />)}
              </div>
            </div>
          );
        })}

        <div id="sec-submission" className="mb-5 overflow-hidden rounded-[14px] border border-[#185FA533] bg-white">
          <div className="flex items-center gap-2.5 border-b border-[#185FA522] bg-[#E6F1FB] px-[22px] py-3">
            <div className="h-[11px] w-[11px] rounded-full bg-ga-blue" />
            <span className="text-sm font-bold text-ga-blue">Submission Details</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 px-[22px] py-5">
            {SUBMISSION_FIELDS.map(f => {
              // resolveField marks sub_date disabled, so the submission date is
              // fixed to the system date and cannot be changed by the officer.
              const rf = resolveField(f);
              return (
                <div key={f.id} className={rf.type === "textarea" ? "col-span-2" : ""}>
                  <FormField field={rf} value={formData[f.id]} onChange={val => setField(f.id, val)} error={errors[f.id]} disabled={false} />
                </div>
              );
            })}
          </div>
        </div>

        {!isSubmitted ? (
          <div className="mb-10 flex gap-3">
            <button onClick={async () => {
              try {
                await saveDraftResponse(state, safeForm.formId, formData);
                setDraftSavedAt(new Date().toISOString());
              } catch (err) {
                alert("Failed to save draft: " + (err.message || "Unknown error"));
              }
            }} className="cursor-pointer rounded-[10px] border-[1.5px] border-[#AFA9EC] bg-[#EEEDFE] px-[22px] py-[11px] text-[13px] font-bold text-ga-purple">💾 Save Draft</button>
            <button onClick={handleSubmit} className="flex-1 cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-ga-blue to-ga-green py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(24,95,165,0.25)]">Submit Form →</button>
          </div>
        ) : isExistingSubmission ? (
          <div className="mb-10 flex gap-3">
            <button onClick={handleSubmit} className="flex-1 cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-ga-blue to-ga-green py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(24,95,165,0.25)]">Update Form</button>
          </div>
        ) : (
          <div className="mb-10">
            <button onClick={onBack} className="cursor-pointer rounded-[10px] border-[1.5px] border-ga-line bg-ga-surface px-[22px] py-[11px] text-[13px] font-bold text-[#444441]">← Back to Forms</button>
          </div>
        )}
      </div>

      {showSuccess && <SubmitSuccessOverlay form={safeForm} state={state} onClose={() => setShowSuccess(false)} />}
    </div>
  );
}
