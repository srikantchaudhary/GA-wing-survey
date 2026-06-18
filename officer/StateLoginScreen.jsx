import { useState, useEffect } from "react";
import { ALL_INDIAN_STATES_AND_UTS } from "../constants.js";
import { getStates } from "../store.js";


export default function StateLoginScreen({ onLogin, onHome }) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [allStates, setAllStates] = useState(ALL_INDIAN_STATES_AND_UTS);

  // Load the authoritative states list from the API (fallback: bundled list).
  useEffect(() => {
    let mounted = true;
    getStates()
      .then(list => { if (mounted && list.length) setAllStates(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleProceed = () => {
    if (!selected) { setError("Please select your state to proceed."); return; }
    onLogin(selected);
  };

  const selectBorder = error ? "border-ga-error" : selected ? "border-ga-green" : "border-ga-line";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ga-cream p-6">
      <div className="mb-9 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ga-blue to-ga-green font-serif text-[22px] font-extrabold text-white shadow-[0_8px_24px_rgba(24,95,165,0.3)]">GA</div>
        <div className="font-serif text-xl font-extrabold text-ga-ink">GAMIS</div>
        <div className="mt-1 text-xs text-ga-muted">Office of the Controller General of Accounts · Ministry of Finance</div>
      </div>

      <div className="w-full max-w-[420px] rounded-[20px] border border-ga-border bg-white p-9 px-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        {onHome && (
          <button onClick={onHome} className="mb-4 flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-1 py-1 text-xs font-semibold text-ga-muted">← Back to Home</button>
        )}
        <div className="mb-6">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-ga-faint">State Officer Access</div>
          <h2 className="m-0 font-serif text-lg font-extrabold text-ga-ink">Select Your State</h2>
          <p className="mt-1.5 text-[13px] leading-normal text-ga-muted">Please identify your office state to view assigned survey forms.</p>
        </div>

        <div className="mb-2">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ga-body">State / UT *</div>
          <select
            value={selected}
            onChange={e => { setSelected(e.target.value); setError(""); }}
            className={`box-border w-full cursor-pointer appearance-none rounded-[10px] border-[1.5px] bg-white py-[11px] pl-3.5 pr-9 text-[13px] outline-none transition-[border-color] duration-150 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23888780%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_14px_center] bg-no-repeat ${selectBorder} ${selected ? "text-ga-ink" : "text-ga-muted"}`}
          >
            <option value="">— Select your state —</option>
            {allStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {error && <div className="mt-1 text-[11px] text-ga-error">⚠ {error}</div>}
        </div>

        <div className="mb-6 text-[11px] leading-normal text-ga-faint">Your state selection will filter survey forms assigned to your office.</div>

        <button
          onClick={handleProceed}
          className={`w-full rounded-[10px] border-none py-[13px] text-sm font-bold transition-all duration-150 ${
            selected
              ? "cursor-pointer bg-gradient-to-br from-ga-blue to-ga-green text-white shadow-[0_4px_16px_rgba(24,95,165,0.25)]"
              : "cursor-not-allowed bg-ga-line text-ga-muted"
          }`}
        >
          View My Forms →
        </button>

        <div className="mt-6 border-t border-ga-surface pt-5 text-center text-[11px] leading-normal text-ga-faint">
          This is a secure government survey portal.<br />For access issues, contact the GA Wing office.
        </div>
      </div>

      <div className="mt-6 text-center text-[11px] text-ga-faint">GA Wing IMS · Ministry of Finance · © {new Date().getFullYear()}</div>
    </div>
  );
}
