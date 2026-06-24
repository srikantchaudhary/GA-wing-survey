import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ALL_INDIAN_STATES_AND_UTS } from "../constants.js";
import { registerUser, getCurrentUser, getStates } from "../store.js";

// ── Shared eye-icon components ─────────────────────────────────────────────────

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ── Reusable eye-toggle button ─────────────────────────────────────────────────

function EyeButton({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888780] hover:text-[#5F5E5A] cursor-pointer border-none bg-transparent p-0"
      tabIndex={-1}
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff /> : <EyeOpen />}
    </button>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const inputClass = (hasError, hasValue) =>
  `w-full box-border outline-none transition-[border-color] duration-150 px-[14px] py-[11px] border-[1.5px] rounded-[10px] text-[13px] text-[#2C2C2A] bg-white ${
    hasError ? "border-[#A32D2D]" : hasValue ? "border-[#0F6E56]" : "border-[#D3D1C7]"
  }`;

const selectClass = (hasError, hasValue) =>
  `${inputClass(hasError, hasValue)} appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_14px_center] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20d=%27M1%201l5%205%205-5%27%20stroke=%27%23888780%27%20stroke-width=%271.5%27%20fill=%27none%27/%3E%3C/svg%3E')]`;

const labelClass = "text-[11px] font-bold text-[#5F5E5A] mb-1.5 uppercase tracking-[0.05em]";

const FieldError = ({ msg }) =>
  msg ? <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {msg}</div> : null;

// ── Per-field validators ───────────────────────────────────────────────────────

function validateName(v) {
  if (!v.trim()) return "Full name is required.";
  if (/\d/.test(v)) return "Name should not contain numbers.";
  if (!/^[A-Za-z]/.test(v.trim())) return "Name must start with a letter.";
  if (!/^[A-Z]/.test(v.trim())) return "First letter must be a capital letter.";
  return "";
}

function validateEmail(v) {
  if (!v.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Enter a valid email address.";
  return "";
}

const PASSWORD_RULES = [
  { label: "At least 8 characters",         test: v => v.length >= 8 },
  { label: "At least one letter (A–Z/a–z)", test: v => /[A-Za-z]/.test(v) },
  { label: "At least one number (0–9)",      test: v => /[0-9]/.test(v) },
  { label: "At least one special character (@, #, ! …)", test: v => /[^A-Za-z0-9]/.test(v) },
];

function validatePassword(v) {
  if (!v) return "Password is required.";
  if (PASSWORD_RULES.some(r => !r.test(v))) return "Password does not meet all requirements.";
  return "";
}

function PasswordChecklist({ value }) {
  if (!value) return null;
  return (
    <ul className="mt-2 space-y-1 pl-0 list-none">
      {PASSWORD_RULES.map(r => {
        const ok = r.test(value);
        return (
          <li key={r.label} className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? "text-[#0F6E56]" : "text-[#A32D2D]"}`}>
            <span className="shrink-0 text-[10px]">{ok ? "✓" : "✗"}</span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

function validateConfirmPassword(v, password) {
  if (!v) return "Please confirm your password.";
  if (v !== password) return "Passwords do not match.";
  return "";
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [state, setState]                     = useState("");
  const [role, setRole]                       = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                     = useState("");
  const [fieldErrors, setFieldErrors]         = useState({});
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [states, setStates]                   = useState(ALL_INDIAN_STATES_AND_UTS);

  useEffect(() => {
    let mounted = true;
    getStates()
      .then(list => { if (mounted && list.length) setStates(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    document.title = "GAMIS - Sign Up";
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user) {
          navigate(user.role === "admin" ? "/admin/dashboard" : `/officer/${encodeURIComponent(user.state)}`);
        }
      } catch (err) {
        if (!err.suppressLog) console.error("Auth check failed:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Real-time field change handlers ─────────────────────────────────────────

  const setErr = (field, msg) => setFieldErrors(p => ({ ...p, [field]: msg }));

  const onNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setError("");
    // Always validate name in real-time — show guidance from first keystroke
    setErr("name", val ? validateName(val) : "");
  };

  const onEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setError("");
    // Show format error once @ is typed, or if error was already showing
    const shouldValidate = fieldErrors.email || val.includes("@") || val.length > 8;
    setErr("email", shouldValidate ? validateEmail(val) : "");
  };

  const onEmailBlur = () => {
    // Always validate on blur (when user moves away)
    if (email) setErr("email", validateEmail(email));
  };

  const onPasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setError("");
    setErr("password", val ? validatePassword(val) : "");
    // Re-validate confirm password live if already entered
    if (confirmPassword) setErr("confirmPassword", validateConfirmPassword(confirmPassword, val));
  };

  const onConfirmChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    setError("");
    setErr("confirmPassword", val ? validateConfirmPassword(val, password) : "");
  };

  const onSelectChange = (field, setter) => (e) => {
    const val = e.target.value;
    setter(val);
    setError("");
    setErr(field, val ? "" : field === "state" ? "Please select your state or UT." : "Please select a role.");
  };

  // ── Submit (final gate — runs all validators) ────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {
      name:            validateName(name),
      email:           validateEmail(email),
      state:           state  ? "" : "Please select your state or UT.",
      role:            role   ? "" : "Please select a role.",
      password:        validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) { setFieldErrors(errors); setError(""); return; }

    try {
      const result = await registerUser({ name, email, state, role, password });
      if (!result.ok) { setError(result.error); setFieldErrors({}); return; }
      navigate("/login");
    } catch {
      setError("Could not reach server. Is the backend running?");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-7">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[22px] font-extrabold font-serif shadow-[0_8px_24px_rgba(24,95,165,0.3)]">
          GA
        </div>
        <div className="text-xl font-extrabold text-[#2C2C2A] font-serif">GAMIS</div>
        <div className="text-xs text-[#888780] mt-1">Office of the Controller General of Accounts · Ministry of Finance</div>
      </div>

      <div className="bg-white rounded-[20px] py-8 px-10 max-w-[460px] w-full border border-[#E8E6DF] shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-[#888780] font-semibold py-1 mb-4 no-underline">
          ← Back to Home
        </Link>

        <div className="mb-[22px]">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#B4B2A9] mb-1.5">New Account</div>
          <h2 className="text-lg font-extrabold text-[#2C2C2A] font-serif m-0">Create Account</h2>
          <p className="text-[13px] text-[#888780] mt-1.5 leading-normal">Register as an admin or state officer to access the survey portal.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="mb-3.5">
            <div className={labelClass}>Name *</div>
            <input
              type="text"
              value={name}
              onChange={onNameChange}
              placeholder="e.g. Ramesh Kumar"
              className={inputClass(fieldErrors.name, name && !fieldErrors.name)}
              autoComplete="name"
            />
            <FieldError msg={fieldErrors.name} />
          </div>

          {/* Email */}
          <div className="mb-3.5">
            <div className={labelClass}>Email *</div>
            <input
              type="email"
              value={email}
              onChange={onEmailChange}
              onBlur={onEmailBlur}
              placeholder="you@example.gov.in"
              className={inputClass(fieldErrors.email, email && !fieldErrors.email)}
              autoComplete="email"
            />
            <FieldError msg={fieldErrors.email} />
          </div>

          {/* State */}
          <div className="mb-3.5">
            <div className={labelClass}>State / UT *</div>
            <select
              value={state}
              onChange={onSelectChange("state", setState)}
              className={selectClass(fieldErrors.state, state)}
            >
              <option value="">— Select state or union territory —</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <FieldError msg={fieldErrors.state} />
          </div>

          {/* Role */}
          <div className="mb-3.5">
            <div className={labelClass}>Role *</div>
            <select
              value={role}
              onChange={onSelectChange("role", setRole)}
              className={selectClass(fieldErrors.role, role)}
            >
              <option value="">— Select role —</option>
              <option value="admin">Admin</option>
              <option value="officer">Officer</option>
            </select>
            <FieldError msg={fieldErrors.role} />
          </div>

          {/* Password */}
          <div className="mb-3.5">
            <div className={labelClass}>Password *</div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={onPasswordChange}
                placeholder="Min. 8 chars — letter, number & special char"
                className={`${inputClass(fieldErrors.password, password && !fieldErrors.password)} pr-10`}
                autoComplete="new-password"
              />
              <EyeButton show={showPassword} onToggle={() => setShowPassword(v => !v)} />
            </div>
            <PasswordChecklist value={password} />
          </div>

          {/* Confirm Password */}
          <div className="mb-[18px]">
            <div className={labelClass}>Confirm Password *</div>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={onConfirmChange}
                placeholder="Re-enter password"
                className={`${inputClass(fieldErrors.confirmPassword, confirmPassword && !fieldErrors.confirmPassword)} pr-10`}
                autoComplete="new-password"
              />
              <EyeButton show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
            </div>
            <FieldError msg={fieldErrors.confirmPassword} />
          </div>

          {error && (
            <div className="text-xs text-[#A32D2D] bg-[#FCEBEB] border border-[#F5C4C4] rounded-lg py-2.5 px-3 mb-4">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-[13px] rounded-[10px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white border-0 text-sm font-bold cursor-pointer shadow-[0_4px_16px_rgba(24,95,165,0.25)]"
          >
            Create Account →
          </button>
        </form>

        <div className="mt-5 text-xs text-[#888780] text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-[#185FA5] font-bold no-underline">Sign in</Link>
        </div>

        <div className="mt-5 pt-[18px] border-t border-[#F1EFE8] text-[11px] text-[#B4B2A9] text-center leading-normal">
          This is a secure government survey portal.<br />For access issues, contact the GA Wing office.
        </div>
      </div>

      <div className="text-[11px] text-[#B4B2A9] mt-6 text-center">GA Wing IMS · Ministry of Finance · © {new Date().getFullYear()}</div>
    </div>
  );
}
