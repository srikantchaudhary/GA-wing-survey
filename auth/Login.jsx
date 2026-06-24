import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser, forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from "../store.js";

// ── Eye icons ──────────────────────────────────────────────────────────────────

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

// ── Styles ─────────────────────────────────────────────────────────────────────

const inputClass = (hasError, hasValue) =>
  `w-full box-border outline-none transition-[border-color] duration-150 px-[14px] py-[11px] border-[1.5px] rounded-[10px] text-[13px] text-[#2C2C2A] bg-white ${
    hasError ? "border-[#A32D2D]" : hasValue ? "border-[#0F6E56]" : "border-[#D3D1C7]"
  }`;

const labelClass = "text-[11px] font-bold text-[#5F5E5A] uppercase tracking-[0.05em]";

// ── Component ──────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [fieldErrors, setFieldErrors]   = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Forgot-password modal state
  const [showForgot, setShowForgot]         = useState(false);
  const [forgotStep, setForgotStep]         = useState(1);   // 1 = enter email, 2 = enter code + new pwd
  const [forgotEmail, setForgotEmail]       = useState("");
  const [forgotCode, setForgotCode]         = useState("");
  const [newPwd, setNewPwd]                 = useState("");
  const [confirmPwd, setConfirmPwd]         = useState("");
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [forgotErr, setForgotErr]           = useState("");
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [resetDone, setResetDone]           = useState(false);

  useEffect(() => {
    document.title = "GAMIS - Sign In";
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user) {
          if (user.role === "admin") navigate("/admin/dashboard");
          else if (user.role === "officer") navigate(`/officer/${encodeURIComponent(user.state)}`);
          else navigate("/");
        }
      } catch (err) {
        if (!err.suppressLog) console.error("Auth check failed:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Login submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (Object.keys(errors).length) { setFieldErrors(errors); setError(""); return; }
    try {
      const result = await loginUser(email, password);
      if (!result.ok) { setError(result.error); setFieldErrors({}); return; }
      window.dispatchEvent(new StorageEvent("storage", { key: "gawing_session", newValue: localStorage.getItem("gawing_session") }));
      if (result.user?.role === "admin") navigate("/admin/dashboard");
      else if (result.user?.role === "officer") navigate(`/officer/${encodeURIComponent(result.user.state)}`);
      else navigate("/");
    } catch {
      setError("Could not reach server. Is the backend running?");
    }
  };

  // ── Forgot-password handlers ─────────────────────────────────────────────────

  const openForgot = () => {
    setShowForgot(true);
    setForgotStep(1);
    setForgotEmail("");
    setForgotCode("");
    setNewPwd("");
    setConfirmPwd("");
    setForgotErr("");
    setForgotLoading(false);
    setResetDone(false);
  };

  const closeForgot = () => setShowForgot(false);

  const handleForgotRequest = async () => {
    if (!forgotEmail.trim()) { setForgotErr("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotErr("Enter a valid email address.");
      return;
    }
    setForgotLoading(true);
    setForgotErr("");
    try {
      const result = await apiForgotPassword(forgotEmail.trim());
      if (result.ok === false) { setForgotErr(result.error || "Request failed."); return; }
      setForgotStep(2);
    } catch {
      setForgotErr("Could not reach server.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotCode.trim()) { setForgotErr("Please enter the reset code."); return; }
    if (forgotCode.trim().length !== 6) { setForgotErr("Reset code must be exactly 6 digits."); return; }
    if (!newPwd) { setForgotErr("New password is required."); return; }
    if (newPwd.length < 6) { setForgotErr(`Password must be at least 6 characters (${newPwd.length}/6).`); return; }
    if (newPwd !== confirmPwd) { setForgotErr("Passwords do not match."); return; }
    setForgotLoading(true);
    setForgotErr("");
    try {
      const result = await apiResetPassword(forgotEmail.trim(), forgotCode.trim(), newPwd);
      if (!result.ok) { setForgotErr(result.error || "Reset failed."); return; }
      setResetDone(true);
    } catch {
      setForgotErr("Could not reach server.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col items-center justify-center p-6">

      {/* Brand header */}
      <div className="text-center mb-9">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[22px] font-extrabold font-serif shadow-[0_8px_24px_rgba(24,95,165,0.3)]">
          GA
        </div>
        <div className="text-xl font-extrabold text-[#2C2C2A] font-serif">GAMIS</div>
        <div className="text-xs text-[#888780] mt-1">Office of the Controller General of Accounts · Ministry of Finance</div>
      </div>

      {/* Login card */}
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

          {/* Email */}
          <div className="mb-4">
            <div className={`${labelClass} block mb-1.5`}>Email *</div>
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

          {/* Password — label row has "Forgot password?" link */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className={labelClass}>Password *</span>
              <button
                type="button"
                onClick={openForgot}
                className="text-[11px] text-[#185FA5] font-semibold bg-transparent border-0 cursor-pointer p-0 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); setError(""); }}
                placeholder="Enter your password"
                className={`${inputClass(fieldErrors.password, password)} pr-10`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888780] hover:text-[#5F5E5A] cursor-pointer border-none bg-transparent p-0"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
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

      <div className="text-[11px] text-[#B4B2A9] mt-6 text-center">
        GA Wing IMS · Ministry of Finance · © {new Date().getFullYear()}
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────────────── */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeForgot}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[420px] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
            onClick={e => e.stopPropagation()}
          >

            {resetDone ? (

              /* ── Success screen ── */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
                <h3 className="text-lg font-extrabold text-[#2C2C2A] font-serif mb-2">Password Reset!</h3>
                <p className="text-[13px] text-[#888780] leading-relaxed mb-6">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <button
                  onClick={closeForgot}
                  className="w-full py-[13px] rounded-[10px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white border-0 text-sm font-bold cursor-pointer"
                >
                  Sign In Now →
                </button>
              </div>

            ) : (
              <>

                {/* Modal header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#B4B2A9] mb-1">Account Recovery</div>
                    <h3 className="text-lg font-extrabold text-[#2C2C2A] font-serif m-0">
                      {forgotStep === 1 ? "Forgot Password" : "Reset Password"}
                    </h3>
                  </div>
                  <button
                    onClick={closeForgot}
                    className="text-[#888780] hover:text-[#2C2C2A] bg-transparent border-0 cursor-pointer text-2xl leading-none p-0 mt-0.5"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {/* Step indicator */}
                <div className="flex gap-1.5 mb-5">
                  {[1, 2].map(n => (
                    <div
                      key={n}
                      className={`h-[3px] flex-1 rounded-full transition-colors duration-200 ${n <= forgotStep ? "bg-[#185FA5]" : "bg-[#E8E6DF]"}`}
                    />
                  ))}
                </div>

                {forgotStep === 1 ? (

                  /* ── Step 1: Enter registered email ── */
                  <>
                    <p className="text-[13px] text-[#888780] mb-5 leading-relaxed">
                      Enter your registered email address. A 6-digit reset code will be sent to your inbox.
                    </p>

                    <div className="mb-4">
                      <div className={`${labelClass} block mb-1.5`}>Email Address *</div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => { setForgotEmail(e.target.value); setForgotErr(""); }}
                        onKeyDown={e => e.key === "Enter" && handleForgotRequest()}
                        placeholder="you@example.gov.in"
                        className={inputClass(!!forgotErr, forgotEmail && !forgotErr)}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>

                    {forgotErr && (
                      <div className="text-xs text-[#A32D2D] bg-[#FCEBEB] border border-[#F5C4C4] rounded-lg py-2.5 px-3 mb-4">
                        ⚠ {forgotErr}
                      </div>
                    )}

                    <button
                      onClick={handleForgotRequest}
                      disabled={forgotLoading}
                      className="w-full py-[13px] rounded-[10px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white border-0 text-sm font-bold cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? "Please wait…" : "Generate Reset Code →"}
                    </button>
                  </>

                ) : (

                  /* ── Step 2: Enter OTP + new password ── */
                  <>
                    <div className="bg-[#E6F1FB] border border-[#B8D4F0] rounded-[10px] py-3 px-4 mb-5 text-[12px] text-[#185FA5] leading-relaxed">
                      📧 A 6-digit reset code has been sent to <strong>{forgotEmail}</strong>. Check your inbox (and spam folder).
                    </div>

                    {/* Reset Code input */}
                    <div className="mb-3.5">
                      <div className={`${labelClass} block mb-1.5`}>Reset Code *</div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={forgotCode}
                        onChange={e => { setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setForgotErr(""); }}
                        placeholder="6-digit code"
                        className={inputClass(!!forgotErr, forgotCode)}
                        maxLength={6}
                        autoFocus
                      />
                    </div>

                    {/* New Password */}
                    <div className="mb-3.5">
                      <div className={`${labelClass} block mb-1.5`}>New Password *</div>
                      <div className="relative">
                        <input
                          type={showNewPwd ? "text" : "password"}
                          value={newPwd}
                          onChange={e => { setNewPwd(e.target.value); setForgotErr(""); }}
                          placeholder="At least 6 characters"
                          className={`${inputClass(!!forgotErr, newPwd)} pr-10`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888780] hover:text-[#5F5E5A] cursor-pointer border-none bg-transparent p-0"
                          tabIndex={-1}
                          aria-label={showNewPwd ? "Hide password" : "Show password"}
                        >
                          {showNewPwd ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-4">
                      <div className={`${labelClass} block mb-1.5`}>Confirm New Password *</div>
                      <input
                        type="password"
                        value={confirmPwd}
                        onChange={e => { setConfirmPwd(e.target.value); setForgotErr(""); }}
                        placeholder="Re-enter new password"
                        className={inputClass(
                          !!(forgotErr && confirmPwd && newPwd !== confirmPwd),
                          !!(confirmPwd && newPwd === confirmPwd)
                        )}
                        autoComplete="new-password"
                      />
                    </div>

                    {forgotErr && (
                      <div className="text-xs text-[#A32D2D] bg-[#FCEBEB] border border-[#F5C4C4] rounded-lg py-2.5 px-3 mb-4">
                        ⚠ {forgotErr}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setForgotStep(1); setForgotErr(""); setForgotCode(""); setNewPwd(""); setConfirmPwd(""); }}
                        className="px-5 py-[11px] rounded-[10px] border-[1.5px] border-[#D3D1C7] bg-white text-[13px] font-bold text-[#5F5E5A] cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleResetPassword}
                        disabled={forgotLoading}
                        className="flex-1 py-[13px] rounded-[10px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white border-0 text-sm font-bold cursor-pointer disabled:opacity-60"
                      >
                        {forgotLoading ? "Resetting…" : "Reset Password →"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
