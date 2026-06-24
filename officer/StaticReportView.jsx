import { useState, useEffect, useRef } from "react";
import { getNominations, getMcaMkiRecords } from "../store.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function StaticReportView({ state, onLogout }) {
  const [downloading, setDownloading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    document.title = "GAMIS - Static Report";
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAllData = async () => {
    const [nominations, mcaMki] = await Promise.all([
      getNominations().catch(() => []),
      getMcaMkiRecords().catch(() => []),
    ]);
    const stateNominations = (nominations || []).filter(
      n => (n.state || "").toLowerCase() === state.toLowerCase()
    );
    const stateMcaMki = (mcaMki || []).filter(
      r => (r.state || "").toLowerCase() === state.toLowerCase()
    );
    return { nominations: stateNominations, mcaMki: stateMcaMki };
  };

  const downloadExcel = async () => {
    setShowMenu(false);
    setDownloading(true);
    try {
      const { nominations, mcaMki } = await fetchAllData();

      const wb = XLSX.utils.book_new();

      // Nominations sheet
      const nomRows = nominations.length
        ? nominations.map((n, i) => ({
            "S.No": i + 1,
            "Name": n.name || "—",
            "Designation": n.designation || "—",
            "State": n.state || "—",
            "Category": n.category || "—",
            "Submitted At": n.created_date ? new Date(n.created_date).toLocaleDateString("en-IN") : "—",
          }))
        : [{ "S.No": "—", "Name": "No data", "Designation": "", "State": "", "Category": "", "Submitted At": "" }];
      const nomSheet = XLSX.utils.json_to_sheet(nomRows);
      XLSX.utils.book_append_sheet(wb, nomSheet, "Nominations");

      // MCA-MKI sheet
      const mcaRows = mcaMki.length
        ? mcaMki.map((r, i) => ({
            "S.No": i + 1,
            "Name": r.name || "—",
            "Type": r.type || "—",
            "State": r.state || "—",
            "Details": r.details || "—",
            "Submitted At": r.created_date ? new Date(r.created_date).toLocaleDateString("en-IN") : "—",
          }))
        : [{ "S.No": "—", "Name": "No data", "Type": "", "State": "", "Details": "", "Submitted At": "" }];
      const mcaSheet = XLSX.utils.json_to_sheet(mcaRows);
      XLSX.utils.book_append_sheet(wb, mcaSheet, "MCA-MKI");

      XLSX.writeFile(wb, `GAMIS_Static_Report_${state}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Failed to export Excel. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const downloadPdf = async () => {
    setShowMenu(false);
    setDownloading(true);
    try {
      const { nominations, mcaMki } = await fetchAllData();

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`GAMIS — Static Report: ${state}`, 14, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 23);
      doc.setTextColor(0);

      // Nominations table
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Nominations", 14, 33);

      autoTable(doc, {
        startY: 37,
        head: [["S.No", "Name", "Designation", "State", "Category", "Submitted At"]],
        body: nominations.length
          ? nominations.map((n, i) => [
              i + 1,
              n.name || "—",
              n.designation || "—",
              n.state || "—",
              n.category || "—",
              n.created_date ? new Date(n.created_date).toLocaleDateString("en-IN") : "—",
            ])
          : [["—", "No data", "", "", "", ""]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [24, 95, 165], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // MCA-MKI table on next page
      doc.addPage();
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("MCA / MKI Records", 14, 16);

      autoTable(doc, {
        startY: 20,
        head: [["S.No", "Name", "Type", "State", "Details", "Submitted At"]],
        body: mcaMki.length
          ? mcaMki.map((r, i) => [
              i + 1,
              r.name || "—",
              r.type || "—",
              r.state || "—",
              r.details || "—",
              r.created_date ? new Date(r.created_date).toLocaleDateString("en-IN") : "—",
            ])
          : [["—", "No data", "", "", "", ""]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 110, 86], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`GAMIS_Static_Report_${state}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full overflow-y-auto px-8 py-7 bg-[#FAFAF8]">
      <div className="mx-auto max-w-[1000px]">

        {/* Page header with Download button */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-extrabold text-ga-ink font-serif">{state} — Static Report</h1>
            <p className="text-sm text-ga-muted">View and download static reports for {state}</p>
          </div>

          {/* Download dropdown */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(v => !v)}
              disabled={downloading}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-ga-blue px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(24,95,165,0.25)] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <DownloadIcon />
              {downloading ? "Downloading…" : "Download Report"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-ga-border bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ga-muted border-b border-ga-border bg-ga-cream">
                  Choose Format
                </div>
                <button
                  onClick={downloadExcel}
                  className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4 py-3 text-[13px] font-semibold text-ga-ink hover:bg-ga-cream transition-colors text-left"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E1F5EE] text-[16px]">📊</span>
                  Download as Excel
                  <span className="ml-auto text-[10px] text-ga-muted">.xlsx</span>
                </button>
                <button
                  onClick={downloadPdf}
                  className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4 py-3 text-[13px] font-semibold text-ga-ink hover:bg-ga-cream transition-colors text-left border-t border-ga-line"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FAEEDA] text-[16px]">📄</span>
                  Download as PDF
                  <span className="ml-auto text-[10px] text-ga-muted">.pdf</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Nomination Report Card */}
          <div className="overflow-hidden rounded-2xl border border-ga-border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ga-border bg-ga-cream px-6 py-4">
              <div className="flex items-center gap-2.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <rect x="9" y="9" width="6" height="2" />
                </svg>
                <span className="text-base font-bold text-ga-ink">Nomination Report</span>
              </div>
              <span className="rounded-md border border-[#B5D4F4] bg-[#E6F1FB] px-2.5 py-1 text-xs font-semibold text-ga-blue">Report 1</span>
            </div>

            <div className="px-6 py-6">
              <div className="mb-4">
                <p className="text-sm text-ga-muted mb-2">DA Cadre Official Nominations submitted for {state}</p>
                <div className="rounded-lg bg-ga-cream p-4 text-center">
                  <div className="text-2xl font-bold text-ga-blue">—</div>
                  <div className="text-xs text-ga-muted mt-1">Total Nominations</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm py-2 border-b border-ga-line">
                  <span className="text-ga-muted">Status</span>
                  <span className="font-semibold text-ga-ink">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-ga-muted">Last Updated</span>
                  <span className="font-semibold text-ga-ink">—</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-ga-border bg-ga-cream px-6 py-4">
              <button className="flex-1 cursor-pointer rounded-lg border border-ga-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ga-body hover:bg-ga-cream transition-colors">View Details</button>
              <button onClick={downloadPdf} className="flex-1 cursor-pointer rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-4 py-2.5 text-[13px] font-bold text-ga-blue hover:bg-[#D6E8F7] transition-colors">Download PDF</button>
            </div>
          </div>

          {/* MCA / MKI Report Card */}
          <div className="overflow-hidden rounded-2xl border border-ga-border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ga-border bg-ga-cream px-6 py-4">
              <div className="flex items-center gap-2.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 11h6M9 15h6M9 7h6" />
                </svg>
                <span className="text-base font-bold text-ga-ink">MCA / MKI Report</span>
              </div>
              <span className="rounded-md border border-[#B5D4F4] bg-[#E6F1FB] px-2.5 py-1 text-xs font-semibold text-ga-blue">Report 2</span>
            </div>

            <div className="px-6 py-6">
              <div className="mb-4">
                <p className="text-sm text-ga-muted mb-2">Mutual Credit Arrangement and Multilateral Cooperation records for {state}</p>
                <div className="rounded-lg bg-ga-cream p-4 text-center">
                  <div className="text-2xl font-bold text-ga-green">—</div>
                  <div className="text-xs text-ga-muted mt-1">Total Records</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm py-2 border-b border-ga-line">
                  <span className="text-ga-muted">MCA Entries</span>
                  <span className="font-semibold text-ga-ink">—</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-ga-muted">MKI Entries</span>
                  <span className="font-semibold text-ga-ink">—</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-ga-border bg-ga-cream px-6 py-4">
              <button className="flex-1 cursor-pointer rounded-lg border border-ga-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ga-body hover:bg-ga-cream transition-colors">View Details</button>
              <button onClick={downloadPdf} className="flex-1 cursor-pointer rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-4 py-2.5 text-[13px] font-bold text-ga-blue hover:bg-[#D6E8F7] transition-colors">Download PDF</button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-ga-border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)]">
          <div className="border-b border-ga-border bg-ga-cream px-6 py-4">
            <h2 className="text-base font-bold text-ga-ink">Report Summary</h2>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-ga-border p-4 text-center">
                <div className="text-sm text-ga-muted mb-2">Nominations Submitted</div>
                <div className="text-3xl font-bold text-ga-blue">—</div>
                <div className="text-xs text-ga-muted mt-2">DA Cadre Officials</div>
              </div>
              <div className="rounded-lg border border-ga-border p-4 text-center">
                <div className="text-sm text-ga-muted mb-2">MCA Records</div>
                <div className="text-3xl font-bold text-ga-green">—</div>
                <div className="text-xs text-ga-muted mt-2">Mutual Credit Arrangement</div>
              </div>
              <div className="rounded-lg border border-ga-border p-4 text-center">
                <div className="text-sm text-ga-muted mb-2">MKI Records</div>
                <div className="text-3xl font-bold text-ga-amber">—</div>
                <div className="text-xs text-ga-muted mt-2">Multilateral Cooperation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="text-lg">ℹ️</div>
            <div>
              <div className="font-semibold text-ga-blue mb-1">Report Information</div>
              <div className="text-sm text-ga-body">
                These reports are automatically generated based on the static forms submitted for {state}.
                Reports are updated in real-time as new submissions are made. For more details, please contact the
                office administrator.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
