import { formatDateDdMmYyyy } from "../dateUtils.js";

const INPUT_BASE =
  "box-border w-full rounded-lg border-[1.5px] px-[13px] py-[9px] font-inherit text-[13px] text-ga-ink outline-none transition-[border-color] duration-150";
const SELECT_ARROW =
  "appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23888780%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_12px_center] bg-no-repeat pr-8";

export default function FormField({ field, value, onChange, error, disabled }) {
  const fieldDisabled = disabled || field.disabled;
  const borderClass = error ? "border-ga-error" : "border-ga-line";
  const bgClass = fieldDisabled ? "bg-ga-cream" : "bg-white";
  const inputClass = `${INPUT_BASE} ${borderClass} ${bgClass}`;
  const today = new Date().toISOString().split("T")[0];

  let input = null;
  if (field.type === "text" || field.type === "email" || field.type === "tel") {
    input = <input type={field.type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} disabled={fieldDisabled} className={inputClass} />;
  } else if (field.type === "number") {
    input = (
      <input
        type="number"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={fieldDisabled}
        className={inputClass}
        onKeyDown={e => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
      />
    );
  } else if (field.type === "date") {
    // Read-only dates are shown in the app-wide DD-MM-YYYY format. A native date
    // input renders in the browser locale (often MM/DD/YYYY) and can't be forced
    // to DD-MM-YYYY, so we swap to a disabled text field when not editable.
    input = fieldDisabled
      ? <input type="text" value={formatDateDdMmYyyy(value || today)} disabled className={inputClass} />
      : <input type="date" value={value || today} max={today} onChange={e => onChange(e.target.value)} className={inputClass} />;
  } else if (field.type === "textarea") {
    input = (
      <div>
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} disabled={fieldDisabled} rows={3} maxLength={1000} className={`${inputClass} resize-y`} />
        <div className="mt-0.5 text-right text-[10px] text-ga-faint">{(value || "").length}/1000</div>
      </div>
    );
  } else if (field.type === "dropdown") {
    input = (
      <select value={value || ""} onChange={e => onChange(e.target.value)} disabled={fieldDisabled} className={`${inputClass} ${SELECT_ARROW}`}>
        <option value="">— Select —</option>
        {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  } else if (field.type === "radio") {
    input = (
      <div className="flex flex-wrap gap-2">
        {(field.options || []).map(o => {
          const sel = value === o;
          return (
            <div
              key={o}
              onClick={() => !fieldDisabled && onChange(o)}
              className={`rounded-full border-[1.5px] px-4 py-[7px] text-xs transition-all duration-[130ms] ${
                fieldDisabled ? "cursor-default" : "cursor-pointer"
              } ${sel ? "border-ga-blue bg-[#E6F1FB] font-bold text-ga-blue" : "border-ga-line bg-[#FAFAF8] font-medium text-ga-body"}`}
            >
              {sel ? "● " : "○ "}{o}
            </div>
          );
        })}
      </div>
    );
  } else if (field.type === "checkbox") {
    const vals = value || [];
    input = (
      <div className="flex flex-wrap gap-2">
        {(field.options || []).map(o => {
          const chk = vals.includes(o);
          return (
            <div
              key={o}
              onClick={() => { if (!fieldDisabled) onChange(chk ? vals.filter(x => x !== o) : [...vals, o]); }}
              className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-[7px] text-xs transition-all duration-[130ms] ${
                fieldDisabled ? "cursor-default" : "cursor-pointer"
              } ${chk ? "border-ga-green bg-[#E1F5EE] font-bold text-ga-green" : "border-ga-line bg-[#FAFAF8] font-medium text-ga-body"}`}
            >
              <span>{chk ? "☑" : "☐"}</span>{o}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 text-xs font-bold text-ga-body">
        {field.label}{field.required && <span className="ml-0.5 text-ga-error">*</span>}
      </div>
      {input}
      {error && <div className="mt-1 text-[11px] text-ga-error">⚠ {error}</div>}
    </div>
  );
}
