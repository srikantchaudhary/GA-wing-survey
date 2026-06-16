import { formatDateDdMmYyyy } from "../dateUtils.js";

export default function SubmitSuccessOverlay({ form, state, onClose }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/45">
      <div className="w-[90%] max-w-[440px] rounded-[20px] bg-white px-12 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-ga-green to-ga-blue text-[32px] text-white">✓</div>
        <div className="mb-2 font-serif text-[22px] font-extrabold text-ga-ink">Response Submitted!</div>
        <div className="mb-6 text-[13px] leading-relaxed text-ga-muted">
          Your response has been successfully recorded on behalf of <strong className="text-ga-ink">{state}</strong>.
        </div>
        <div className="mb-6 rounded-[10px] border border-ga-border bg-ga-cream px-5 py-3.5 text-left text-xs text-ga-body">
          <div className="mb-2 font-bold text-ga-ink">Submission Receipt</div>
          <div className="flex flex-col gap-1">
            <div><span className="text-ga-muted">Form:</span> {form?.name}</div>
            <div><span className="text-ga-muted">Form ID:</span> {form?.formId}</div>
            <div><span className="text-ga-muted">State:</span> {state}</div>
            <div><span className="text-ga-muted">Survey Year:</span> {form?.surveyYear}</div>
            <div><span className="text-ga-muted">Submitted:</span> {formatDateDdMmYyyy(new Date())}</div>
          </div>
        </div>
        <button onClick={onClose} className="w-full cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-ga-blue to-ga-green py-3 text-sm font-bold text-white">Done ✓</button>
      </div>
    </div>
  );
}
