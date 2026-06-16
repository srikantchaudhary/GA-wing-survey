import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getForms, saveForm, publishForm, deleteFormById, getCustomSections, saveCustomSection, removeCustomSection, getCurrentUser, logoutUser } from "../store.js";
import Toast from "../components/Toast.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import Sidebar from "./Sidebar.jsx";
import Editor from "./Editor.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

export default function AdminPortal({ onHome }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { formId: formIdParam } = useParams();

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
        if (currentUser.role !== "admin") {
          navigate("/");
          return;
        }
        setUser(currentUser);
      }
    };
    
    fetchUser();
    
    return () => { mounted = false; };
  }, [navigate]);

  const [forms, setForms]         = useState([]);
  const [customSections, setCS]   = useState([]);
  const [activeId, setActiveId]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState({ msg: "", type: "", visible: false });
  const toastRef                  = useRef();
  const isUserInitiatedRef         = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [formsData, sectionsData] = await Promise.all([getForms(), getCustomSections()]);
        if (cancelled) return;
        setForms(formsData || []);
        setCS(sectionsData || []);
        setActiveId(formsData?.[0]?.id ?? null);
      } catch {
        if (!cancelled) showToast("Failed to load data from server", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (formIdParam) {
      const form = forms.find(f => f.formId === formIdParam);
      if (form && form.id !== activeId) {
        setActiveId(form.id);
      }
    }
  }, [formIdParam, forms, activeId]);

  useEffect(() => {
    if (activeId && isUserInitiatedRef.current) {
      const form = forms.find(f => f.id === activeId);
      if (form && form.formId !== formIdParam) {
        navigate(`/admin/forms/${form.formId}`, { replace: true });
      }
      isUserInitiatedRef.current = false;
    }
  }, [activeId, forms, formIdParam, navigate]);

  useEffect(() => {
    const form = forms.find(f => f.id === activeId);
    if (form) {
      document.title = `GA Wing Survey Portal - Admin · ${form.name}`;
    } else {
      document.title = "GA Wing Survey Portal - Admin · Form Builder";
    }
  }, [activeId, forms]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type, visible: true });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  };

  const handleUpdate = async (id, patch) => {
    const updated = forms.map(f => f.id === id ? { ...f, ...patch } : f);
    setForms(updated);
    try {
      const newForms = await saveForm(updated.find(f => f.id === id));
      setForms(newForms);
    } catch {
      showToast("Failed to save changes", "error");
    }
  };

  const handleSaveDraft = async (id) => {
    const form = forms.find(f => f.id === id);
    try {
      const newForms = await saveForm({ ...form, status: "draft" });
      setForms(newForms);
      showToast("💾 Saved as Draft", "draft");
    } catch {
      showToast("Failed to save draft", "error");
    }
  };

  const handleSendReview = async (id) => {
    const form = forms.find(f => f.id === id);
    try {
      const newForms = await saveForm({ ...form, status: "review" });
      setForms(newForms);
      showToast("🔍 Sent for Review", "review");
    } catch {
      showToast("Failed to send for review", "error");
    }
  };

  const handlePublish = async (id) => {
    const form = forms.find(f => f.id === id);
    try {
      const newForms = await publishForm(id, form.states);
      setForms(newForms);
      showToast(`🚀 Published for ${form.states.length} state${form.states.length > 1 ? "s" : ""}!`, "success");
    } catch {
      showToast("Failed to publish", "error");
    }
  };

  const handleClone = async (id) => {
    const f = forms.find(x => x.id === id);
    const newId = Date.now();
    try {
      const newForms = await saveForm({
        ...f,
        id: newId,
        name: `${f.name} (Copy)`,
        status: "draft",
        states: [],
        formId: `GAW-CLONE-${newId.toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
      });
      setForms(newForms);
      isUserInitiatedRef.current = true;
      setActiveId(newId);
      showToast("🔀 Cloned to new Draft", "draft");
    } catch {
      showToast("Failed to clone form", "error");
    }
  };

  const handleNewForm = async () => {
    const newId = Date.now();
    try {
      const newForms = await saveForm({
        id: newId,
        name: `New Survey Form ${forms.length + 1}`,
        sections: [],
        states: [],
        status: "draft",
        surveyYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(2)}`,
        description: "",
        formId: `GAW-NEW-${newId.toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      });
      setForms(newForms);
      isUserInitiatedRef.current = true;
      setActiveId(newId);
      showToast("✚ New form created", "draft");
    } catch {
      showToast("Failed to create form", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const newForms = await deleteFormById(id);
      setForms(newForms);
      if (activeId === id) {
        isUserInitiatedRef.current = true;
        setActiveId(newForms[0]?.id || null);
      }
      showToast("🗑 Form deleted", "error");
    } catch (err) {
      showToast(err?.message || "Failed to delete form", "error");
    }
  };

  const handleAddCustom = async (sec) => {
    try {
      const sections = await saveCustomSection(sec);
      setCS(sections);
      showToast(`✓ Section "${sec.label}" created!`, "success");
    } catch {
      showToast("Failed to save section", "error");
    }
  };

  const handleRemoveCustom = async (id) => {
    try {
      setCS(await removeCustomSection(id));
    } catch {
      showToast("Failed to remove section", "error");
    }
  };

  const handleSelectForm = (id) => {
    isUserInitiatedRef.current = true;
    setActiveId(id);
  };

  const handleLogout = () => {
    logoutUser();
    window.dispatchEvent(new StorageEvent('storage', { key: 'gawing_session', newValue: null }));
    navigate("/login");
  };

  const activeForm = forms.find(f => f.id === activeId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ga-cream font-sans text-ga-muted">
        Loading admin portal…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ga-cream font-sans flex flex-col">
      {/* Navbar */}
      <header className="h-[60px] bg-white border-b border-[#E8E6DF] flex items-center justify-between px-8 gap-3.5">
        <div className="flex items-center gap-3.5">
          <div onClick={() => navigate("/")} className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[13px] font-extrabold font-serif shrink-0 cursor-pointer">
            GA
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#2C2C2A] leading-tight font-serif">
              GA Wing Survey Portal
            </div>
            <div className="text-[10px] text-[#888780]">
              Office of the Controller General of Accounts · Ministry of Finance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/")} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🏠 Home</button>
          <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🚪 Logout</button>
          <button onClick={handleNewForm} className="cursor-pointer rounded-lg border-none bg-ga-blue px-4 py-2 text-xs font-bold text-white">＋ New Form</button>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex-1 flex">
        <AdminSidebar activePage="admin" />
        <div className="flex-1 flex flex-col">
          <div className="border-b border-ga-border bg-white px-6 py-3">
            <Breadcrumb />
          </div>

          <div className="flex h-[calc(100vh-168px)]">
            <Sidebar forms={forms} activeId={activeId} onSelect={handleSelectForm} onDelete={handleDelete} />
            {activeForm ? (
              <Editor form={activeForm} onUpdate={handleUpdate} onSaveDraft={handleSaveDraft} onSendReview={handleSendReview} onPublish={handlePublish} onClone={handleClone} customSections={customSections} onAddCustom={handleAddCustom} onRemoveCustom={handleRemoveCustom} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ga-muted">
                <div className="text-4xl">📋</div>
                <div className="font-bold text-ga-ink">No forms yet</div>
                <button onClick={handleNewForm} className="cursor-pointer rounded-lg border-none bg-ga-blue px-5 py-2.5 text-[13px] font-bold text-white">＋ Create First Form</button>
              </div>
            )}
          </div>

          <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
        </div>
      </div>
    </div>
  );
}
