import Breadcrumb from "../components/Breadcrumb.jsx";
import { logoutUser } from "../store.js";
import { useNavigate } from "react-router-dom";

export default function TopBar({ onNewForm, onHome }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    // Dispatch storage event to notify other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'gawing_session', newValue: null }));
    navigate("/login", { replace: true });
  };
  return (
    <header className="sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-ga-border bg-white px-6">
      <div className="flex items-center gap-3">
        <div onClick={onHome} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] bg-gradient-to-br from-ga-blue to-ga-green font-serif text-[13px] font-extrabold text-white">GA</div>
        <div>
          <div className="font-serif text-[15px] font-bold leading-tight text-ga-ink">GAMIS</div>
          <div className="text-[10px] text-ga-muted">Admin · Ministry of Finance · IT Systems Access</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onHome} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🏠 Home</button>
        <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🚪 Logout</button>
        <button onClick={onNewForm} className="cursor-pointer rounded-lg border-none bg-ga-blue px-4 py-2 text-xs font-bold text-white">＋ New Form</button>
      </div>
    </header>
  );
}
