import { useState, useEffect } from "react";

export default function StaticReportView({ state, onLogout }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "GA Wing Survey Portal - Static Report";
  }, []);

  return (
    <div className="w-full overflow-y-auto px-8 py-7 bg-[#FAFAF8]">
      <div className="mx-auto max-w-[1000px]">
        <h1 className="mb-2 text-2xl font-extrabold text-ga-ink font-serif">{state} — Static Report</h1>
        <p className="mb-6 text-sm text-ga-muted">View and download static reports for {state}</p>

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
              <button className="flex-1 cursor-pointer rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-4 py-2.5 text-[13px] font-bold text-ga-blue hover:bg-[#D6E8F7] transition-colors">Download PDF</button>
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
              <button className="flex-1 cursor-pointer rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-4 py-2.5 text-[13px] font-bold text-ga-blue hover:bg-[#D6E8F7] transition-colors">Download PDF</button>
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
              {/* Card 1 */}
              <div className="rounded-lg border border-ga-border p-4 text-center">
                <div className="text-sm text-ga-muted mb-2">Nominations Submitted</div>
                <div className="text-3xl font-bold text-ga-blue">—</div>
                <div className="text-xs text-ga-muted mt-2">DA Cadre Officials</div>
              </div>

              {/* Card 2 */}
              <div className="rounded-lg border border-ga-border p-4 text-center">
                <div className="text-sm text-ga-muted mb-2">MCA Records</div>
                <div className="text-3xl font-bold text-ga-green">—</div>
                <div className="text-xs text-ga-muted mt-2">Mutual Credit Arrangement</div>
              </div>

              {/* Card 3 */}
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
