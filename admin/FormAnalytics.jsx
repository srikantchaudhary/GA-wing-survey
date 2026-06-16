import { useMemo, useState, useEffect } from "react";
import { getFormSections } from "../formSchema.js";
import { ALL_INDIAN_STATES_AND_UTS } from "../constants.js";
import { getStates } from "../store.js";

// Status palette for the implementation-comparison chart / table.
const STATUS = {
  yes:     { label: "Implemented / Yes",            color: "#5C9A1F", soft: "#EAF3DE", text: "#3F6E12" },
  partial: { label: "Partial / Trial / Mixed",      color: "#E0A82E", soft: "#FAEEDA", text: "#854F0B" },
  no:      { label: "Not implemented / No access",  color: "#DD5B57", soft: "#FCEBEB", text: "#A32D2D" },
};

// Bucket an answer value into yes / partial / no (or null when it carries
// no implementation signal — e.g. a free-text or a state-name dropdown).
function classifyStatus(value) {
  if (value == null) return null;
  const t = (Array.isArray(value) ? value.join(" ") : String(value)).trim().toLowerCase();
  if (!t) return null;
  if (/(^|[^a-z])no($|[^a-z])|\bnot\b|fully physical|physical voucher|no access|none|unavailable|absent/.test(t)) return "no";
  if (/partial|trial|mixed|planned|in progress|ongoing|view only|request|data dump|both|some/.test(t)) return "partial";
  if (/\byes\b|implemented|fully|full access|\bfull\b|available|complete|active|enabled|all vouchers/.test(t)) return "yes";
  return null;
}

// A field is a "metric" for the comparison chart when it is a choice field
// whose declared options carry implementation signal.
function isMetricField(field) {
  if (!["radio", "dropdown", "checkbox"].includes(field.type)) return false;
  const opts = field.options || [];
  return opts.some(o => classifyStatus(o) !== null);
}

function normState(s) {
  return String(s || "").trim().toLowerCase();
}

function initials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function StatCard({ value, label, color }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#E8E6DF]">
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#B4B2A9] mt-1.5">{label}</div>
    </div>
  );
}

