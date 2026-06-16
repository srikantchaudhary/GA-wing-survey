import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ALL_INDIAN_STATES_AND_UTS } from "../constants.js";
import { registerUser, getCurrentUser, getStates } from "../store.js";

const inputClass = (hasError, hasValue) =>
  `w-full box-border outline-none transition-[border-color] duration-150 px-[14px] py-[11px] border-[1.5px] rounded-[10px] text-[13px] text-[#2C2C2A] bg-white ${
    hasError ? "border-[#A32D2D]" : hasValue ? "border-[#0F6E56]" : "border-[#D3D1C7]"
  }`;

const selectClass = (hasError, hasValue) =>
  `${inputClass(hasError, hasValue)} appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_14px_center] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20d=%27M1%201l5%205%205-5%27%20stroke=%27%23888780%27%20stroke-width=%271.5%27%20fill=%27none%27/%3E%3C/svg%3E')]`;

const labelClass = "text-[11px] font-bold text-[#5F5E5A] mb-1.5 uppercase tracking-[0.05em]";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [states, setStates] = useState(ALL_INDIAN_STATES_AND_UTS);

  // Load the authoritative states list from the API (fallback: bundled list).
  useEffect(() => {
    let mounted = true;
    getStates()
      .then(list => { if (mounted && list.length) setStates(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    document.title = "GA Wing Survey Portal - Sign Up";
    
    // Redirect if already logged in
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user) {
          if (user.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate(`/officer/${encodeURIComponent(user.state)}`);
          }
        }
      } catch (err) {
        // Silently ignore errors - user is not logged in, which is expected on signup page
        if (!err.suppressLog) {
          console.error("Auth check failed:", err);
        }
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!state) errors.state = "Please select your state or UT.";
    if (!role) errors.role = "Please select a role.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("");
      return;
    }

    try {
      const result = await registerUser({ name, email, state, role, password });
      if (!result.ok) {
        setError(result.error);
        setFieldErrors({});
        return;
      }
      navigate("/login");
    } catch {
      setError("Could not reach server. Is the backend running?");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-7">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[22px] font-extrabold font-serif shadow-[0_8px_24px_rgba(24,95,165,0.3)]">
          GA
        </div>
        <div className="text-xl font-extrabold text-[#2C2C2A] font-serif">GA Wing Survey Portal</div>
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

        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <div className={labelClass}>Name *</div>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: "" })); setError(""); }}
              placeholder="Full name"
              className={inputClass(fieldErrors.name, name)}
              autoComplete="name"
            />
            {fieldErrors.name && <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {fieldErrors.name}</div>}
          </div>

          <div className="mb-3.5">
            <div className={labelClass}>Email *</div>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); setError(""); }}
              placeholder="you@example.gov.in"
              className={inputClass(fieldErrors.email, email)}
              autoComplete="email"
            />
            {fieldErrors.email && <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {fieldErrors.email}</div>}
          </div>

          <div className="mb-3.5">
            <div className={labelClass}>State / UT *</div>
            <select
              value={state}
              onChange={e => { setState(e.target.value); setFieldErrors(p => ({ ...p, state: "" })); setError(""); }}
              className={selectClass(fieldErrors.state, state)}
            >
              <option value="">— Select state or union territory —</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {fieldErrors.state && <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {fieldErrors.state}</div>}
          </div>

          <div className="mb-3.5">
            <div className={labelClass}>Role *</div>
            <select
              value={role}
              onChange={e => { setRole(e.target.value); setFieldErrors(p => ({ ...p, role: "" })); setError(""); }}
              className={selectClass(fieldErrors.role, role)}
            >
              <option value="">— Select role —</option>
              <option value="admin">Admin</option>
              <option value="officer">Officer</option>
            </select>
            {fieldErrors.role && <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {fieldErrors.role}</div>}
          </div>

          <div className="mb-3.5">
            <div className={labelClass}>Password *</div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); setError(""); }}
              placeholder="At least 6 characters"
              className={inputClass(fieldErrors.password, password)}
              autoComplete="new-password"
            />
            {fieldErrors.password && <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {fieldErrors.password}</div>}
          </div>

          <div className="mb-[18px]">
            <div className={labelClass}>Confirm Password *</div>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: "" })); setError(""); }}
              placeholder="Re-enter password"
              className={inputClass(fieldErrors.confirmPassword, confirmPassword)}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {fieldErrors.confirmPassword}</div>}
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
