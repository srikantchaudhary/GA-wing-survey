function ColumnEditor({ col, index, updateCol, colorIdx, COLORS, DATA_TYPES }) {
  const accent = COLORS[colorIdx];
  return (
    <div className="overflow-hidden rounded-[10px] border border-ga-border">
      <div className="flex items-center gap-2 border-b border-ga-surface bg-[#FAFAF8] px-3.5 py-2 text-[11px] font-bold text-ga-muted">
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-[${accent.color}] bg-[${accent.bg}]`}>{index + 1}</span>
        Column {index + 1}
      </div>
      <div className="p-3.5">
        {/* Column Name */}
        <div className="mb-2.5">
          <div className="mb-[5px] text-[11px] font-bold uppercase tracking-wide text-ga-body">Column Name *</div>
          <input
            value={col.name}
            onChange={e => updateCol(index, { name: e.target.value })}
            className="box-border w-full rounded-[7px] border-[1.5px] border-ga-line px-3 py-2 text-[13px] text-ga-ink outline-none"
          />
        </div>

        {/* Data Type */}
        <div className="mb-2.5">
          <div className="mb-[5px] text-[11px] font-bold uppercase tracking-wide text-ga-body">Data Type *</div>
          <div className="grid grid-cols-3 gap-1.5">
            {DATA_TYPES.map(dt => (
              <div
                key={dt.value}
                onClick={() => updateCol(index, { dataType: dt.value })}
                className={`flex cursor-pointer items-center gap-[5px] rounded-md border-[1.5px] p-1.5 px-2 transition-all duration-100 ${
                  col.dataType === dt.value
                    ? `border-[${accent.color}] bg-[${accent.bg}]`
                    : "border-ga-border bg-[#FAFAF8]"
                }`}
              >
                <span className={`min-w-[14px] text-[10px] font-bold ${col.dataType === dt.value ? `text-[${accent.color}]` : "text-ga-muted"}`}>{dt.icon}</span>
                <span className={`text-[11px] ${col.dataType === dt.value ? `font-bold text-[${accent.color}]` : "font-medium text-[#444441]"}`}>{dt.label}</span>
              </div>
            ))}
          </div>

          {/* Required Toggle */}
          <div className="mb-2.5 flex items-center justify-between rounded-[8px] border border-ga-line bg-[#FAFAF8] px-3 py-2">
            <div>
              <div className="text-[11px] font-bold text-ga-body">Required Field</div>
              <div className="text-[10px] text-ga-muted">Officer must fill this field to submit</div>
            </div>
            <button
              type="button"
              onClick={() => updateCol(index, { required: !col.required })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                col.required ? "bg-ga-green" : "bg-ga-line"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  col.required ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Dropdown Options */}
          {col.dataType === "dropdown" && (
            <div className="mt-2.5">
              <div className="mb-[5px] text-[11px] font-bold uppercase tracking-wide text-ga-body">Dropdown Options *</div>
              {(col.dropdownOptions || []).map((opt, oi) => (
                <div key={oi} className="mb-1.5 flex items-center gap-1.5">
                  <div className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-[9px] font-bold text-[${accent.color}] bg-[${accent.bg}]`}>{oi + 1}</div>
                  <input
                    value={opt}
                    onChange={e => { const updated = [...col.dropdownOptions]; updated[oi] = e.target.value; updateCol(index, { dropdownOptions: updated }); }}
                    placeholder={`Option ${oi + 1}`}
                    className="box-border flex-1 rounded-[7px] border-[1.5px] border-ga-line bg-[#FAFAF8] px-2.5 py-1.5 text-xs text-ga-ink outline-none"
                  />
                  <button onClick={() => updateCol(index, { dropdownOptions: col.dropdownOptions.filter((_, j) => j !== oi) })} className="flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#F1C0C0] bg-[#FEF0F0] text-sm font-bold text-ga-error">×</button>
                </div>
              ))}
              <button onClick={() => updateCol(index, { dropdownOptions: [...(col.dropdownOptions || []), ""] })} className="mt-0.5 flex cursor-pointer items-center gap-[5px] rounded-[7px] border-[1.5px] border-dashed border-[#A8DBC9] bg-[#F0FBF7] px-3 py-[5px] text-[11px] font-semibold text-ga-green">
                <span className="text-sm font-bold">+</span> Add Option
              </button>
            </div>
          )}

          {/* Checkbox Options */}
          {col.dataType === "checkbox" && (
            <div className="mt-2.5">
              <div className="mb-[5px] text-[11px] font-bold uppercase tracking-wide text-ga-body">Checkbox Options *</div>
              {(col.checkboxOptions || []).map((opt, oi) => (
                <div key={oi} className="mb-1.5 flex items-center gap-1.5">
                  <div className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-[9px] font-bold text-[${accent.color}] bg-[${accent.bg}]`}>{oi + 1}</div>
                  <input
                    value={opt}
                    onChange={e => { const updated = [...col.checkboxOptions]; updated[oi] = e.target.value; updateCol(index, { checkboxOptions: updated }); }}
                    placeholder={`Option ${oi + 1}`}
                    className="box-border flex-1 rounded-[7px] border-[1.5px] border-ga-line bg-[#FAFAF8] px-2.5 py-1.5 text-xs text-ga-ink outline-none"
                  />
                  <button onClick={() => updateCol(index, { checkboxOptions: col.checkboxOptions.filter((_, j) => j !== oi) })} className="flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#F1C0C0] bg-[#FEF0F0] text-sm font-bold text-ga-error">×</button>
                </div>
              ))}
              <button onClick={() => updateCol(index, { checkboxOptions: [...(col.checkboxOptions || []), ""] })} className="mt-0.5 flex cursor-pointer items-center gap-[5px] rounded-[7px] border-[1.5px] border-dashed border-[#A8DBC9] bg-[#F0FBF7] px-3 py-[5px] text-[11px] font-semibold text-ga-green">
                <span className="text-sm font-bold">+</span> Add Option
              </button>
            </div>
          )}
        </div>

        {/* Live Preview */}
        {col.name && (
          <div className="mt-2.5 rounded-lg border border-dashed border-ga-line bg-ga-cream p-2.5 px-3">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-ga-faint">Preview</div>
            <div className="flex items-center gap-2.5">
              <span className="min-w-[70px] text-xs font-semibold text-ga-body">{col.name}{col.required && <span className="ml-0.5 text-ga-error">*</span>}</span>
              <div className="flex-1 rounded-md border-[1.5px] border-dashed border-ga-line bg-white px-[11px] py-[7px] text-xs italic text-[#C0BEBA]">
                {DATA_TYPES.find(d => d.value === col.dataType)?.placeholder || "eg; Enter value"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StepDetails({ columns, updateCol, colorIdx, COLORS, DATA_TYPES, canFinish, onBack, onFinish }) {
  return (
    <div>
      <div className="flex flex-col gap-3.5">
        {columns.map((col, i) => (
          <ColumnEditor
            key={i}
            col={col}
            index={i}
            updateCol={updateCol}
            colorIdx={colorIdx}
            COLORS={COLORS}
            DATA_TYPES={DATA_TYPES}
          />
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={onBack} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-4 py-[9px] text-xs font-semibold text-[#444441]">← Back</button>
        <button
          onClick={onFinish}
          disabled={!canFinish}
          className={`flex-1 rounded-lg border-none py-[11px] text-[13px] font-bold text-white ${
            canFinish ? "cursor-pointer bg-ga-green" : "cursor-not-allowed bg-ga-line"
          }`}
        >
          ✓ Create Section
        </button>
      </div>
    </div>
  );
}
