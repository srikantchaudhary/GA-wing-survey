const SELECT_ARROW =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23185FA5%22%20d%3D%22M6%208L1%203h10z%22/%3E%3C/svg%3E')] bg-[length:12px_12px] bg-[right_14px_center] bg-no-repeat";

export default function StepColumns({ onSelectCount, onBack }) {
  return (
    <div>
      <div className="mb-4">
        <select
          onChange={e => e.target.value && onSelectCount(Number(e.target.value))}
          defaultValue=""
          className={`w-full cursor-pointer appearance-none rounded-[10px] border-[1.5px] border-ga-line bg-[#FAFAF8] px-3.5 py-2.5 text-sm font-semibold text-ga-blue outline-none ${SELECT_ARROW}`}
        >
          <option value="" disabled>Select number of columns…</option>
          {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n} column{n > 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>
      <button onClick={onBack} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-4 py-2 text-xs font-semibold text-[#444441]">← Back</button>
    </div>
  );
}
