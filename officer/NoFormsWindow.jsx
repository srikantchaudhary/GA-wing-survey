export default function NoFormsWindow({ state, onLogout }) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="w-full max-w-[480px] rounded-[20px] border border-ga-border bg-white px-10 py-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-ga-line bg-gradient-to-br from-ga-surface to-ga-border text-4xl">📭</div>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-ga-faint">
          Office of the Controller General of Accounts
        </div>
        <h2 className="mb-3 mt-0 font-serif text-xl font-extrabold leading-snug text-ga-ink">
          No Pending Survey Forms
        </h2>
        <div className="mx-auto mb-5 h-0.5 w-10 rounded-sm bg-ga-line" />
        <p className="mb-6 text-[13px] leading-relaxed text-ga-body">
          At this time, no survey forms have been assigned to the <strong className="text-ga-ink">{state}</strong> office for completion.
        </p>
        <div className="mb-7 rounded-[10px] border border-ga-border bg-ga-cream px-5 py-3.5 text-left text-xs leading-relaxed text-ga-muted">
          <div className="mb-1.5 flex items-center gap-1.5 font-bold text-ga-body">
            <span>ℹ</span> What this means
          </div>
          <ul className="m-0 pl-4">
            <li>Your office has no active survey requirements at this time.</li>
            <li>If you believe this is incorrect, please contact the GA Wing directly.</li>
            <li>New forms will appear here once assigned by the administrator.</li>
          </ul>
        </div>
        <div className="mb-5 border-t border-ga-surface pt-5 text-[11px] text-ga-faint">
          GA Wing Information Management System · {new Date().getFullYear()}
        </div>
        <button onClick={onLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-6 py-[9px] text-xs font-semibold text-ga-body">← Change State</button>
      </div>
    </div>
  );
}
