import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateDdMmYyyy } from "../dateUtils.js";
import {
  getDesignations,
  getNominations, saveNomination, deleteNomination, updateNomination,
  getMcaMkiRecords, saveMcaMkiRecord, deleteMcaMkiRecord, updateMcaMkiRecord,
} from "../store.js";
import { DESIGNATIONS } from "../constants.js";

const NOM_EMPTY = { name: "", designation: "", email: "", mobile: "" };
const MCA_EMPTY = { mcaDue: "", mcaAlloc: "", mcaComment: "", mkiDue: "", mkiAlloc: "", mkiComment: "" };

const SELECT_ARROW =
  "appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23888780%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_12px_center] bg-no-repeat pr-9";

const lbl = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-ga-muted";
const inp = "box-border w-full rounded-lg border-[1.5px] px-[13px] py-[9px] text-[13px] text-ga-ink outline-none transition-[border-color] duration-150";
const bdr = (e) => e ? "border-ga-error bg-[#FFF8F8]" : "border-ga-line bg-white";

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" />
      <path d="m19 6-.867 13.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 6Z" />
      <path d="m10 11 0 6M14 11l0 6M9 6l1-3h4l1 3" />
    </svg>
  );
}

function SortIcon({ active, dir }) {
  return (
    <span className="ml-1 inline-flex flex-col gap-[1px]">
      <svg width="7" height="4" viewBox="0 0 7 4" fill={active && dir === "asc" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2"><path d="M0.5 3.5L3.5 0.5L6.5 3.5" /></svg>
      <svg width="7" height="4" viewBox="0 0 7 4" fill={active && dir === "desc" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2"><path d="M0.5 0.5L3.5 3.5L6.5 0.5" /></svg>
    </span>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function DeleteConfirmModal({ onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF5F5]">
            <TrashIcon />
          </div>
          <h3 className="text-base font-bold text-ga-ink">Delete Record</h3>
          <p className="mt-2 text-[13px] text-ga-muted">Are you sure you want to delete this record? This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-ga-border bg-ga-cream px-6 py-4">
          <button onClick={onCancel} className="cursor-pointer rounded-lg border border-ga-line bg-white px-4 py-2 text-[13px] font-semibold text-ga-body hover:bg-ga-cream transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="cursor-pointer rounded-lg bg-ga-error px-5 py-2 text-[13px] font-bold text-white hover:opacity-90 transition-opacity">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Nomination Modal ──────────────────────────────────────────────────────────
function NomModal({ state, designations, record, onClose, onSave }) {
  const isEdit = !!record?.id;
  const [form, setForm] = useState(record
    ? { name: record.name, designation: record.designation, email: record.email, mobile: record.mobile }
    : NOM_EMPTY
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Employee name is required.";
    else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    else if (!/^[a-zA-Z\s.''-]+$/.test(form.name.trim())) e.name = "Name must contain letters only (no numbers or special characters).";
    if (!form.designation) e.designation = "Please select a designation.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address (e.g. name@domain.com).";
    if (!form.mobile.trim()) e.mobile = "Mobile number is required.";
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ ...form, state }, isEdit ? record.id : null);
      onClose();
    } catch (err) {
      setErrors(e => ({ ...e, _form: err.message || "Failed to save." }));
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ga-border px-6 py-4">
          <h2 className="text-base font-bold text-ga-ink">{isEdit ? "Edit Nomination" : "Add Nomination"}</h2>
          <button onClick={onClose} className="cursor-pointer rounded-md p-1 text-ga-muted hover:bg-ga-cream hover:text-ga-ink"><CloseIcon /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {/* State (fixed) */}
          <div>
            <label className={lbl}>State</label>
            <input type="text" value={state || ""} disabled className={`${inp} cursor-not-allowed bg-[#F2F2F0] text-ga-ink`} />
          </div>
          <div>
            <label className={lbl}>Employee Name <span className="text-ga-error">*</span></label>
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name" className={`${inp} ${bdr(errors.name)}`} />
            {errors.name && <p className="mt-1 text-[11px] text-ga-error">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Designation <span className="text-ga-error">*</span></label>
              <select value={form.designation} onChange={e => set("designation", e.target.value)} className={`${inp} ${SELECT_ARROW} ${bdr(errors.designation)} ${form.designation ? "text-ga-ink" : "text-ga-muted"}`}>
                <option value="">Select…</option>
                {designations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.designation && <p className="mt-1 text-[11px] text-ga-error">{errors.designation}</p>}
            </div>
            <div>
              <label className={lbl}>Email <span className="text-ga-error">*</span></label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="official@gov.in" className={`${inp} ${bdr(errors.email)}`} />
              {errors.email && <p className="mt-1 text-[11px] text-ga-error">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label className={lbl}>Mobile <span className="text-ga-error">*</span></label>
            <div className={`flex overflow-hidden rounded-lg border-[1.5px] ${errors.mobile ? "border-ga-error bg-[#FFF8F8]" : "border-ga-line bg-white"}`}>
              <span className="flex items-center border-r border-ga-line bg-ga-cream px-3 text-[13px] font-semibold text-ga-ink select-none">+91</span>
              <input type="tel" value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="XXXXXXXXXX" maxLength={10} className="flex-1 bg-transparent px-3 py-[9px] text-[13px] text-ga-ink outline-none" />
            </div>
            {errors.mobile && <p className="mt-1 text-[11px] text-ga-error">{errors.mobile}</p>}
          </div>
          {errors._form && <p className="text-[12px] text-ga-error">⚠ {errors._form}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-ga-border bg-ga-cream px-6 py-4">
          <button onClick={onClose} className="cursor-pointer rounded-lg border border-ga-line bg-white px-4 py-2 text-[13px] font-semibold text-ga-body">Cancel</button>
          <button onClick={submit} disabled={saving} className="cursor-pointer rounded-lg bg-ga-blue px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Apply Changes" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MCA / MKI Modal ───────────────────────────────────────────────────────────
function McaModal({ state, record, onClose, onSave }) {
  const isEdit = !!record?.id;
  const [form, setForm] = useState(record
    ? { mcaDue: record.mcaDue || "", mcaAlloc: record.mcaAlloc || "", mcaComment: record.mcaComment || "", mkiDue: record.mkiDue || "", mkiAlloc: record.mkiAlloc || "", mkiComment: record.mkiComment || "" }
    : MCA_EMPTY
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({ ...form, state }, isEdit ? record.id : null);
      onClose();
    } catch (err) {
      setErrors(e => ({ ...e, _form: err.message || "Failed to save." }));
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ga-border px-6 py-4">
          <h2 className="text-base font-bold text-ga-ink">{isEdit ? "Edit MCA / MKI Record" : "Add MCA / MKI Record"}</h2>
          <button onClick={onClose} className="cursor-pointer rounded-md p-1 text-ga-muted hover:bg-ga-cream hover:text-ga-ink"><CloseIcon /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* State (fixed) */}
          <div>
            <label className={lbl}>State</label>
            <input type="text" value={state || ""} disabled className={`${inp} cursor-not-allowed bg-[#F2F2F0] text-ga-ink`} />
          </div>
          {/* MCA and MKI side by side */}
          <div className="grid grid-cols-2 gap-5">
            {/* MCA */}
            <div className="space-y-3">
              <p className="border-b border-ga-border pb-2 text-sm font-bold text-ga-ink">MCA Fields</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Due Date</label>
                  <input type="date" value={form.mcaDue} onChange={e => set("mcaDue", e.target.value)} className={`${inp} border-ga-line bg-white`} />
                </div>
                <div>
                  <label className={lbl}>Actual Date</label>
                  <input type="date" value={form.mcaAlloc} onChange={e => set("mcaAlloc", e.target.value)} className={`${inp} border-ga-line bg-white`} />
                </div>
              </div>
              <div>
                <label className={lbl}>Reason of Delay if any.</label>
                <textarea value={form.mcaComment} onChange={e => set("mcaComment", e.target.value)} placeholder="MCA remarks…" rows={3} maxLength={1000} className={`${inp} resize-none border-ga-line bg-white`} />
              </div>
            </div>
            {/* MKI */}
            <div className="space-y-3">
              <p className="border-b border-ga-border pb-2 text-sm font-bold text-ga-ink">MKI Fields</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Due Date</label>
                  <input type="date" value={form.mkiDue} onChange={e => set("mkiDue", e.target.value)} className={`${inp} border-ga-line bg-white`} />
                </div>
                <div>
                  <label className={lbl}>Actual Date</label>
                  <input type="date" value={form.mkiAlloc} onChange={e => set("mkiAlloc", e.target.value)} className={`${inp} border-ga-line bg-white`} />
                </div>
              </div>
              <div>
                <label className={lbl}>Reason of delay if any.</label>
                <textarea value={form.mkiComment} onChange={e => set("mkiComment", e.target.value)} placeholder="MKI remarks…" rows={3} maxLength={1000} className={`${inp} resize-none border-ga-line bg-white`} />
              </div>
            </div>
          </div>
          {errors._form && <p className="text-[12px] text-ga-error">⚠ {errors._form}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-ga-border bg-ga-cream px-6 py-4">
          <button onClick={onClose} className="cursor-pointer rounded-lg border border-ga-line bg-white px-4 py-2 text-[13px] font-semibold text-ga-body">Cancel</button>
          <button onClick={submit} disabled={saving} className="cursor-pointer rounded-lg bg-ga-blue px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Apply Changes" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OfficerStaticForms({ state }) {
  const [designations, setDesignations] = useState([]);
  const [records, setRecords] = useState([]);
  const [mcaRecords, setMcaRecords] = useState([]);

  const [nomModal, setNomModal] = useState(null);
  const [mcaModal, setMcaModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: "nom"|"mca", id }

  const [nomSearch, setNomSearch] = useState("");
  const [nomSort, setNomSort] = useState({ col: null, dir: "asc" });

  const [mcaSearch, setMcaSearch] = useState("");
  const [mcaSort, setMcaSort] = useState({ col: null, dir: "asc" });

  useEffect(() => { document.title = "GAMIS - Static Forms"; }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { const d = await getDesignations(); if (!cancelled) setDesignations(d); }
      catch { if (!cancelled) setDesignations(DESIGNATIONS); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [noms, mcas] = await Promise.all([getNominations(), getMcaMkiRecords()]);
        if (cancelled) return;
        setRecords(Array.isArray(noms) ? noms.filter(n => n.state === state) : []);
        setMcaRecords(Array.isArray(mcas) ? mcas.filter(m => m.state === state) : []);
      } catch (err) {
        console.error("Failed to load static-form records", err);
      }
    })();
    return () => { cancelled = true; };
  }, [state]);

  const saveNom = async (form, id) => {
    if (id) {
      const updated = await updateNomination(id, form);
      setRecords(r => r.map(x => x.id === id ? updated : x));
    } else {
      const saved = await saveNomination(form);
      setRecords(r => [saved, ...r]);
    }
  };

  const removeNom = async (id) => {
    const prev = records;
    setRecords(r => r.filter(x => x.id !== id));
    try { await deleteNomination(id); }
    catch { setRecords(prev); }
  };

  const saveMca = async (form, id) => {
    if (id) {
      const updated = await updateMcaMkiRecord(id, form);
      setMcaRecords(r => r.map(x => x.id === id ? updated : x));
    } else {
      const saved = await saveMcaMkiRecord(form);
      setMcaRecords(r => [saved, ...r]);
    }
  };

  const removeMca = async (id) => {
    const prev = mcaRecords;
    setMcaRecords(r => r.filter(x => x.id !== id));
    try { await deleteMcaMkiRecord(id); }
    catch { setMcaRecords(prev); }
  };

  const filteredNoms = useMemo(() => {
    let rows = records.filter(r => {
      const s = nomSearch.toLowerCase();
      return !s || Object.values(r).some(v => String(v).toLowerCase().includes(s));
    });
    if (nomSort.col) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[nomSort.col] || "").toLowerCase();
        const bv = String(b[nomSort.col] || "").toLowerCase();
        return nomSort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [records, nomSearch, nomSort]);

  const toggleNomSort = (col) =>
    setNomSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const filteredMcas = useMemo(() => {
    let rows = mcaRecords.filter(r => {
      const s = mcaSearch.toLowerCase();
      return !s || Object.values(r).some(v => String(v).toLowerCase().includes(s));
    });
    if (mcaSort.col) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[mcaSort.col] || "").toLowerCase();
        const bv = String(b[mcaSort.col] || "").toLowerCase();
        return mcaSort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [mcaRecords, mcaSearch, mcaSort]);

  const toggleMcaSort = (col) =>
    setMcaSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const thCls = "px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted cursor-pointer select-none hover:text-ga-ink whitespace-nowrap";

  const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );

  const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  return (
    <div className="w-full overflow-y-auto px-8 py-7 bg-[#FAFAF8] space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ga-ink font-serif">{state}</h1>
        <p className="mt-1 text-[13px] text-ga-muted">DA cadre nominations and MCA/MKI for {state}</p>
      </div>

      {/* ── Nominations Section ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-ga-border bg-white">

        {/* Section header */}
        <div className="flex items-start justify-between border-b border-ga-border px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-ga-ink font-serif">Nomination of DA Cadre Official</h2>
            <p className="mt-0.5 text-[13px] text-ga-muted">DA cadre official nominations</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button onClick={() => setNomModal({})} className="cursor-pointer flex items-center gap-2 rounded-lg bg-ga-blue px-4 py-2 text-[13px] font-bold text-white hover:opacity-90">
              <PlusIcon /> Add Nomination
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 border-b border-ga-border bg-ga-cream/40 px-6 py-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ga-faint"><SearchIcon /></span>
            <input
              type="text"
              value={nomSearch}
              onChange={e => setNomSearch(e.target.value)}
              placeholder="Search across all fields…"
              className="w-full rounded-lg border border-ga-line bg-white py-2 pl-9 pr-3 text-[13px] text-ga-ink placeholder:text-ga-faint outline-none focus:border-ga-blue"
            />
          </div>
          {nomSearch && (
            <button onClick={() => setNomSearch("")} className="cursor-pointer text-[12px] text-ga-muted hover:text-ga-ink">Clear</button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-ga-border bg-ga-cream">
                <th className="w-12 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">S.NO</th>
                <th className="w-20 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">ACTIONS</th>
                {[["name", "EMPLOYEE NAME"], ["designation", "DESIGNATION"], ["email", "EMAIL ID"], ["mobile", "MOBILE NO."]].map(([col, label]) => (
                  <th key={col} className={thCls} onClick={() => toggleNomSort(col)}>
                    <span className="flex items-center gap-1">{label} </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredNoms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[13px] text-ga-muted">
                    {records.length === 0
                      ? 'No records yet. Click "+ Add Nomination" to get started.'
                      : "No records match the current filters."}
                  </td>
                </tr>
              ) : filteredNoms.map((r, i) => (
                <tr key={r.id} className="border-t border-ga-border hover:bg-ga-cream/30 transition-colors">
                  <td className="px-3 py-3 text-ga-muted">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setNomModal(r)} title="Edit" className="cursor-pointer rounded-md border border-ga-line bg-white p-1.5 text-ga-body hover:border-ga-blue hover:text-ga-blue transition-colors">
                        <PencilIcon />
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: "nom", id: r.id })} title="Delete" className="cursor-pointer rounded-md border border-[#FED7D7] bg-white p-1.5 text-ga-error hover:bg-[#FFF5F5] transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-semibold">{r.name}</td>
                  <td className="px-3 py-3">{r.designation}</td>
                  <td className="px-3 py-3">{r.email}</td>
                  <td className="px-3 py-3">{r.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNoms.length > 0 && (
          <div className="border-t border-ga-border bg-ga-cream/40 px-6 py-3 text-[12px] text-ga-muted">
            Showing {filteredNoms.length} of {records.length} record{records.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── MCA / MKI Section ────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-ga-border bg-white">

        {/* Section header */}
        <div className="flex items-start justify-between border-b border-ga-border px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-ga-ink font-serif">MCA / MKI</h2>
            <p className="mt-0.5 text-[13px] text-ga-muted">MCA and MKI combined records</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button onClick={() => setMcaModal({})} className="cursor-pointer flex items-center gap-2 rounded-lg bg-ga-blue px-4 py-2 text-[13px] font-bold text-white hover:opacity-90">
              <PlusIcon /> Add MCA/MKI
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 border-b border-ga-border bg-ga-cream/40 px-6 py-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ga-faint"><SearchIcon /></span>
            <input
              type="text"
              value={mcaSearch}
              onChange={e => setMcaSearch(e.target.value)}
              placeholder="Search across all fields…"
              className="w-full rounded-lg border border-ga-line bg-white py-2 pl-9 pr-3 text-[13px] text-ga-ink placeholder:text-ga-faint outline-none focus:border-ga-blue"
            />
          </div>
          {mcaSearch && (
            <button onClick={() => setMcaSearch("")} className="cursor-pointer text-[12px] text-ga-muted hover:text-ga-ink">Clear</button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-ga-border bg-ga-cream">
                <th className="w-12 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">S.NO</th>
                <th className="w-20 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">ACTIONS</th>
                {[["mcaDue", "MCA DUE"], ["mcaAlloc", "MCA ALLOC."], ["mcaComment", "MCA COMMENT"], ["mkiDue", "MKI DUE"], ["mkiAlloc", "MKI ALLOC."], ["mkiComment", "MKI COMMENT"]].map(([col, label]) => (
                  <th key={col} className={thCls} onClick={() => toggleMcaSort(col)}>
                    <span className="flex items-center gap-1">{label} </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMcas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[13px] text-ga-muted">
                    {mcaRecords.length === 0
                      ? 'No records yet. Click "+ Add Record" to get started.'
                      : "No records match the current filters."}
                  </td>
                </tr>
              ) : filteredMcas.map((r, i) => (
                <tr key={r.id} className="border-t border-ga-border hover:bg-ga-cream/30 transition-colors">
                  <td className="px-3 py-3 text-ga-muted">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setMcaModal(r)} title="Edit" className="cursor-pointer rounded-md border border-ga-line bg-white p-1.5 text-ga-body hover:border-ga-blue hover:text-ga-blue transition-colors">
                        <PencilIcon />
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: "mca", id: r.id })} title="Delete" className="cursor-pointer rounded-md border border-[#FED7D7] bg-white p-1.5 text-ga-error hover:bg-[#FFF5F5] transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">{r.mcaDue ? formatDateDdMmYyyy(r.mcaDue) : "—"}</td>
                  <td className="px-3 py-3">{r.mcaAlloc ? formatDateDdMmYyyy(r.mcaAlloc) : "—"}</td>
                  <td className="px-3 py-3 max-w-[160px] truncate" title={r.mcaComment || ""}>{r.mcaComment || "—"}</td>
                  <td className="px-3 py-3">{r.mkiDue ? formatDateDdMmYyyy(r.mkiDue) : "—"}</td>
                  <td className="px-3 py-3">{r.mkiAlloc ? formatDateDdMmYyyy(r.mkiAlloc) : "—"}</td>
                  <td className="px-3 py-3 max-w-[160px] truncate" title={r.mkiComment || ""}>{r.mkiComment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMcas.length > 0 && (
          <div className="border-t border-ga-border bg-ga-cream/40 px-6 py-3 text-[12px] text-ga-muted">
            Showing {filteredMcas.length} of {mcaRecords.length} record{mcaRecords.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {nomModal !== null && createPortal(
        <NomModal
          state={state}
          designations={designations}
          record={nomModal?.id ? nomModal : null}
          onClose={() => setNomModal(null)}
          onSave={saveNom}
        />,
        document.body
      )}
      {mcaModal !== null && createPortal(
        <McaModal
          state={state}
          record={mcaModal?.id ? mcaModal : null}
          onClose={() => setMcaModal(null)}
          onSave={saveMca}
        />,
        document.body
      )}
      {deleteConfirm !== null && createPortal(
        <DeleteConfirmModal
          onConfirm={() => {
            if (deleteConfirm.type === "nom") removeNom(deleteConfirm.id);
            else removeMca(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />,
        document.body
      )}
    </div>
  );
}
