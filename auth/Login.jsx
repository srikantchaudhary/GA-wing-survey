import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "../store.js";

const inputClass = (hasError, hasValue) =>
  `w-full box-border outline-none transition-[border-color] duration-150 px-[14px] py-[11px] border-[1.5px] rounded-[10px] text-[13px] text-[#2C2C2A] bg-white ${
    hasError ? "border-[#A32D2D]" : hasValue ? "border-[#0F6E56]" : "border-[#D3D1C7]"
  }`;

const labelClass = "text-[11px] font-bold text-[#5F5E5A] mb-1.5 uppercase tracking-[0.05em]";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    document.title = "GAMIS - Sign In";

    // Redirect if already logged in
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user) {
          if (user.role === "admin") {
            navigate("/admin/dashboard");
          } else if (user.role === "officer") {
            navigate(`/officer/${encodeURIComponent(user.state)}`);
          } else {
            navigate("/");
          }
        }
      } catch (err) {
        // Silently ignore errors - user is not logged in, which is expected on login page
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
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("");
      return;
    }

    try {
      const result = await loginUser(email, password);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors({});
        return;
      }

      // Dispatch storage event to notify other tabs
      window.dispatchEvent(new StorageEvent('storage', { key: 'gawing_session', newValue: localStorage.getItem('gawing_session') }));

      if (result.user?.role === "admin") {
        navigate("/admin/dashboard");
      } else if (result.user?.role === "officer") {
        navigate(`/officer/${encodeURIComponent(result.user.state)}`);
      } else {
        navigate("/");
      }
    } catch {
      setError("Could not reach server. Is the backend running?");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-9">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[22px] font-extrabold font-serif shadow-[0_8px_24px_rgba(24,95,165,0.3)]">
          GA
        </div>
        <div className="text-xl font-extrabold text-[#2C2C2A] font-serif">GAMIS</div>
        <div className="text-xs text-[#888780] mt-1">Office of the Controller General of Accounts · Ministry of Finance</div>
      </div>

      <div className="bg-white rounded-[20px] py-9 px-10 max-w-[420px] w-full border border-[#E8E6DF] shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <Link to="/" className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-xs text-[#888780] font-semibold py-1 mb-4 no-underline">
          ← Back to Home
        </Link>

        <div className="mb-6">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#B4B2A9] mb-1.5">Account Access</div>
          <h2 className="text-lg font-extrabold text-[#2C2C2A] font-serif m-0">Sign In</h2>
          <p className="text-[13px] text-[#888780] mt-1.5 leading-normal">Enter your registered email and password to access the portal.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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

          <div className="mb-5">
            <div className={labelClass}>Password *</div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); setError(""); }}
              placeholder="Enter your password"
              className={inputClass(fieldErrors.password, password)}
              autoComplete="current-password"
            />
            {fieldErrors.password && <div className="text-[11px] text-[#A32D2D] mt-1">⚠ {fieldErrors.password}</div>}
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
            Sign In →
          </button>
        </form>

        <div className="mt-5 text-xs text-[#888780] text-center">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-[#185FA5] font-bold no-underline">Create account</Link>
        </div>

        <div className="mt-6 pt-5 border-t border-[#F1EFE8] text-[11px] text-[#B4B2A9] text-center leading-normal">
          This is a secure government survey portal.<br />For access issues, contact the GA Wing office.
        </div>
      </div>

      <div className="text-[11px] text-[#B4B2A9] mt-6 text-center">GA Wing IMS · Ministry of Finance · © {new Date().getFullYear()}</div>
    </div>
  );
}
