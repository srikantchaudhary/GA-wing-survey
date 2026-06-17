import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import FormsList from "./FormsList";
import Breadcrumb from "../components/Breadcrumb.jsx";
import OfficerSidebar from "./OfficerSidebar.jsx";
import PendingForms from "./PendingForms.jsx";
import OfficerStaticForms from "./OfficerStaticForms.jsx";
import StaticReportView from "./StaticReportView.jsx";

import { getForms, getCustomSections, getCurrentUser, logoutUser } from "../store.js";

export default function OfficerPortal({ onSwitchToAdmin, onHome }) {
  const [user, setUser] = useState(null);
  const { state: stateParam } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [activePage, setActivePage] = useState("pending-forms");

  // Authentication and role check
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (mounted) {
        if (!currentUser) {
          navigate("/login");
          return;
        }
        if (currentUser.role !== "officer") {
          navigate("/");
          return;
        }
        // Officers must have a state assigned
        if (!currentUser.state) {
          await logoutUser();
          navigate("/login");
          return;
        }
        setUser(currentUser);
        // Set state from user's assigned state
        setState(currentUser.state);
        // Redirect to correct URL if needed
        if (stateParam && decodeURIComponent(stateParam) !== currentUser.state) {
          navigate(`/officer/${encodeURIComponent(currentUser.state)}`, { replace: true });
        }
      }
    };

    fetchUser();

    return () => { mounted = false; };
  }, [navigate, stateParam]);
  const [forms, setForms] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [formsData, sectionsData] = await Promise.all([getForms(), getCustomSections()]);
        if (!cancelled) {
          setForms(formsData || []);
          setCustomSections(sectionsData || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state) {
      document.title = `GA Wing Survey Portal - Officer · ${state}`;
    } else {
      document.title = "GA Wing Survey Portal - Officer";
    }
  }, [state]);

  const handleLogout = async () => {
    await logoutUser();
    // Dispatch storage event to notify other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'gawing_session', newValue: null }));
    navigate("/login", { replace: true });
  };

  // Don't render if user doesn't have a state (needs re-login)
  if (user && user.role === "officer" && !user.state) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-ga-muted">
        <div className="text-center">
          <div className="mb-4">Authentication error: No state assigned to your account.</div>
          <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-4 py-2 text-xs font-semibold text-ga-body">
            Log Out and Re-login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-ga-muted">
        Loading forms…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col font-sans">
      <header className="flex h-[60px] items-center justify-between border-b border-ga-border bg-white px-6">
        <div className="flex items-center gap-3">
          <div onClick={onHome} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] bg-gradient-to-br from-ga-blue to-ga-green font-serif text-[13px] font-extrabold text-white">GA</div>
          <div>
            <div className="font-serif text-[15px] font-bold leading-tight text-ga-ink">GA Wing Survey Portal</div>
            <div className="text-[10px] text-ga-muted">Officer · {state}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">Log Out</button>
          <button onClick={onHome} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🏠 Home</button>
        </div>
      </header>
      <div className="border-b border-ga-border bg-white px-6 py-3">
        <Breadcrumb />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <OfficerSidebar activePage={activePage} onPageChange={setActivePage} />
        <div className="flex-1 overflow-y-auto bg-[#FAFAF8]">
          {activePage === "pending-forms" && (
            <PendingForms
              state={state}
              forms={forms}
              customSections={customSections}
              onLogout={handleLogout}
            />
          )}
          {activePage === "static-forms" && (
            <OfficerStaticForms state={state} onLogout={handleLogout} />
          )}
          {activePage === "static-report" && (
            <StaticReportView state={state} onLogout={handleLogout} />
          )}
        </div>
      </div>
    </div>
  );
}
