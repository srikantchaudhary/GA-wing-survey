import { BrowserRouter, Routes, Route, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import AdminSidebar from "./admin/AdminSidebar.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import { initStore, getCurrentUser, logoutUser } from "./store.js";

// Route-level code splitting — each portal/page is loaded on demand.
const AdminPortal = lazy(() => import("./admin/AdminPortal.jsx"));
const OfficerPortal = lazy(() => import("./officer/OfficerPortal.jsx"));
const Dashboard = lazy(() => import("./admin/Dashboard.jsx"));
const StaticForms = lazy(() => import("./admin/StaticForms.jsx"));
const Grievances = lazy(() => import("./admin/Grievances.jsx"));
const FormResponseReport = lazy(() => import("./admin/FormResponseReport.jsx"));
const NotFound = lazy(() => import("./components/NotFound.jsx"));
const Login = lazy(() => import("./auth/Login.jsx"));
const Signup = lazy(() => import("./auth/Signup.jsx"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ga-cream font-sans text-ga-muted">
      Loading…
    </div>
  );
}

initStore().catch(() => {});

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Update page title
  useEffect(() => {
    document.title = "GAMIS - Home";
  }, []);

  // Check authentication state
  useEffect(() => {
    let mounted = true;
    
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUser();

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'gawing_session') {
        fetchUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    // Dispatch storage event to notify other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'gawing_session', newValue: null }));
  };

  const handlePortalClick = () => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "officer") {
        navigate(`/officer/${encodeURIComponent(user.state)}`);
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#F7F5EF_0%,#EAF1FB_60%,#E1F5EE_100%)] font-['DM_Sans','Segoe_UI',sans-serif] flex flex-col">

      {/* Top bar */}
      <header className="h-[60px] bg-white border-b border-[#E8E6DF] flex items-center justify-between px-8 gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[13px] font-extrabold font-serif shrink-0">
            GA
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#2C2C2A] leading-tight font-serif">
              GAMIS
            </div>
            <div className="text-[10px] text-[#888780]">
              Office of the Controller General of Accounts · Ministry of Finance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {loading ? (
            <div className="text-xs text-[#888780]">Loading...</div>
          ) : user ? (
            <>
              <div className="text-xs text-[#888780] mr-2">
                Welcome, <span className="font-bold text-[#2C2C2A]">{user.name}</span>
                {user.role === "admin" && <span className="ml-1 px-2 py-0.5 rounded-full bg-[#E6F1FB] text-[#185FA5] text-[10px] font-bold">ADMIN</span>}
                {user.role === "officer" && <span className="ml-1 px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] text-[10px] font-bold">{user.state}</span>}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-[#A32D2D] bg-white text-xs font-bold text-[#A32D2D] cursor-pointer hover:bg-[#FCEBEB]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg border border-[#185FA5] bg-white text-xs font-bold text-[#185FA5] no-underline cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-xs font-bold text-white no-underline cursor-pointer shadow-[0_2px_8px_rgba(24,95,165,0.2)]"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main content with sidebar for admin */}
      <div className="flex-1 flex">
        {/* Admin Sidebar */}
        {user && user.role === "admin" && <AdminSidebar activePage="home" />}

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 h-full">
        {loading ? (
          <div className="text-center">
            <div className="text-sm text-[#888780]">Loading...</div>
          </div>
        ) : (
          <>
        {/* Hero */}
        <div className="text-center mb-[52px] max-w-[540px]">
          <div className="inline-flex items-center gap-2 bg-[#E6F1FB] border border-[#B5D4F4] rounded-[20px] py-[5px] px-3.5 mb-[18px] text-[11px] font-bold text-[#185FA5] tracking-[0.08em] uppercase">
            IT Systems Access Survey · 2026-27
          </div>
          <h1 className="text-[34px] font-black text-[#2C2C2A] font-serif m-0 mb-3.5 leading-[1.25]">
            GA Wing Management <br />Information System
          </h1>
          <p className="text-sm text-[#5F5E5A] leading-[1.7] m-0">
            Centralized portal for IT systems access survey across all<br />
            A&amp;E offices of the Controller General of Accounts.
          </p>
        </div>

        {/* Two cards */}
        {user ? (
          <div className="max-w-[680px] w-full">
            {user.role === "admin" && (
              <div
                onClick={() => navigate("/admin")}
                className="bg-white border-[1.5px] border-[#E8E6DF] rounded-[18px] py-8 px-7 cursor-pointer transition-all duration-[180ms] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col gap-0 hover:border-[#185FA5] hover:shadow-[0_8px_32px_rgba(24,95,165,0.15)] hover:-translate-y-0.5"
              >
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#185FA5] to-[#1976D2] flex items-center justify-center text-2xl mb-[18px] shadow-[0_4px_14px_rgba(24,95,165,0.25)]">
                  🛠
                </div>

                <div className="text-lg font-extrabold text-[#2C2C2A] mb-2 font-serif">
                  Form Management
                </div>
                <div className="text-xs text-[#888780] leading-[1.6] mb-5 flex-1">
                  Create & manage survey forms, assign states, review submissions, and track analytics.
                </div>

                <div className="flex flex-col gap-1.5 mb-[22px]">
                  {["🛠 Form Builder", "📊 Analytics Dashboard", "📋 Form Lifecycle Management"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-[#5F5E5A] font-medium">
                      <div className="w-[5px] h-[5px] rounded-full bg-[#185FA5] shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-[10px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white text-[13px] font-bold">
                  <span>Enter Admin Portal</span>
                  <span className="text-base">→</span>
                </div>
              </div>
            )}

            {user.role === "officer" && (
              <div
                onClick={() => navigate(`/officer/${encodeURIComponent(user.state)}`)}
                className="bg-white border-[1.5px] border-[#E8E6DF] rounded-[18px] py-8 px-7 cursor-pointer transition-all duration-[180ms] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col gap-0 hover:border-[#0F6E56] hover:shadow-[0_8px_32px_rgba(15,110,86,0.15)] hover:-translate-y-0.5"
              >
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#0F6E56] to-[#1B9E74] flex items-center justify-center text-2xl mb-[18px] shadow-[0_4px_14px_rgba(15,110,86,0.25)]">
                  👤
                </div>

                <div className="text-lg font-extrabold text-[#2C2C2A] mb-2 font-serif">
                  Officer Portal · {user.state}
                </div>
                <div className="text-xs text-[#888780] leading-[1.6] mb-5 flex-1">
                  View and fill survey forms assigned to your state office by the GA Wing administrator.
                </div>

                <div className="flex flex-col gap-1.5 mb-[22px]">
                  {["📍 State-wise form access", "💾 Auto draft save", "✓ Submit & track responses"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-[#5F5E5A] font-medium">
                      <div className="w-[5px] h-[5px] rounded-full bg-[#0F6E56] shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-[10px] bg-gradient-to-br from-[#0F6E56] to-[#185FA5] text-white text-[13px] font-bold">
                  <span>Enter Officer Portal</span>
                  <span className="text-base">→</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 max-w-[680px] w-full">
            {/* Admin Card */}
            <div
              onClick={() => navigate("/admin")}
              className="bg-white border-[1.5px] border-[#E8E6DF] rounded-[18px] py-8 px-7 cursor-pointer transition-all duration-[180ms] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col gap-0 hover:border-[#185FA5] hover:shadow-[0_8px_32px_rgba(24,95,165,0.15)] hover:-translate-y-0.5"
            >
              <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#185FA5] to-[#1976D2] flex items-center justify-center text-2xl mb-[18px] shadow-[0_4px_14px_rgba(24,95,165,0.25)]">
                🛠
              </div>

              <div className="text-lg font-extrabold text-[#2C2C2A] mb-2 font-serif">
                Admin Portal
              </div>
              <div className="text-xs text-[#888780] leading-[1.6] mb-5 flex-1">
                Create & manage survey forms, assign states, review submissions, and track analytics.
              </div>

              <div className="flex flex-col gap-1.5 mb-[22px]">
                {["🛠 Form Builder", "📊 Analytics Dashboard", "📋 Form Lifecycle Management"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[#5F5E5A] font-medium">
                    <div className="w-[5px] h-[5px] rounded-full bg-[#185FA5] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-2.5 px-4 rounded-[10px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white text-[13px] font-bold">
                <span>Enter Admin Portal</span>
                <span className="text-base">→</span>
              </div>
            </div>

            {/* Officer Card */}
            <div
              onClick={() => navigate("/officer")}
              className="bg-white border-[1.5px] border-[#E8E6DF] rounded-[18px] py-8 px-7 cursor-pointer transition-all duration-[180ms] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col gap-0 hover:border-[#0F6E56] hover:shadow-[0_8px_32px_rgba(15,110,86,0.15)] hover:-translate-y-0.5"
            >
              <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#0F6E56] to-[#1B9E74] flex items-center justify-center text-2xl mb-[18px] shadow-[0_4px_14px_rgba(15,110,86,0.25)]">
                👤
              </div>

              <div className="text-lg font-extrabold text-[#2C2C2A] mb-2 font-serif">
                State Officer
              </div>
              <div className="text-xs text-[#888780] leading-[1.6] mb-5 flex-1">
                View and fill survey forms assigned to your state office by the GA Wing administrator.
              </div>

              <div className="flex flex-col gap-1.5 mb-[22px]">
                {["📍 State-wise form access", "💾 Auto draft save", "✓ Submit & track responses"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[#5F5E5A] font-medium">
                    <div className="w-[5px] h-[5px] rounded-full bg-[#0F6E56] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-2.5 px-4 rounded-[10px] bg-gradient-to-br from-[#0F6E56] to-[#185FA5] text-white text-[13px] font-bold">
                <span>Enter Officer Portal</span>
                <span className="text-base">→</span>
              </div>
            </div>
          </div>
        )}

        {/* Auth cards - only show when not logged in */}
        {!user && (
          <>
            <div className="grid grid-cols-2 gap-5 max-w-[680px] w-full mt-5">
              <div
                onClick={() => navigate("/login")}
                className="bg-white border-[1.5px] border-[#E8E6DF] rounded-[18px] py-6 px-7 cursor-pointer transition-all duration-[180ms] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex items-center gap-4 hover:border-[#185FA5] hover:shadow-[0_8px_32px_rgba(24,95,165,0.12)] hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-xl shrink-0 bg-gradient-to-br from-[#185FA5] to-[#1976D2] flex items-center justify-center text-xl">
                  🔐
                </div>
                <div className="flex-1">
                  <div className="text-base font-extrabold text-[#2C2C2A] font-serif">Sign In</div>
                  <div className="text-xs text-[#888780] mt-1">Email and password login</div>
                </div>
                <span className="text-lg text-[#185FA5] font-bold">→</span>
              </div>

              <div
                onClick={() => navigate("/signup")}
                className="bg-white border-[1.5px] border-[#E8E6DF] rounded-[18px] py-6 px-7 cursor-pointer transition-all duration-[180ms] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex items-center gap-4 hover:border-[#0F6E56] hover:shadow-[0_8px_32px_rgba(15,110,86,0.12)] hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-xl shrink-0 bg-gradient-to-br from-[#0F6E56] to-[#1B9E74] flex items-center justify-center text-xl">
                  📝
                </div>
                <div className="flex-1">
                  <div className="text-base font-extrabold text-[#2C2C2A] font-serif">Create Account</div>
                  <div className="text-xs text-[#888780] mt-1">Register as admin or officer</div>
                </div>
                <span className="text-lg text-[#0F6E56] font-bold">→</span>
              </div>
            </div>

            {/* Informational section for non-authenticated users */}
            <div className="max-w-[680px] w-full mt-10">
              <div className="bg-white border-[1.5px] border-[#E8E6DF] rounded-[18px] py-8 px-8 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-extrabold text-[#2C2C2A] font-serif mb-4">About This Portal</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#E6F1FB] flex items-center justify-center text-xl shrink-0">📋</div>
                    <div>
                      <div className="text-sm font-bold text-[#2C2C2A] mb-1">IT Systems Access Survey</div>
                      <div className="text-xs text-[#888780] leading-relaxed">Comprehensive survey of IT systems access across all Accounts & Entitlement offices under the Controller General of Accounts.</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#E1F5EE] flex items-center justify-center text-xl shrink-0">🔒</div>
                    <div>
                      <div className="text-sm font-bold text-[#2C2C2A] mb-1">Secure & Authorized Access</div>
                      <div className="text-xs text-[#888780] leading-relaxed">Role-based access control ensures data security. Admins manage forms, officers submit state-specific responses.</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F7F5EF] flex items-center justify-center text-xl shrink-0">📊</div>
                    <div>
                      <div className="text-sm font-bold text-[#2C2C2A] mb-1">Real-time Analytics</div>
                      <div className="text-xs text-[#888780] leading-relaxed">Track submission progress, view response analytics, and monitor survey completion across all states and union territories.</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-[#F1EFE8]">
                  <div className="text-xs text-[#888780] text-center">
                    <span className="font-semibold text-[#2C2C2A]">Survey Year: 2026-27</span> · Ministry of Finance · Office of the Controller General of Accounts
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom info strip */}
        <div className="mt-10 flex gap-6 text-[11px] text-[#B4B2A9] flex-wrap justify-center">
          {["🔒 Secure Government Portal", "📅 Survey Year 2026-27", "🏛 Ministry of Finance"].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
          </>
        )}
        </div>
      </div>

      {/* Footer */}
      <footer className="h-11 border-t border-[#E8E6DF] bg-white flex items-center justify-center text-[11px] text-[#B4B2A9]">
        GA Wing IMS · Office of the Controller General of Accounts · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function AdminWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "GAMIS - Admin";
  }, []);

  return <AdminPortal onHome={() => navigate("/")} />;
}

function DashboardWrapper() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "admin") {
          navigate("/login");
          return;
        }
        setUser(currentUser);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-ga-cream font-sans text-ga-muted">Loading...</div>;
  }

  return <Dashboard />;
}

function StaticFormsWrapper() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "admin") {
          navigate("/login");
          return;
        }
        setUser(currentUser);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-ga-cream font-sans text-ga-muted">Loading...</div>;
  }

  return <StaticForms />;
}

function GrievancesWrapper() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "GAMIS - Grievances";
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "admin") {
          navigate("/login");
          return;
        }
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-ga-cream font-sans text-ga-muted">Loading...</div>;
  }

  return <Grievances />;
}

function FormResponseReportWrapper() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "GAMIS - Form Response Report";
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "admin") {
          navigate("/login");
          return;
        }
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-ga-cream font-sans text-ga-muted">Loading...</div>;
  }

  return <FormResponseReport />;
}

function OfficerWrapper() {
  const navigate = useNavigate();
  return <OfficerPortal onSwitchToAdmin={() => navigate("/admin")} onHome={() => navigate("/")} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<AdminWrapper />} />
          <Route path="/admin/forms/:formId" element={<AdminWrapper />} />
          <Route path="/admin/dashboard" element={<DashboardWrapper />} />
          <Route path="/admin/static-forms" element={<StaticFormsWrapper />} />
          <Route path="/admin/grievances" element={<GrievancesWrapper />} />
          <Route path="/admin/form-report" element={<FormResponseReportWrapper />} />
          <Route path="/officer" element={<OfficerWrapper />} />
          <Route path="/officer/:state" element={<OfficerWrapper />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