export default function FormAnalytics({ form, responses, customSections }) {
  const [allStates, setAllStates] = useState(ALL_INDIAN_STATES_AND_UTS);

  // Load the authoritative states list from the API (fallback: bundled list).
  useEffect(() => {
    let mounted = true;
    getStates()
      .then(list => { if (mounted && list.length) setAllStates(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const analytics = useMemo(() => {
    const formResponses = (responses || []).filter(r => r.formId === form.formId);

    // States that actually submitted (deduped, case-insensitive).
    const submittedSet = new Map();
    formResponses.forEach(r => {
      if (r.state) submittedSet.set(normState(r.state), r.state);
    });

    // Universe of states this form targets. Falls back to all of India for
    // forms published with no explicit state assignment.
    const assignedRaw = form.states && form.states.length
      ? form.states
      : allStates;
    const assignedStates = [...new Set(assignedRaw)];
    const totalStates = assignedStates.length || formResponses.length || 0;

    const submittedCount = assignedStates.filter(s => submittedSet.has(normState(s))).length;
    // Submissions from states outside the assigned set still count as activity.
    const extraSubmitted = [...submittedSet.keys()].filter(k => !assignedStates.some(s => normState(s) === k)).length;
    const submitted = submittedCount + extraSubmitted;

    const pendingStates = assignedStates.filter(s => !submittedSet.has(normState(s)));
    const responseRate = totalStates ? Math.round((Math.min(submitted, totalStates) / totalStates) * 100) : 0;

    // Build one metric per classifiable choice field across the form's sections.
    const sections = getFormSections(form, customSections);
    const metrics = [];
    sections.forEach(section => {
      section.fields.filter(isMetricField).forEach(field => {
        const counts = { yes: 0, partial: 0, no: 0, other: 0 };
        formResponses.forEach(r => {
          const v = r.data ? r.data[field.id] : undefined;
          if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return;
          const c = classifyStatus(v);
          counts[c || "other"] += 1;
        });
        const answered = counts.yes + counts.partial + counts.no + counts.other;
        const coverage = totalStates ? Math.round((counts.yes / totalStates) * 1000) / 10 : 0;
        metrics.push({
          id: field.id,
          label: field.label,
          sectionLabel: section.label,
          sectionColor: section.color,
          counts,
          answered,
          coverage,
        });
      });
    });

    return { formResponses, totalStates, submitted: Math.min(submitted, totalStates), pendingStates, responseRate, metrics };
  }, [form, responses, customSections, allStates]);

  const { totalStates, submitted, pendingStates, responseRate, metrics, formResponses } = analytics;
  const axisMax = totalStates || 1;
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((axisMax * i) / 4));

  return (
    <div className="space-y-6">
      {/* ── System implementation comparison ───────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#E8E6DF]">
          <h3 className="text-base font-bold text-[#2C2C2A]">System implementation comparison</h3>
          <p className="text-xs text-[#888780] mt-0.5">
            Number of states by status across {metrics.length} field{metrics.length === 1 ? "" : "s"} — {form.name}{form.surveyYear ? ` · ${form.surveyYear}` : ""}
          </p>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {Object.values(STATUS).map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} />
                <span className="text-[11px] font-medium text-[#5F5E5A]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {metrics.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#888780]">
            This form has no status-style fields to compare.
          </div>
        ) : (
          <div className="p-6">
            {/* Bars */}
            <div className="space-y-3">
              {metrics.map(m => {
                const seg = k => `${(m.counts[k] / axisMax) * 100}%`;
                return (
                  <div key={m.id} className="grid grid-cols-[150px_1fr] items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#2C2C2A] truncate" title={m.label}>{m.label}</div>
                      <div className="text-[10px] text-[#B4B2A9] truncate" title={m.sectionLabel}>{m.sectionLabel}</div>
                    </div>
                    <div className="flex h-7 w-full rounded-md overflow-hidden bg-[#F1EFE8]">
                      {["yes", "partial", "no"].map(k => (
                        m.counts[k] > 0 ? (
                          <div
                            key={k}
                            className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ width: seg(k), background: STATUS[k].color }}
                            title={`${STATUS[k].label}: ${m.counts[k]}`}
                          >
                            {m.counts[k]}
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Axis */}
            <div className="grid grid-cols-[150px_1fr] gap-3 mt-2">
              <div />
              <div className="relative h-5 border-t border-[#E8E6DF]">
                {ticks.map((t, i) => (
                  <span
                    key={i}
                    className="absolute top-1 -translate-x-1/2 text-[10px] text-[#B4B2A9]"
                    style={{ left: `${(i / (ticks.length - 1)) * 100}%` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-center text-[11px] text-[#888780] mt-1">
              Number of states (total = {totalStates})
            </div>
          </div>
        )}

        {/* Coverage table */}
        {metrics.length > 0 && (
          <div className="border-t border-[#E8E6DF] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F7F5EF] text-left text-[11px] font-bold uppercase tracking-wide text-[#888780]">
                  <th className="px-6 py-3">Field</th>
                  <th className="px-4 py-3">Implemented / Yes</th>
                  <th className="px-4 py-3">Partial / Mixed</th>
                  <th className="px-4 py-3">No / Physical</th>
                  <th className="px-4 py-3">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DF]">
                {metrics.map(m => (
                  <tr key={m.id} className="hover:bg-[#F7F5EF]">
                    <td className="px-6 py-3 font-bold text-[#2C2C2A]">{m.label}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: STATUS.yes.soft, color: STATUS.yes.text }}>{m.counts.yes} states</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: STATUS.partial.soft, color: STATUS.partial.text }}>{m.counts.partial} states</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: STATUS.no.soft, color: STATUS.no.text }}>{m.counts.no} states</span>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: m.coverage >= 50 ? STATUS.yes.text : STATUS.partial.text }}>
                      {m.coverage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── States / users who have not filled the form ────────────── */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#E8E6DF]">
          <h3 className="text-base font-bold text-[#2C2C2A]">States / users who have not filled the form</h3>
          <p className="text-xs text-[#888780] mt-0.5">Respondents pending submission — {form.name}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard value={totalStates} label="Total states" color="#2C2C2A" />
            <StatCard value={submitted} label="Submitted" color={STATUS.yes.color} />
            <StatCard value={pendingStates.length} label="Pending" color={STATUS.no.color} />
            <StatCard value={`${responseRate}%`} label="Response rate" color={STATUS.partial.text} />
          </div>

          {/* Progress bar */}
          <div className="flex h-10 w-full rounded-lg overflow-hidden bg-[#F1EFE8]">
            {submitted > 0 && (
              <div className="h-full" style={{ width: `${(submitted / (totalStates || 1)) * 100}%`, background: STATUS.yes.color }} />
            )}
            {pendingStates.length > 0 && (
              <div className="h-full" style={{ width: `${(pendingStates.length / (totalStates || 1)) * 100}%`, background: STATUS.no.color }} />
            )}
          </div>

          {/* Pending list */}
          <div>
            <div className="text-sm font-bold text-[#2C2C2A] mb-3">Pending states</div>
            {pendingStates.length === 0 ? (
              <div className="rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] px-4 py-3 text-sm font-semibold text-[#0F6E56]">
                ✓ All states have submitted their response.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingStates.map(state => (
                  <div key={state} className="flex items-center gap-3 rounded-lg border border-[#E8E6DF] bg-[#FAFAF8] px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-xs font-bold text-[#A32D2D]">
                      {initials(state)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#2C2C2A] truncate">{state}</div>
                      <div className="text-xs text-[#888780]">No submission received</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formResponses.length === 0 && (
            <div className="text-xs text-[#888780]">
              No responses have been submitted for this form yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
