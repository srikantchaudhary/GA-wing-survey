import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateDdMmYyyy } from "../dateUtils.js";
import {
  logoutUser, getStates,
  getNominations, getMcaMkiRecords,
} from "../store.js";
import { ALL_INDIAN_STATES_AND_UTS } from "../constants.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const SELECT_ARROW =
  "appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23888780%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_12px_center] bg-no-repeat pr-9";

function SortIcon({ active, dir }) {
  return (
    <span className="ml-1 inline-flex flex-col gap-[1px]">
      <svg width="7" height="4" viewBox="0 0 7 4" fill={active && dir === "asc" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2"><path d="M0.5 3.5L3.5 0.5L6.5 3.5" /></svg>
      <svg width="7" height="4" viewBox="0 0 7 4" fill={active && dir === "desc" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2"><path d="M0.5 0.5L3.5 3.5L6.5 0.5" /></svg>
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function StaticForms() {
  const navigate = useNavigate();

  const [states, setStates] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [mcaRecords, setMcaRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reportType, setReportType] = useState("nomination");
  const [filterState, setFilterState] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ col: null, dir: "asc" });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadMenuRef = useRef(null);

  useEffect(() => { document.title = "GAMIS - Static Report"; }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { const s = await getStates(); if (!cancelled) setStates(s); }
      catch { if (!cancelled) setStates(ALL_INDIAN_STATES_AND_UTS); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [noms, mcas] = await Promise.all([getNominations(), getMcaMkiRecords()]);
        if (cancelled) return;
        setNominations(Array.isArray(noms) ? noms : []);
        setMcaRecords(Array.isArray(mcas) ? mcas : []);
      } catch (err) {
        console.error("Failed to load records", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    window.dispatchEvent(new StorageEvent("storage", { key: "gawing_session", newValue: null }));
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target))
        setShowDownloadMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const downloadExcel = () => {
    setShowDownloadMenu(false);
    setDownloading(true);
    try {
      const wb = XLSX.utils.book_new();
      if (reportType === "nomination") {
        const rows = displayRows.map((r, i) => ({
          "S.No": i + 1,
          "State": r.state || "—",
          "Employee Name": r.name || "—",
          "Designation": r.designation || "—",
          "Email": r.email || "—",
          "Mobile": r.mobile || "—",
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Nominations");
        XLSX.writeFile(wb, `GAMIS_Nominations${filterState ? "_" + filterState : ""}.xlsx`);
      } else {
        const rows = displayRows.map((r, i) => ({
          "S.No": i + 1,
          "State": r.state || "—",
          "MCA Due": r.mcaDue ? formatDateDdMmYyyy(r.mcaDue) : "—",
          "MCA Alloc.": r.mcaAlloc ? formatDateDdMmYyyy(r.mcaAlloc) : "—",
          "MCA Comment": r.mcaComment || "—",
          "MKI Due": r.mkiDue ? formatDateDdMmYyyy(r.mkiDue) : "—",
          "MKI Alloc.": r.mkiAlloc ? formatDateDdMmYyyy(r.mkiAlloc) : "—",
          "MKI Comment": r.mkiComment || "—",
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "MCA-MKI");
        XLSX.writeFile(wb, `GAMIS_MCA_MKI${filterState ? "_" + filterState : ""}.xlsx`);
      }
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Failed to export Excel.");
    } finally {
      setDownloading(false);
    }
  };

  const downloadPdf = () => {
    setShowDownloadMenu(false);
    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const title = reportType === "nomination"
        ? "Nomination of DA Cadre Officials"
        : "MCA / MKI Records";
      const subtitle = filterState ? `State: ${filterState}` : "All States";

      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text(`GAMIS — ${title}`, 14, 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`${subtitle} · Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 22);
      doc.setTextColor(0);

      if (reportType === "nomination") {
        autoTable(doc, {
          startY: 28,
          head: [["S.No", "State", "Employee Name", "Designation", "Email", "Mobile"]],
          body: displayRows.length
            ? displayRows.map((r, i) => [i + 1, r.state || "—", r.name || "—", r.designation || "—", r.email || "—", r.mobile || "—"])
            : [["—", "No data", "", "", "", ""]],
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [24, 95, 165], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
        });
        doc.save(`GAMIS_Nominations${filterState ? "_" + filterState : ""}.pdf`);
      } else {
        autoTable(doc, {
          startY: 28,
          head: [["S.No", "State", "MCA Due", "MCA Alloc.", "MCA Comment", "MKI Due", "MKI Alloc.", "MKI Comment"]],
          body: displayRows.length
            ? displayRows.map((r, i) => [
                i + 1, r.state || "—",
                r.mcaDue ? formatDateDdMmYyyy(r.mcaDue) : "—",
                r.mcaAlloc ? formatDateDdMmYyyy(r.mcaAlloc) : "—",
                r.mcaComment || "—",
                r.mkiDue ? formatDateDdMmYyyy(r.mkiDue) : "—",
                r.mkiAlloc ? formatDateDdMmYyyy(r.mkiAlloc) : "—",
                r.mkiComment || "—",
              ])
            : [["—", "No data", "", "", "", "", "", ""]],
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [15, 110, 86], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
        });
        doc.save(`GAMIS_MCA_MKI${filterState ? "_" + filterState : ""}.pdf`);
      }
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const toggleSort = (col) =>
    setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const applyFilters = (rows, type) => {
    let result = rows.filter(r => {
      if (filterState && r.state !== filterState) return false;
      if (filterMonth) {
        if (type === "mca") {
          const hasMcaMonth = [r.mcaDue, r.mcaAlloc, r.mkiDue, r.mkiAlloc]
            .some(d => d && d.slice(5, 7) === filterMonth);
          if (!hasMcaMonth) return false;
        } else {
          if (r.createdAt?.slice(5, 7) !== filterMonth) return false;
        }
      }
      if (search) {
        const s = search.toLowerCase();
        if (!Object.values(r).some(v => String(v ?? "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
    if (sort.col) {
      result = [...result].sort((a, b) => {
        const av = String(a[sort.col] ?? "").toLowerCase();
        const bv = String(b[sort.col] ?? "").toLowerCase();
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  };

  const filteredNoms = useMemo(() => applyFilters(nominations, "nomination"), [nominations, filterState, filterMonth, search, sort]);
  const filteredMcas = useMemo(() => applyFilters(mcaRecords, "mca"), [mcaRecords, filterState, filterMonth, search, sort]);

  const displayRows = reportType === "nomination" ? filteredNoms : filteredMcas;
  const totalRows = reportType === "nomination" ? nominations.length : mcaRecords.length;
  const hasFilters = filterState || filterMonth || search;

  const thCls = "px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted cursor-pointer select-none hover:text-ga-ink whitespace-nowrap";
  const tdCls = "px-3 py-3";
  const selectCls = `${SELECT_ARROW} rounded-lg border border-ga-line bg-white py-2 pl-3 text-[13px] text-ga-ink outline-none focus:border-ga-blue transition-colors`;

  return (
    <div className="min-h-screen bg-ga-cream font-sans flex flex-col">
      {/* Navbar */}
      <header className="h-[60px] bg-white border-b border-[#E8E6DF] flex items-center justify-between px-8 gap-3.5">
        <div className="flex items-center gap-3.5">
          <div onClick={() => navigate("/")} className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[13px] font-extrabold font-serif shrink-0 cursor-pointer">
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
        <AdminSidebar activePage="static-forms" />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-ga-border bg-white px-6 py-3">
            <Breadcrumb />
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-7">

            {/* Page header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-ga-ink font-serif">Static Report</h1>
                <p className="mt-1 text-[13px] text-ga-muted">View DA cadre nominations and MCA/MKI records</p>
              </div>

              {/* Download dropdown */}
              <div className="relative shrink-0" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu(v => !v)}
                  disabled={downloading || loading}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-ga-blue px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(24,95,165,0.25)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloading ? "Downloading…" : "Download"}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showDownloadMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-ga-border bg-white shadow-[0_8px_28px_rgba(0,0,0,0.13)]">
                    <div className="border-b border-ga-border bg-ga-cream px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ga-muted">
                      Choose Format
                    </div>
                    <button
                      onClick={downloadExcel}
                      className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4 py-3 text-left text-[13px] font-semibold text-ga-ink hover:bg-ga-cream transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E1F5EE] text-[15px]">📊</span>
                      Download as Excel
                      <span className="ml-auto text-[10px] text-ga-muted">.xlsx</span>
                    </button>
                    <button
                      onClick={downloadPdf}
                      className="flex w-full cursor-pointer items-center gap-3 border-none border-t border-ga-line bg-transparent px-4 py-3 text-left text-[13px] font-semibold text-ga-ink hover:bg-ga-cream transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FAEEDA] text-[15px]">📄</span>
                      Download as PDF
                      <span className="ml-auto text-[10px] text-ga-muted">.pdf</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filter bar */}
            <div className="rounded-2xl border border-ga-border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] px-6 py-5 mb-6">
              <div className="flex flex-wrap items-end gap-4">

                {/* Report type toggle */}
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ga-muted">Report Type</p>
                  <div className="flex rounded-lg border border-ga-line overflow-hidden">
                    <button
                      onClick={() => { setReportType("nomination"); setSort({ col: null, dir: "asc" }); }}
                      className={`px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer border-none ${reportType === "nomination" ? "bg-ga-blue text-white" : "bg-white text-ga-body hover:bg-ga-cream"}`}
                    >
                      Nomination
                    </button>
                    <button
                      onClick={() => { setReportType("mca"); setSort({ col: null, dir: "asc" }); }}
                      className={`px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer border-none border-l border-ga-line ${reportType === "mca" ? "bg-ga-blue text-white" : "bg-white text-ga-body hover:bg-ga-cream"}`}
                    >
                      MCA / MKI
                    </button>
                  </div>
                </div>

                {/* State filter */}
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ga-muted">State</p>
                  <select value={filterState} onChange={e => setFilterState(e.target.value)} className={selectCls}>
                    <option value="">All States</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Month filter */}
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ga-muted">Month</p>
                  <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={selectCls}>
                    <option value="">All Months</option>
                    {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ga-muted">Search</p>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ga-faint"><SearchIcon /></span>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search across all fields…"
                      className="w-full rounded-lg border border-ga-line bg-white py-2 pl-9 pr-3 text-[13px] text-ga-ink placeholder:text-ga-faint outline-none focus:border-ga-blue"
                    />
                  </div>
                </div>

                {/* Clear filters */}
                {hasFilters && (
                  <button
                    onClick={() => { setFilterState(""); setFilterMonth(""); setSearch(""); }}
                    className="cursor-pointer rounded-lg border border-ga-line bg-ga-cream px-4 py-2 text-[13px] font-semibold text-ga-body hover:bg-ga-border transition-colors self-end"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-ga-border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)]">

              <div className="flex items-center justify-between border-b border-ga-border bg-ga-cream px-6 py-4">
                <h2 className="font-bold text-ga-ink">
                  {reportType === "nomination" ? "Nomination of DA Cadre Official" : "MCA / MKI Records"}
                </h2>
                <span className="text-[12px] text-ga-muted">
                  {loading ? "Loading…" : `${displayRows.length} of ${totalRows} record${totalRows !== 1 ? "s" : ""}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                {reportType === "nomination" ? (
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-ga-border bg-ga-cream/50">
                        <th className="w-12 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">S.NO</th>
                        {[["state", "STATE"], ["name", "EMPLOYEE NAME"], ["designation", "DESIGNATION"], ["email", "EMAIL"], ["mobile", "MOBILE"]].map(([col, label]) => (
                          <th key={col} className={thCls} onClick={() => toggleSort(col)}>
                            <span className="flex items-center gap-1">{label} </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-[13px] text-ga-muted">Loading records…</td></tr>
                      ) : filteredNoms.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[13px] text-ga-muted">
                            {nominations.length === 0 ? "No nomination records found." : "No records match the selected filters."}
                          </td>
                        </tr>
                      ) : filteredNoms.map((r, i) => (
                        <tr key={r.id} className="border-t border-ga-border hover:bg-ga-cream/30 transition-colors">
                          <td className={`${tdCls} text-ga-muted`}>{i + 1}</td>
                          <td className={tdCls}>{r.state}</td>
                          <td className={`${tdCls} font-semibold`}>{r.name}</td>
                          <td className={tdCls}>{r.designation}</td>
                          <td className={tdCls}>{r.email}</td>
                          <td className={tdCls}>{r.mobile}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-ga-border bg-ga-cream/50">
                        <th className="w-12 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ga-muted">S.NO</th>
                        {[["state", "STATE"], ["mcaDue", "MCA DUE"], ["mcaAlloc", "MCA ALLOC."], ["mcaComment", "MCA COMMENT"], ["mkiDue", "MKI DUE"], ["mkiAlloc", "MKI ALLOC."], ["mkiComment", "MKI COMMENT"]].map(([col, label]) => (
                          <th key={col} className={thCls} onClick={() => toggleSort(col)}>
                            <span className="flex items-center gap-1">{label} </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={8} className="px-6 py-12 text-center text-[13px] text-ga-muted">Loading records…</td></tr>
                      ) : filteredMcas.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-[13px] text-ga-muted">
                            {mcaRecords.length === 0 ? "No MCA/MKI records found." : "No records match the selected filters."}
                          </td>
                        </tr>
                      ) : filteredMcas.map((r, i) => (
                        <tr key={r.id} className="border-t border-ga-border hover:bg-ga-cream/30 transition-colors">
                          <td className={`${tdCls} text-ga-muted`}>{i + 1}</td>
                          <td className={`${tdCls} font-semibold`}>{r.state}</td>
                          <td className={tdCls}>{r.mcaDue ? formatDateDdMmYyyy(r.mcaDue) : "—"}</td>
                          <td className={tdCls}>{r.mcaAlloc ? formatDateDdMmYyyy(r.mcaAlloc) : "—"}</td>
                          <td className={`${tdCls} max-w-[200px] truncate`} title={r.mcaComment || ""}>{r.mcaComment || "—"}</td>
                          <td className={tdCls}>{r.mkiDue ? formatDateDdMmYyyy(r.mkiDue) : "—"}</td>
                          <td className={tdCls}>{r.mkiAlloc ? formatDateDdMmYyyy(r.mkiAlloc) : "—"}</td>
                          <td className={`${tdCls} max-w-[200px] truncate`} title={r.mkiComment || ""}>{r.mkiComment || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {!loading && displayRows.length > 0 && (
                <div className="border-t border-ga-border bg-ga-cream/40 px-6 py-3 text-[12px] text-ga-muted">
                  Showing {displayRows.length} of {totalRows} record{totalRows !== 1 ? "s" : ""}
                  {hasFilters && <span className="ml-1 text-ga-blue font-medium">(filtered)</span>}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
