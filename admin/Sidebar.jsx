import { useState } from "react";
import Badge from "../components/Badge.jsx";

const WORKFLOW_STEPS = [
  { key: "draft",     icon: "✏️", label: "Draft",     desc: "Create & configure form" },
  { key: "review",    icon: "🔍", label: "Review",    desc: "Preview & verify fields"  },
  { key: "published", icon: "🚀", label: "Published", desc: "Live for assigned states" },
];

const WORKFLOW_STEP_CLASS = {
  draft:     "border-ga-purple bg-[#EEEDFE]",
  review:    "border-ga-amber bg-[#FAEEDA]",
  published: "border-ga-green bg-[#E1F5EE]",
};

const TAB_ACTIVE = {
  all:       "border-ga-body text-ga-body",
  published: "border-ga-green text-ga-green",
  draft:     "border-ga-purple text-ga-purple",
  review:    "border-ga-amber text-ga-amber",
};

const TAB_COUNT_ACTIVE = {
  all:       "text-ga-body",
  published: "text-ga-green",
  draft:     "text-ga-purple",
  review:    "text-ga-amber",
};

export default function Sidebar({ forms, activeId, onSelect, onDelete }) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const tabMeta = {
    all:       { label: "All",       color: "#5F5E5A", bg: "#F1EFE8" },
    published: { label: "Published", color: "#0F6E56", bg: "#E1F5EE" },
    draft:     { label: "Draft",     color: "#533AB7", bg: "#EEEDFE" },
    review:    { label: "Review",    color: "#854F0B", bg: "#FAEEDA" },
  };

  const counts = {
    all:       forms.length,
    published: forms.filter(f => f.status === "published").length,
    draft:     forms.filter(f => f.status === "draft").length,
    review:    forms.filter(f => f.status === "review").length,
  };

  const filtered = forms.filter(f => {
    const matchTab = tab === "all" || f.status === tab;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.formId.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = (e, id) => {
    e.stopPropagation();
    onDelete(id);
    setDeleteConfirm(null);
  };

  const handleDeleteCancel = (e) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  return (
    <aside className="flex h-[calc(100vh-60px)] w-[270px] min-w-[270px] flex-col border-r border-ga-border bg-white">

      {/* Search */}
      <div className="shrink-0 border-b border-ga-surface px-3.5 pb-2 pt-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ga-faint">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search forms…"
            className="box-border w-full rounded-lg border-[1.5px] border-ga-border bg-ga-cream py-[7px] pl-[30px] pr-2.5 text-xs text-ga-ink outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-ga-surface">
        {Object.entries(tabMeta).map(([key, meta]) => (
          <div
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 cursor-pointer px-0.5 py-2 text-center transition-all duration-[130ms] border-b-[2.5px] ${
              tab === key ? TAB_ACTIVE[key] : "border-transparent"
            }`}
          >
            <div className={`text-[10px] font-bold uppercase tracking-wide ${tab === key ? TAB_COUNT_ACTIVE[key] : "text-ga-faint"}`}>{meta.label}</div>
            <div className={`mt-px text-[13px] font-extrabold ${tab === key ? TAB_COUNT_ACTIVE[key] : "text-ga-body"}`}>{counts[key]}</div>
          </div>
        ))}
      </div>

      {/* Forms List */}
      <div className="flex-1 overflow-y-auto p-2 px-2.5">
        {filtered.length === 0 && (
          <div className="px-2.5 py-6 text-center text-xs text-ga-faint">
            {search ? `No results for "${search}"` : `No ${tab === "all" ? "" : tab} forms yet`}
          </div>
        )}
        {filtered.map(f => {
          const canDelete = f.status !== "published";
          return (
            <div
              key={f.id}
              onClick={() => onSelect(f.id)}
              className={`relative mb-1 cursor-pointer rounded-[9px] p-2.5 px-3 transition-all duration-[130ms] ${
                f.id === activeId
                  ? "border border-[#B5D4F4] bg-[#E6F1FB]"
                  : "border border-transparent hover:bg-ga-cream"
              }`}
            >
              {/* Delete confirm overlay */}
              {deleteConfirm === f.id && (
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[9px] border-[1.5px] border-[#F1C0C0] bg-[#FEF0F0] p-2.5"
                >
                  <div className="text-center text-[11px] font-bold text-ga-error">Delete this form?</div>
                  <div className="text-center text-[10px] text-ga-muted">This cannot be undone</div>
                  <div className="flex gap-1.5">
                    <button onClick={handleDeleteCancel} className="cursor-pointer rounded-md border border-ga-line bg-ga-surface px-3 py-[5px] text-[11px] font-semibold text-ga-body">Cancel</button>
                    <button onClick={e => handleDeleteConfirm(e, f.id)} className="cursor-pointer rounded-md border-none bg-ga-error px-3 py-[5px] text-[11px] font-bold text-white">Delete</button>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold leading-snug text-ga-ink">{f.name}</div>
                  <div className="mt-0.5 text-[10px] text-ga-muted">
                    {f.formId} · {typeof f.savedAt === "string" && f.savedAt.includes("T") ? new Date(f.savedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : f.savedAt}
                  </div>
                  {f.states?.length > 0 && (
                    <div className="mt-0.5 text-[10px] font-semibold text-ga-green">
                      📍 {f.states.length} state{f.states.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge status={f.status} />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (canDelete) handleDeleteClick(e, f.id);
                    }}
                    disabled={!canDelete}
                    title={canDelete ? "Delete form" : "Published forms cannot be deleted"}
                    className={`flex h-5 w-5 items-center justify-center rounded-[5px] border ${
                      canDelete
                        ? "cursor-pointer border-ga-border bg-ga-cream text-xs text-ga-faint transition-all duration-[120ms] hover:border-[#F1C0C0] hover:bg-[#FCEBEB] hover:text-ga-error"
                        : "cursor-not-allowed border-ga-surface bg-ga-surface/70 text-ga-faint"
                    }`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow guide */}
      <div className="shrink-0 border-t border-ga-surface px-4 py-3.5">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-ga-faint">Workflow</div>
        <div className="flex flex-col">
          {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.key} className={`relative flex gap-2.5 ${i < 2 ? "pb-3" : ""}`}>
                {i < 2 && <div className="absolute bottom-0 left-3.5 top-7 w-px bg-ga-border" />}
                <div
                  className={`z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs ${WORKFLOW_STEP_CLASS[step.key] || "border-ga-faint bg-ga-surface"}`}
                >
                  {step.icon}
                </div>
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-ga-ink">{step.label}</div>
                  <div className="text-[10px] text-ga-muted">{step.desc}</div>
                </div>
              </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
