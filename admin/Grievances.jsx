import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import {
  logoutUser,
  getStates,
  getGrievances,
  saveGrievance,
  updateGrievance,
  deleteGrievance,
} from "../store.js";

const GRIEVANCE_TYPES = [
  "Service Matter",
  "Pay & Allowances",
  "Transfer & Posting",
  "Promotion",
  "Departmental Enquiry",
  "Other",
];

const SELECT_CLS = "appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23888780%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_12px_center] bg-no-repeat pr-9";

const BLANK = { state: "", name: "", type: "", reason: "", file: null };

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Grievances() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { document.title = "GAMIS - Grievances"; }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getStates();
        if (!cancelled) setStates(Array.isArray(s) ? s : []);
      } catch {
        if (!cancelled) setStates([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { loadGrievances(); }, []);

  async function loadGrievances() {
    setLoading(true);
    try {
      const data = await getGrievances();
      setGrievances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load grievances", err);
    } finally {
      setLoading(false);
    }
  }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    await logoutUser();
    window.dispatchEvent(new StorageEvent("storage", { key: "gawing_session", newValue: null }));
    navigate("/login", { replace: true });
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(BLANK);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      state: (item.states && item.states[0]) || "",
      name: item.name || "",
      type: item.type || "",
      reason: item.reason || "",
      file: null,
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.state) { setFormError("Please select a state."); return; }
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.type) { setFormError("Type is required."); return; }
    if (!form.reason.trim()) { setFormError("Reason is required."); return; }

    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        states: [form.state],
        name: form.name.trim(),
        type: form.type,
        reason: form.reason.trim(),
        file: form.file || null,
      };

      if (editItem) {
        const updated = await updateGrievance(editItem.id, payload);
        setGrievances((prev) => prev.map((g) => g.id === updated.id ? updated : g));
        showToast("Grievance updated successfully.");
      } else {
        const created = await saveGrievance(payload);
        setGrievances((prev) => [created, ...prev]);
        showToast("Grievance submitted successfully.");
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to save grievance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGrievance(id);
      setGrievances((prev) => prev.filter((g) => g.id !== id));
      setDeleteConfirm(null);
      showToast("Grievance deleted.", "info");
    } catch (err) {
      showToast(err.message || "Failed to delete.", "error");
    }
  };

  const inputCls = "w-full rounded-lg border border-[#DDD9D0] bg-white px-3 py-2 text-[13px] text-[#2C2C2A] outline-none focus:border-[#185FA5] transition-colors";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-[#888780] mb-1.5";

  return (
    <div className="min-h-screen bg-ga-cream font-sans flex flex-col">
      {/* Header */}
      <header className="h-[60px] bg-white border-b border-[#E8E6DF] flex items-center justify-between px-8 gap-3.5">
        <div className="flex items-center gap-3.5">
          <div
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[13px] font-extrabold font-serif shrink-0 cursor-pointer"
          >
            GA
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#2C2C2A] leading-tight font-serif">GAMIS</div>
            <div className="text-[10px] text-[#888780]">Office of the Controller General of Accounts · Ministry of Finance</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/")} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🏠 Home</button>
          <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🚪 Logout</button>
        </div>
      </header>

      <div className="flex-1 flex">
        <AdminSidebar activePage="grievances" />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-ga-border bg-white px-6 py-3">
            <Breadcrumb />
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-7">
            {/* Page header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-[#2C2C2A] font-serif">Grievances</h1>
                <p className="text-sm text-[#888780] mt-0.5">Manage and track grievance submissions</p>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2.5 text-xs font-bold text-white cursor-pointer border-none hover:bg-[#1552a0] transition-colors shrink-0"
              >
                ＋ Add Grievance
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-[#888780]">Loading…</div>
              ) : grievances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="text-4xl">📋</div>
                  <div className="text-sm font-medium text-[#5F5E5A]">No grievances submitted yet</div>
                  <button onClick={openAdd} className="mt-1 text-xs text-[#185FA5] underline cursor-pointer bg-transparent border-none">
                    Add first grievance
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F7F5EF] border-b border-[#E8E6DF]">
                        {["#", "State", "Name", "Type", "Reason", "File", "Submitted On", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grievances.map((g, i) => (
                        <tr key={g.id} className="border-b border-[#F1EFE8] hover:bg-[#FAFAF8] transition-colors">
                          <td className="px-4 py-3 text-[#888780] text-xs">{i + 1}</td>

                          <td className="px-4 py-3">
                            <span className="inline-block rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-semibold text-[#185FA5]">
                              {(g.states && g.states[0]) || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-medium text-[#2C2C2A] whitespace-nowrap">{g.name}</td>

                          <td className="px-4 py-3">
                            <span className="inline-block rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-semibold text-[#0F6E56] whitespace-nowrap">
                              {g.type}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-[#5F5E5A] max-w-[220px]">
                            <div className="truncate" title={g.reason}>{g.reason}</div>
                          </td>

                          <td className="px-4 py-3">
                            {g.filePath ? (
                              <a
                                href={`/uploads/grievances/${g.filePath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[#185FA5] text-xs underline hover:text-[#1552a0]"
                                title={`${g.fileName} (${fmtSize(g.fileSize)})`}
                              >
                                📎 {g.fileName && g.fileName.length > 18 ? g.fileName.slice(0, 15) + "…" : g.fileName}
                              </a>
                            ) : (
                              <span className="text-[#B4B2A9] text-xs">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-[#888780] text-xs whitespace-nowrap">{fmt(g.createdAt)}</td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEdit(g)}
                                className="text-xs text-[#185FA5] hover:underline cursor-pointer bg-transparent border-none p-0"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(g.id)}
                                className="text-xs text-[#A32D2D] hover:underline cursor-pointer bg-transparent border-none p-0"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6DF]">
              <h2 className="text-[15px] font-extrabold text-[#2C2C2A] font-serif">
                {editItem ? "Edit Grievance" : "Add Grievance"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1EFE8] cursor-pointer border-none text-[#888780] text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
              {/* State single-select */}
              <div>
                <label className={labelCls}>State *</label>
                <select
                  className={`${inputCls} ${SELECT_CLS}`}
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                >
                  <option value="">Select state…</option>
                  {states.map((s) => {
                    const name = s.name || s;
                    return <option key={name} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className={labelCls}>Name *</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Grievance subject / complainant name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Type */}
              <div>
                <label className={labelCls}>Type *</label>
                <select
                  className={`${inputCls} ${SELECT_CLS}`}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="">Select type…</option>
                  {GRIEVANCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className={labelCls}>Reason *</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={4}
                  placeholder="Describe the grievance in detail…"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </div>

              {/* File upload */}
              <div>
                <label className={labelCls}>Attachment</label>
                <input
                  type="file"
                  onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] || null }))}
                  className="w-full text-[13px] text-[#5F5E5A] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E6F1FB] file:text-[#185FA5] hover:file:bg-[#d4e8f8] cursor-pointer"
                />
                {editItem?.fileName && !form.file && (
                  <div className="mt-1 text-[11px] text-[#888780]">
                    Current:{" "}
                    <a
                      href={`/uploads/grievances/${editItem.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#185FA5] underline"
                    >
                      {editItem.fileName}
                    </a>
                    {editItem.fileSize ? ` (${fmtSize(editItem.fileSize)})` : ""}
                  </div>
                )}
                <div className="mt-1 text-[11px] text-[#B4B2A9]">Any file type accepted · Max 20 MB</div>
              </div>

              {formError && (
                <div className="rounded-lg bg-[#FCEBEB] border border-[#F5C6C6] px-3 py-2 text-xs text-[#A32D2D]">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-[#DDD9D0] bg-white py-2.5 text-xs font-semibold text-[#5F5E5A] cursor-pointer hover:bg-[#F7F5EF] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#185FA5] py-2.5 text-xs font-bold text-white cursor-pointer border-none hover:bg-[#1552a0] transition-colors disabled:opacity-60"
                >
                  {submitting ? "Saving…" : editItem ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-[15px] font-extrabold text-[#2C2C2A] mb-2 font-serif">Delete Grievance?</div>
            <p className="text-sm text-[#5F5E5A] mb-6">
              This action cannot be undone. Any uploaded file will also be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-[#DDD9D0] bg-white py-2.5 text-xs font-semibold text-[#5F5E5A] cursor-pointer hover:bg-[#F7F5EF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-lg bg-[#A32D2D] py-2.5 text-xs font-bold text-white cursor-pointer border-none hover:bg-[#8B2020] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[200] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl transition-all ${
            toast.type === "error" ? "bg-[#A32D2D]" : toast.type === "info" ? "bg-[#888780]" : "bg-[#0F6E56]"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
