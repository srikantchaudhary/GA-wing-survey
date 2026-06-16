import { useRef, useState, useEffect } from "react";
import { ALL_INDIAN_STATES_AND_UTS } from "../constants.js";
import { getStates } from "../store.js";

export default function MultiStateSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [allStates, setAllStates] = useState(ALL_INDIAN_STATES_AND_UTS);
  const ref = useRef();

  // Load the authoritative states list from the API (fallback: bundled list).
  useEffect(() => {
    let mounted = true;
    getStates()
      .then(list => { if (mounted && list.length) setAllStates(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggle = (s) => {
    if (disabled) return;
    onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);
  };

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => !disabled && setOpen(o => !o)}
        className={`relative flex min-h-10 cursor-pointer flex-wrap items-center gap-1 rounded-lg border-[1.5px] px-3.5 py-[9px] pr-9 text-[13px] select-none ${
          value.length > 0 ? "border-ga-green" : "border-ga-line"
        } ${disabled ? "cursor-not-allowed bg-ga-surface" : "bg-white"}`}
      >
        {value.length === 0 && <span className="text-ga-muted">— Select states —</span>}
        {value.slice(0, 3).map(s => (
          <span key={s} className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-semibold text-ga-green">{s}</span>
        ))}
        {value.length > 3 && <span className="text-[11px] font-semibold text-ga-muted">+{value.length - 3} more</span>}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ga-muted">▾</span>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[500] flex max-h-[280px] flex-col overflow-hidden rounded-[10px] border-[1.5px] border-ga-line bg-white shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
          <div className="flex shrink-0 gap-2 border-b border-ga-surface px-3 py-2">
            <button onClick={() => onChange([...allStates])} className="flex-1 cursor-pointer rounded-md border border-ga-line bg-ga-surface py-[5px] text-[11px] font-semibold text-ga-ink">Select All ({allStates.length})</button>
            <button onClick={() => onChange([])} className="flex-1 cursor-pointer rounded-md border border-ga-line bg-ga-surface py-[5px] text-[11px] font-semibold text-ga-ink">Clear All</button>
            <button title="Close" onClick={() => setOpen(false)} className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#A8DBC9] bg-[#E1F5EE] px-2 py-[5px] text-base font-bold text-ga-green">✓</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {allStates.map(s => (
              <div
                key={s}
                onClick={() => toggle(s)}
                className={`flex cursor-pointer items-center gap-2.5 border-b border-ga-surface/50 px-3.5 py-2 transition-colors duration-100 ${
                  value.includes(s) ? "bg-[#E1F5EE]" : "bg-transparent hover:bg-ga-cream"
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all duration-[120ms] ${
                    value.includes(s) ? "border-ga-green bg-ga-green" : "border-ga-line bg-white"
                  }`}
                >
                  {value.includes(s) && <span className="text-[10px] leading-none text-white">✓</span>}
                </div>
                <span className="text-[13px] text-ga-ink">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
