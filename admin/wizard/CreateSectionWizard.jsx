import { useState } from "react";
import StepName from "./StepName.jsx";
import StepColumns from "./StepColumns.jsx";
import StepDetails from "./StepDetails.jsx";

const COLORS = [
  { color: "#185FA5", bg: "#E6F1FB" },
  { color: "#0F6E56", bg: "#E1F5EE" },
  { color: "#854F0B", bg: "#FAEEDA" },
  { color: "#533AB7", bg: "#EEEDFE" },
  { color: "#993556", bg: "#FBEAF0" },
  { color: "#639922", bg: "#EAF3DE" },
  { color: "#A32D2D", bg: "#FCEBEB" },
  { color: "#5F5E5A", bg: "#F1EFE8" },
];

const DATA_TYPES = [
  { value: "text",     label: "Text",      placeholder: "eg; Enter text here",        icon: "Aa" },
  { value: "number",   label: "Number",    placeholder: "eg; 01",                     icon: "##" },
  { value: "date",     label: "Date",      placeholder: "eg; DD/MM/YYYY",             icon: "📅" },
  { value: "dropdown", label: "Dropdown",  placeholder: "eg; Select an option",       icon: "▾"  },
  { value: "checkbox", label: "Checkbox",  placeholder: "eg; Option A / Option B",    icon: "☑"  },
];

function getPlaceholder(dt) {
  return DATA_TYPES.find(d => d.value === dt)?.placeholder || "eg; Enter value";
}

export default function CreateSectionWizard({ onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [sectionName, setSName] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [colCount, setColCount] = useState(null);
  const [columns, setColumns] = useState([]);

  const handleColCount = (n) => {
    setColCount(n);
    setColumns(Array.from({ length: n }, () => ({ name: "", dataType: "text", dropdownOptions: [], checkboxOptions: [] })));
    setStep(3);
  };

  const updateCol = (i, patch) => setColumns(cols => cols.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  const canFinish = sectionName.trim() && columns.length > 0 && columns.every(c => c.name.trim());

  const handleFinish = () => {
    const cp = COLORS[colorIdx % COLORS.length];
    onAdd({
      id: "custom_" + Date.now(),
      label: sectionName.trim(),
      annexure: "Custom",
      color: cp.color, bg: cp.bg,
      isCustom: true,
      columns: columns.map(c => ({
        name: c.name.trim(),
        dataType: c.dataType,
        placeholder: getPlaceholder(c.dataType),
        dropdownOptions: c.dropdownOptions || [],
        checkboxOptions: c.checkboxOptions || [],
      })),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[540px] max-w-[95vw] overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-ga-surface bg-[#FAFAF8] px-[22px] py-4">
          <div>
            <div className="text-sm font-bold text-ga-ink">Create Custom Section</div>
            <div className="text-[11px] text-ga-muted">Step {step} of 3 — {step === 1 ? "Name & Color" : step === 2 ? "Number of Columns" : "Column Details"}</div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-ga-surface text-lg text-ga-muted">×</button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-ga-surface">
          {["Section Name", "No. of Columns", "Column Details"].map((label, i) => (
            <div
              key={i}
              className={`flex-1 border-b-[2.5px] py-2 text-center text-[11px] ${
                step === i + 1
                  ? "border-ga-blue font-bold text-ga-blue"
                  : step > i + 1
                    ? "border-ga-green font-medium text-ga-green"
                    : "border-transparent font-medium text-ga-faint"
              }`}
            >
              {step > i + 1 ? "✓ " : ""}{label}
            </div>
          ))}
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-[22px]">
          {step === 1 && (
            <StepName
              sectionName={sectionName}
              setSName={setSName}
              colorIdx={colorIdx}
              setColorIdx={setColorIdx}
              COLORS={COLORS}
              onNext={() => sectionName.trim() && setStep(2)}
            />
          )}

          {step === 2 && (
            <StepColumns
              onSelectCount={handleColCount}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepDetails
              columns={columns}
              updateCol={updateCol}
              colorIdx={colorIdx}
              COLORS={COLORS}
              DATA_TYPES={DATA_TYPES}
              canFinish={canFinish}
              onBack={() => setStep(2)}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  );
}
