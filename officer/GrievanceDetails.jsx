import { useEffect, useState } from "react";
import { getGrievances } from "../store.js";

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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

export default function GrievanceDetails({ state }) {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Reason</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Submitted On</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#888780] whitespace-nowrap">Attachment</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g, i) => (
                  <tr key={g.id} className="border-b border-[#F1EFE8] hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3.5 text-[#888780] text-xs">{i + 1}</td>

                    <td className="px-4 py-3.5 font-semibold text-[#2C2C2A]">{g.name}</td>

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
                        <a
                          href={`/uploads/grievances/${g.filePath}`}
                          download={g.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#E6F1FB] px-3 py-1.5 text-[11px] font-semibold text-[#185FA5] hover:bg-[#d4e8f8] transition-colors no-underline"
                          title={`${g.fileName}${g.fileSize ? " · " + fmtSize(g.fileSize) : ""}`}
                        >
                          <DownloadIcon />
                          Download
                          {g.fileSize ? <span className="text-[10px] text-[#5F5E5A] font-normal">({fmtSize(g.fileSize)})</span> : null}
                        </a>
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
    </div>
  );
}
