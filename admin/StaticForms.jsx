import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  logoutUser,
  getStates, getDesignations,
  getNominations, saveNomination, deleteNomination,
  getMcaMkiRecords, saveMcaMkiRecord, deleteMcaMkiRecord,
} from "../store.js";
import { ALL_INDIAN_STATES_AND_UTS, DESIGNATIONS } from "../constants.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

const EMPTY = { state: "", name: "", designation: "", email: "", mobile: "" };

const SELECT_ARROW =
  "appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23888780%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_12px_center] bg-no-repeat pr-9";

export default function StaticForms() {
  const navigate = useNavigate();

  const [states, setStates] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [statesError, setStatesError] = useState(false);
  const [desigError, setDesigError] = useState(false);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [records, setRecords] = useState([]);

  // MCA / MKI combined form
  const MCA_EMPTY = { state: "", mcaDue: "", mcaAlloc: "", mcaComment: "", mkiDue: "", mkiAlloc: "", mkiComment: "" };
  const [mca, setMca] = useState(MCA_EMPTY);
  const [mcaErrors, setMcaErrors] = useState({});
  const [mcaRecords, setMcaRecords] = useState([]);

  const setMcaField = (key, val) => {
    setMca(f => ({ ...f, [key]: val }));
    setMcaErrors(e => ({ ...e, [key]: undefined }));
  };

  const submitMca = async () => {
    if (!mca.state) { setMcaErrors({ state: "Please select a state." }); return; }
    try {
      const saved = await saveMcaMkiRecord(mca);
      setMcaRecords(r => [saved, ...r]);
      setMca(MCA_EMPTY);
      setMcaErrors({});
    } catch (err) {
      setMcaErrors(e => ({ ...e, _form: err.message || "Failed to submit record." }));
    }
  };

  const cancelMca = () => { setMca(MCA_EMPTY); setMcaErrors({}); };
  const removeMcaRecord = async (id) => {
    const prev = mcaRecords;
    setMcaRecords(r => r.filter(x => x.id !== id));
    try {
      await deleteMcaMkiRecord(id);
    } catch {
      setMcaRecords(prev);
    }
  };

  useEffect(() => {
    document.title = "GA Wing Survey Portal - Static Forms";
  }, []);

  // Load reference data (states + designations) from the API, with a
  // local fallback so the form still works if the API is unreachable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getStates();
        if (!cancelled) { setStates(s); setStatesError(false); }
      } catch {
        if (!cancelled) { setStates(ALL_INDIAN_STATES_AND_UTS); setStatesError(true); }
      }
      try {
        const d = await getDesignations();
        if (!cancelled) { setDesignations(d); setDesigError(false); }
      } catch {
        if (!cancelled) { setDesignations(DESIGNATIONS); setDesigError(true); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load previously submitted records from the backend.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [noms, mcas] = await Promise.all([getNominations(), getMcaMkiRecords()]);
        if (cancelled) return;
        setRecords(Array.isArray(noms) ? noms : []);
        setMcaRecords(Array.isArray(mcas) ? mcas : []);
      } catch (err) {
        console.error("Failed to load static-form records", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    logoutUser();
    window.dispatchEvent(new StorageEvent('storage', { key: 'gawing_session', newValue: null }));
    navigate("/login");
  };

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.state) e.state = "Please select a state.";
    if (!form.name.trim()) e.name = "Please enter the employee name.";
    if (!form.designation) e.designation = "Please select a designation.";
    if (!form.email.trim()) e.email = "Please enter an email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Please enter a valid email.";
    if (!form.mobile.trim()) e.mobile = "Please enter a mobile number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const saved = await saveNomination(form);
      setRecords(r => [saved, ...r]);
      setForm(EMPTY);
      setErrors({});
    } catch (err) {
      setErrors(e => ({ ...e, _form: err.message || "Failed to submit nomination." }));
    }
  };

  const handleCancel = () => {
    setForm(EMPTY);
    setErrors({});
  };

  const removeRecord = async (id) => {
    const prev = records;
    setRecords(r => r.filter(x => x.id !== id));
    try {
      await deleteNomination(id);
    } catch {
      setRecords(prev);
    }
  };

  const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ga-muted";
  const inputBase = "box-border w-full rounded-lg border-[1.5px] px-[13px] py-[9px] text-[13px] text-ga-ink outline-none transition-[border-color] duration-150";
  const fieldErr = (k) => errors[k] ? "border-ga-error bg-[#FFF8F8]" : "border-ga-line bg-white";

  return (
    <div className="min-h-screen bg-ga-cream font-sans flex flex-col">
      {/* Navbar */}
      <header className="h-[60px] bg-white border-b border-[#E8E6DF] flex items-center justify-between px-8 gap-3.5">
        <div className="flex items-center gap-3.5">
          <div onClick={() => navigate("/")} className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[13px] font-extrabold font-serif shrink-0 cursor-pointer">
            GA
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#2C2C2A] leading-tight font-serif">
              GA Wing Survey Portal
            </div>
            <div className="text-[10px] text-[#888780]">
              Office of the Controller General of Accounts · Ministry of Finance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/")} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🏠 Home</button>
          <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🚪 Logout</button>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex-1 flex">
        <AdminSidebar activePage="static-forms" />
        <div className="flex-1 flex flex-col">
          <div className="border-b border-ga-border bg-white px-6 py-3">
            <Breadcrumb />
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-7">
            <div className="mx-auto max-w-[860px]">
            <h1 className="mb-5 text-2xl font-extrabold text-ga-ink font-serif">CAG — Static Forms</h1>

            {/* Nomination card */}
            <div className="overflow-hidden rounded-2xl border border-ga-border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)]">

              {/* Card header */}
              <div className="flex items-center justify-between border-b border-ga-border bg-ga-cream px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="m16 11 2 2 4-4" />
                  </svg>
                  <span className="text-base font-bold text-ga-ink">Nomination of DA Cadre Official</span>
                </div>
                <span className="rounded-md border border-[#B5D4F4] bg-[#E6F1FB] px-2.5 py-1 text-xs font-semibold text-ga-blue">Form 1</span>
              </div>

              {/* Card body */}
              <div className="px-6 py-6">
                {statesError && (
                  <div className="mb-3 rounded-lg border border-[#F0C4C4] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-ga-error">
                    Could not load states. Please refresh.
                  </div>
                )}
                {desigError && (
                  <div className="mb-3 rounded-lg border border-[#F0C4C4] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-ga-error">
                    Could not load designations. Please refresh.
                  </div>
                )}

                {/* Name of state */}
                <div className="mb-4">
                  <label className={labelCls}>Name of State <span className="text-ga-error">*</span></label>
                  <select
                    value={form.state}
                    onChange={e => setField("state", e.target.value)}
                    className={`${inputBase} ${SELECT_ARROW} ${fieldErr("state")} ${form.state ? "text-ga-ink" : "text-ga-muted"}`}
                  >
                    <option value="">Select state…</option>
                    {states.map(s => <option key={s} value={s} className="text-ga-ink">{s}</option>)}
                  </select>
                  {errors.state && <div className="mt-1.5 text-[11px] font-medium text-ga-error">ⓘ {errors.state}</div>}
                </div>

                {/* Employee name + Designation */}
                <div className="mb-4 grid grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Employee Name <span className="text-ga-error">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setField("name", e.target.value)}
                      placeholder="Enter full name"
                      className={`${inputBase} ${fieldErr("name")}`}
                    />
                    {errors.name && <div className="mt-1.5 text-[11px] font-medium text-ga-error">ⓘ {errors.name}</div>}
                  </div>
                  <div>
                    <label className={labelCls}>Designation <span className="text-ga-error">*</span></label>
                    <select
                      value={form.designation}
                      onChange={e => setField("designation", e.target.value)}
                      className={`${inputBase} ${SELECT_ARROW} ${fieldErr("designation")} ${form.designation ? "text-ga-ink" : "text-ga-muted"}`}
                    >
                      <option value="">Select…</option>
                      {designations.map(d => <option key={d} value={d} className="text-ga-ink">{d}</option>)}
                    </select>
                    {errors.designation && <div className="mt-1.5 text-[11px] font-medium text-ga-error">ⓘ {errors.designation}</div>}
                  </div>
                </div>

                {/* Email + Mobile */}
                <div className="mb-5 grid grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Email <span className="text-ga-error">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setField("email", e.target.value)}
                      placeholder="official@gov.in"
                      className={`${inputBase} ${fieldErr("email")}`}
                    />
                    {errors.email && <div className="mt-1.5 text-[11px] font-medium text-ga-error">ⓘ {errors.email}</div>}
                  </div>
                  <div>
                    <label className={labelCls}>Mobile Number <span className="text-ga-error">*</span></label>
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={e => setField("mobile", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className={`${inputBase} ${fieldErr("mobile")}`}
                    />
                    {errors.mobile && <div className="mt-1.5 text-[11px] font-medium text-ga-error">ⓘ {errors.mobile}</div>}
                  </div>
                </div>

                {errors._form && (
                  <div className="mb-3 rounded-lg border border-[#F0C4C4] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-ga-error">{errors._form}</div>
                )}

                {/* Records */}
                {records.length === 0 ? (
                  <div className="rounded-xl border border-ga-border bg-ga-cream/60 py-7 text-center text-[13px] text-ga-muted">
                    No records yet. Submit the form above to add one.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-ga-border">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr className="bg-ga-cream text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">
                          <th className="px-3 py-2.5">#</th>
                          <th className="px-3 py-2.5">State</th>
                          <th className="px-3 py-2.5">Employee</th>
                          <th className="px-3 py-2.5">Designation</th>
                          <th className="px-3 py-2.5">Email</th>
                          <th className="px-3 py-2.5">Mobile</th>
                          <th className="px-3 py-2.5"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r, i) => (
                          <tr key={r.id} className="border-t border-ga-border text-ga-ink">
                            <td className="px-3 py-2.5 text-ga-muted">{i + 1}</td>
                            <td className="px-3 py-2.5">{r.state}</td>
                            <td className="px-3 py-2.5 font-semibold">{r.name}</td>
                            <td className="px-3 py-2.5">{r.designation}</td>
                            <td className="px-3 py-2.5">{r.email}</td>
                            <td className="px-3 py-2.5">{r.mobile}</td>
                            <td className="px-3 py-2.5 text-right">
                              <button onClick={() => removeRecord(r.id)} className="cursor-pointer rounded-md border border-ga-line bg-ga-surface px-2 py-1 text-[11px] font-semibold text-ga-error">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="flex items-center justify-end gap-3 border-t border-ga-border bg-ga-cream px-6 py-4">
                <button onClick={handleCancel} className="cursor-pointer rounded-lg border border-ga-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ga-body">✕ Cancel</button>
                <button onClick={handleSubmit} className="cursor-pointer rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-4 py-2.5 text-[13px] font-bold text-ga-blue">✓ Submit Nomination</button>
              </div>
            </div>

            {/* MCA / MKI combined card */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-ga-border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)]">

              {/* Card header */}
              <div className="flex items-center justify-between border-b border-ga-border bg-ga-cream px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span className="text-base font-bold text-ga-ink">MCA / MKI</span>
                </div>
                <span className="rounded-md border border-[#B5D4F4] bg-[#E6F1FB] px-2.5 py-1 text-xs font-semibold text-ga-blue">Combined Form</span>
              </div>

              {/* Card body */}
              <div className="px-6 py-6">
                {/* State */}
                <div className="mb-6">
                  <label className={labelCls}>State <span className="text-ga-error">*</span></label>
                  <select
                    value={mca.state}
                    onChange={e => setMcaField("state", e.target.value)}
                    className={`${inputBase} ${SELECT_ARROW} ${mcaErrors.state ? "border-ga-error bg-[#FFF8F8]" : "border-ga-line bg-white"} ${mca.state ? "text-ga-ink" : "text-ga-muted"}`}
                  >
                    <option value="">Select state</option>
                    {states.map(s => <option key={s} value={s} className="text-ga-ink">{s}</option>)}
                  </select>
                  {mcaErrors.state && <div className="mt-1.5 text-[11px] font-medium text-ga-error">ⓘ {mcaErrors.state}</div>}
                </div>

                {/* MCA Fields */}
                <div className="mb-2 border-t border-ga-border pt-5">
                  <div className="mb-4 text-sm font-bold text-ga-ink">MCA Fields</div>
                  <div className="mb-4 grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Due Date</label>
                      <input type="date" value={mca.mcaDue} onChange={e => setMcaField("mcaDue", e.target.value)} className={`${inputBase} border-ga-line bg-white ${mca.mcaDue ? "text-ga-ink" : "text-ga-muted"}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Allocation Date</label>
                      <input type="date" value={mca.mcaAlloc} onChange={e => setMcaField("mcaAlloc", e.target.value)} className={`${inputBase} border-ga-line bg-white ${mca.mcaAlloc ? "text-ga-ink" : "text-ga-muted"}`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Comment</label>
                    <textarea value={mca.mcaComment} onChange={e => setMcaField("mcaComment", e.target.value)} placeholder="MCA remarks…" rows={3} maxLength={1000} className={`${inputBase} resize-y border-ga-line bg-white`} />
                  </div>
                </div>

                {/* MKI Fields */}
                <div className="mb-6 border-t border-ga-border pt-5">
                  <div className="mb-4 text-sm font-bold text-ga-ink">MKI Fields</div>
                  <div className="mb-4 grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Due Date</label>
                      <input type="date" value={mca.mkiDue} onChange={e => setMcaField("mkiDue", e.target.value)} className={`${inputBase} border-ga-line bg-white ${mca.mkiDue ? "text-ga-ink" : "text-ga-muted"}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Allocation Date</label>
                      <input type="date" value={mca.mkiAlloc} onChange={e => setMcaField("mkiAlloc", e.target.value)} className={`${inputBase} border-ga-line bg-white ${mca.mkiAlloc ? "text-ga-ink" : "text-ga-muted"}`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Comment</label>
                    <textarea value={mca.mkiComment} onChange={e => setMcaField("mkiComment", e.target.value)} placeholder="MKI remarks…" rows={3} maxLength={1000} className={`${inputBase} resize-y border-ga-line bg-white`} />
                  </div>
                </div>

                {mcaErrors._form && (
                  <div className="mb-3 rounded-lg border border-[#F0C4C4] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-ga-error">{mcaErrors._form}</div>
                )}

                {/* Records */}
                {mcaRecords.length === 0 ? (
                  <div className="rounded-xl border border-ga-border bg-ga-cream/60 py-7 text-center text-[13px] text-ga-muted">
                    No records yet. Submit the form above to add one.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-ga-border">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr className="bg-ga-cream text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">
                          <th className="px-3 py-2.5">#</th>
                          <th className="px-3 py-2.5">State</th>
                          <th className="px-3 py-2.5">MCA Due</th>
                          <th className="px-3 py-2.5">MCA Alloc.</th>
                          <th className="px-3 py-2.5">MKI Due</th>
                          <th className="px-3 py-2.5">MKI Alloc.</th>
                          <th className="px-3 py-2.5"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {mcaRecords.map((r, i) => (
                          <tr key={r.id} className="border-t border-ga-border text-ga-ink">
                            <td className="px-3 py-2.5 text-ga-muted">{i + 1}</td>
                            <td className="px-3 py-2.5 font-semibold">{r.state}</td>
                            <td className="px-3 py-2.5">{r.mcaDue || "—"}</td>
                            <td className="px-3 py-2.5">{r.mcaAlloc || "—"}</td>
                            <td className="px-3 py-2.5">{r.mkiDue || "—"}</td>
                            <td className="px-3 py-2.5">{r.mkiAlloc || "—"}</td>
                            <td className="px-3 py-2.5 text-right">
                              <button onClick={() => removeMcaRecord(r.id)} className="cursor-pointer rounded-md border border-ga-line bg-ga-surface px-2 py-1 text-[11px] font-semibold text-ga-error">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="flex items-center justify-end gap-3 border-t border-ga-border bg-ga-cream px-6 py-4">
                <button onClick={cancelMca} className="cursor-pointer rounded-lg border border-ga-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ga-body">✕ Cancel</button>
                <button onClick={submitMca} className="cursor-pointer rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-4 py-2.5 text-[13px] font-bold text-ga-blue">✓ Submit</button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
