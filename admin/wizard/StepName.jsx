export default function StepName({ sectionName, setSName, colorIdx, setColorIdx, COLORS, onNext }) {
  const preview = COLORS[colorIdx];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ga-body">Section Name *</div>
        <input
          autoFocus
          value={sectionName}
          onChange={e => setSName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sectionName.trim() && onNext()}
          placeholder="eg; Infrastructure Details, Budget Info…"
          className="box-border w-full rounded-lg border-[1.5px] border-ga-line px-3.5 py-2.5 text-[13px] text-ga-ink outline-none"
        />
      </div>
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ga-body">Section Color</div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c, i) => (
            <div
              key={i}
              onClick={() => setColorIdx(i)}
              className={`h-7 w-7 cursor-pointer rounded-full bg-[${c.color}] transition-[border] duration-[120ms] ${
                colorIdx === i ? "border-[3px] border-ga-ink" : "border-[3px] border-transparent"
              }`}
            />
          ))}
        </div>
        {sectionName && (
          <div className={`mt-2.5 inline-flex items-center gap-2 rounded-lg border-[1.5px] px-3.5 py-2 bg-[${preview.bg}] border-[${preview.color}55]`}>
            <div className={`h-2.5 w-2.5 rounded-full bg-[${preview.color}]`} />
            <span className={`text-xs font-semibold text-[${preview.color}]`}>{sectionName}</span>
          </div>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={!sectionName.trim()}
        className={`rounded-lg border-none py-[11px] text-[13px] font-bold text-white ${
          sectionName.trim() ? "cursor-pointer bg-ga-blue" : "cursor-not-allowed bg-ga-line"
        }`}
      >
        Next →
      </button>
    </div>
  );
}
