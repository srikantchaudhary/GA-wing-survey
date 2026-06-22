import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getGrievances } from "../store.js";

const EXCEL_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
]);

function isExcel(mime, fileName) {
  if (mime && EXCEL_MIMES.has(mime)) return true;
  const ext = ((fileName || "").split(".").pop() || "").toLowerCase();
  return ["xlsx", "xls", "xlsm", "xlsb"].includes(ext);
}

async function openExcelInBrowser(grievanceId, fileName) {
  // Open tab synchronously (before any await) so popup blockers allow it
  const tab = window.open("about:blank", "_blank");
  if (!tab) {
    alert("Please allow popups for this site to view files.");
    return;
  }
  tab.document.write("<html><body style='font-family:Arial,sans-serif;padding:24px;color:#888'>Loading…</body></html>");
  try {
    const res = await fetch(`/api/grievances/${grievanceId}/view`, { credentials: "include" });
    if (!res.ok) throw new Error("Server error " + res.status);
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const sheetsHtml = wb.SheetNames.map((name) => {
      const tableHtml = XLSX.utils.sheet_to_html(wb.Sheets[name]);
      return `<div class="sheet"><div class="sheet-title">${name}</div>${tableHtml}</div>`;
    }).join("");

    const safeName = (fileName || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const page = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>${safeName}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:16px 20px;background:#fff;color:#2C2C2A}
        h2{font-size:15px;font-weight:700;margin:0 0 16px;color:#2C2C2A;border-bottom:2px solid #E8E6DF;padding-bottom:10px}
        .sheet{margin-bottom:28px;overflow-x:auto}
        .sheet-title{font-size:13px;font-weight:700;color:#185FA5;margin-bottom:6px}
        table{border-collapse:collapse;min-width:100%}
        td,th{border:1px solid #DDD9D0;padding:5px 10px;text-align:left;white-space:nowrap;vertical-align:top;font-size:12px}
        tr:first-child>td{background:#F7F5EF;font-weight:600}
        tr:nth-child(even):not(:first-child)>td{background:#FAFAF8}
      </style>
    </head><body>
      <h2>${safeName}</h2>
      ${sheetsHtml}
    </body></html>`;

    tab.document.open();
    tab.document.write(page);
    tab.document.close();
  } catch (err) {
    tab.document.open();
    tab.document.write(`<html><body style='font-family:Arial,sans-serif;padding:24px;color:#A32D2D'>Failed to open file: ${err.message}</body></html>`);
    tab.document.close();
  }
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

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


function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4B2A9]">{label}</span>
      <div className="text-[13px] text-[#2C2C2A]">{children}</div>
    </div>
  );
}

function GrievanceModal({ grievance, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E8E6DF]">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#2C2C2A] font-serif leading-snug">
              {grievance.name}
            </h2>
            <span className="inline-block mt-1.5 rounded-full bg-[#E1F5EE] px-2.5 py-0.5 text-[10px] font-semibold text-[#0F6E56]">
              {grievance.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1EFE8] cursor-pointer border-none text-[#888780] text-xl leading-none shrink-0 ml-4"
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          <DetailRow label="State">
            <span className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[10px] font-semibold text-[#185FA5]">
              {(grievance.states && grievance.states[0]) || "—"}
            </span>
          </DetailRow>

          <DetailRow label="Reason">
            <p className="leading-relaxed text-[#5F5E5A] whitespace-pre-wrap">{grievance.reason}</p>
          </DetailRow>

          <DetailRow label="Submitted On">
            <span className="text-[#888780]">{fmt(grievance.createdAt)}</span>
          </DetailRow>

          <DetailRow label="Attachment">
            {grievance.filePath ? (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] text-[#888780] truncate" title={grievance.fileName}>
                  {grievance.fileName}
                  {grievance.fileSize ? <span className="ml-1 text-[#B4B2A9]">({fmtSize(grievance.fileSize)})</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  {isExcel(grievance.fileMime, grievance.fileName) ? (
                    <button
                      onClick={() => openExcelInBrowser(grievance.id, grievance.fileName)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#E6F1FB] px-3.5 py-2 text-[12px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors cursor-pointer border-none"
                    >
                      <ViewIcon />
                      View
                    </button>
                  ) : (
                    <a
                      href={`/api/grievances/${grievance.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#E6F1FB] px-3.5 py-2 text-[12px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors no-underline"
                    >
                      <ViewIcon />
                      View
                    </a>
                  )}
                  <a
                    href={`/api/grievances/${grievance.id}/view`}
                    download={grievance.fileName}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#DDD9D0] px-3.5 py-2 text-[12px] font-semibold text-[#5F5E5A] hover:bg-[#F7F5EF] transition-colors no-underline"
                  >
                    <DownloadIcon />
                    Download
                  </a>
                </div>
              </div>
            ) : (
              <span className="text-[#B4B2A9]">No attachment</span>
            )}
          </DetailRow>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-[#E8E6DF] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#DDD9D0] bg-white px-5 py-2 text-xs font-semibold text-[#5F5E5A] cursor-pointer hover:bg-[#F7F5EF] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GrievanceDetails({ state }) {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = "GAMIS - Grievance Details";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getGrievances();
        if (!cancelled) setGrievances(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError("Failed to load grievances. Please try again.");
        console.error("Failed to load grievances", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [state]);

  return (
    <div className="p-7">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-[#2C2C2A] font-serif">Grievance Details</h1>
        <p className="text-sm text-[#888780] mt-0.5">
          Grievances raised for <span className="font-semibold text-[#2C2C2A]">{state}</span>
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#888780]">
            Loading…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#A32D2D]">
            {error}
          </div>
        ) : grievances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl">📋</div>
            <div className="text-sm font-medium text-[#5F5E5A]">No grievances found for {state}</div>
            <div className="text-xs text-[#B4B2A9]">Grievances assigned to your state will appear here</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#E8E6DF]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Subject</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Remarks</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Submitted On</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Attachment</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g, i) => (
                  <tr key={g.id} className="border-b border-[#F1EFE8] hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3.5 text-[#888780] text-xs">{i + 1}</td>

                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelected(g)}
                        className="font-semibold text-[#185FA5] underline underline-offset-2 decoration-dotted hover:decoration-solid cursor-pointer bg-transparent border-none p-0 text-left text-sm"
                      >
                        {g.name}
                      </button>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-block rounded-full bg-[#E1F5EE] px-2.5 py-0.5 text-[10px] font-semibold text-[#0F6E56] whitespace-nowrap">
                        {g.type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#5F5E5A] max-w-[280px]">
                      <div className="line-clamp-2" title={g.reason}>{g.reason}</div>
                    </td>

                    <td className="px-4 py-3.5 text-[#888780] text-xs whitespace-nowrap">{fmt(g.createdAt)}</td>

                    <td className="px-4 py-3.5">
                      {g.filePath ? (
                        <div className="flex items-center gap-1.5">
                          {isExcel(g.fileMime, g.fileName) ? (
                            <button
                              onClick={() => openExcelInBrowser(g.id, g.fileName)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#E6F1FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors cursor-pointer border-none"
                              title={`View: ${g.fileName}`}
                            >
                              <ViewIcon />
                              View
                            </button>
                          ) : (
                            <a
                              href={`/api/grievances/${g.id}/view`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#E6F1FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors no-underline"
                              title={`View: ${g.fileName}`}
                            >
                              <ViewIcon />
                              View
                            </a>
                          )}
                          <a
                            href={`/api/grievances/${g.id}/view`}
                            download={g.fileName}
                            className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#DDD9D0] px-2.5 py-1.5 text-[11px] font-semibold text-[#5F5E5A] hover:bg-[#F7F5EF] transition-colors no-underline"
                            title={`Download: ${g.fileName}${g.fileSize ? " · " + fmtSize(g.fileSize) : ""}`}
                          >
                            <DownloadIcon />
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-[#B4B2A9] text-xs">No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && grievances.length > 0 && (
        <div className="mt-4 text-[11px] text-[#B4B2A9]">
          {grievances.length} grievance{grievances.length !== 1 ? "s" : ""} · {state}
        </div>
      )}

      {selected && (
        <GrievanceModal grievance={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
