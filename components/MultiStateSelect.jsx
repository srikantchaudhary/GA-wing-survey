import { useRef, useState, useEffect } from "react";
import { ALL_INDIAN_STATES_AND_UTS } from "../constants.js";
import { getStates } from "../store.js";

export default function MultiStateSelect({ value, onChange, disabled }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const [allStates, setAllStates] = useState(ALL_INDIAN_STATES_AND_UTS);
  const wrapRef  = useRef();
  const inputRef = useRef();

  useEffect(() => {
    let mounted = true;
    getStates()
      .then(list => { if (mounted && list.length) setAllStates(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggle = (s) => {
    if (disabled) return;
    onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);
    setQuery("");
    inputRef.current?.focus();
  };

  const filtered = allStates.filter(s =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  const openDropdown = () => {
    if (!disabled) { setOpen(true); inputRef.current?.focus(); }
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger — pills + inline search input */}
      <div
        onClick={openDropdown}
        className={`relative flex min-h-10 flex-wrap items-center gap-1 rounded-lg border-[1.5px] px-3 py-[7px] pr-8 text-[13px] ${
          value.length > 0 ? "border-ga-green" : "border-ga-line"
        } ${disabled ? "cursor-not-allowed bg-ga-surface" : "bg-white cursor-text"}`}
      >
        {/* Selected pills */}
        {value.slice(0, 3).map(s => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-[#E1F5EE] pl-2 pr-1 py-0.5 text-[11px] font-semibold text-ga-green"
          >
            {s}
            {!disabled && (
              <span
                onMouseDown={e => { e.stopPropagation(); onChange(value.filter(x => x !== s)); }}
                className="cursor-pointer text-[10px] text-ga-green hover:text-ga-error leading-none"
              >
                ×
              </span>
            )}
          </span>
        ))}
        {value.length > 3 && (
          <span className="text-[11px] font-semibold text-ga-muted">+{value.length - 3} more</span>
        )}

        {/* Inline search input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setQuery(""); } }}
          placeholder={value.length === 0 ? "Search and select states…" : ""}
          disabled={disabled}
          className="min-w-[120px] flex-1 bg-transparent outline-none text-[13px] text-ga-ink placeholder-ga-muted py-0.5"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ga-muted">▾</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[500] flex max-h-[280px] flex-col overflow-hidden rounded-[10px] border-[1.5px] border-ga-line bg-white shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
          <div className="flex shrink-0 gap-2 border-b border-ga-surface px-3 py-2">
            <button
              onMouseDown={e => { e.preventDefault(); onChange([...new Set([...value, ...filtered])]); setQuery(""); }}
              className="flex-1 cursor-pointer rounded-md border border-ga-line bg-ga-surface py-[5px] text-[11px] font-semibold text-ga-ink"
            >
              {query ? `Select All (${filtered.length} matched)` : `Select All (${allStates.length})`}
            </button>
            <button
              onMouseDown={e => { e.preventDefault(); onChange([]); setQuery(""); }}
              className="flex-1 cursor-pointer rounded-md border border-ga-line bg-ga-surface py-[5px] text-[11px] font-semibold text-ga-ink"
            >
              Clear All
            </button>
            <button
              title="Close"
              onMouseDown={e => { e.preventDefault(); setOpen(false); setQuery(""); }}
              className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#A8DBC9] bg-[#E1F5EE] px-2 py-[5px] text-base font-bold text-ga-green"
            >
              ✓
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-center text-[12px] text-ga-muted">No states match "{query}"</div>
            ) : (
              filtered.map(s => (
                <div
                  key={s}
                  onMouseDown={e => { e.preventDefault(); toggle(s); }}
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
