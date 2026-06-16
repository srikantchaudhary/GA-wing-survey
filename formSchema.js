// ─────────────────────────────────────────────────────────
//  formSchema.js  —  Shared form section / field definitions
// ─────────────────────────────────────────────────────────
//  Single source of truth for the built-in survey sections and
//  the always-included submission fields. Consumed by the officer
//  form renderer (FormView) and the admin analytics view
//  (FormAnalytics) so field ids, labels and option lists stay in sync.

export const SECTIONS_META = {
  ifmis:    { color: "#185FA5", bg: "#E6F1FB" },
  ehrms:    { color: "#0F6E56", bg: "#E1F5EE" },
  wamis:    { color: "#854F0B", bg: "#FAEEDA" },
  evoucher: { color: "#533AB7", bg: "#EEEDFE" },
};

export const SECTION_LABELS = {
  ifmis:    "IFMIS (Annexure I)",
  ehrms:    "e-HRMS (Annexure III)",
  wamis:    "WAMIS (Annexure IV)",
  evoucher: "e-Voucher (Annexure V)",
};

export const SECTION_FIELDS = {
  ifmis: [
    { id: "ifmis_state",  label: "State",                  type: "dropdown", optionsSource: "states", options: [], required: true },
    { id: "ifmis_access", label: "IFMIS Access Available", type: "radio",    options: ["Yes","No","Partial"], required: true },
    { id: "ifmis_nature", label: "Nature / Remarks",       type: "textarea", placeholder: "Describe nature of access or any remarks…" },
    { id: "ifmis_audit",  label: "Audit Action Required",  type: "textarea", placeholder: "Mention any audit action required…" },
  ],
  ehrms: [
    { id: "ehrms_impl",   label: "e-HRMS Implemented",         type: "radio",    options: ["Yes","No","Partial"], required: true },
    { id: "ehrms_access", label: "A&E Access Level",           type: "dropdown", options: ["Full Access","View Only","Partial Access","No Access","Request Placed","Data Dump Only"] },
    { id: "ehrms_nature", label: "Nature of Access / Remarks", type: "textarea", placeholder: "Describe nature of access…" },
    { id: "ehrms_audit",  label: "Audit Action Required",      type: "textarea", placeholder: "Mention any audit action required…" },
  ],
  wamis: [
    { id: "wamis_status", label: "WAMIS Status",          type: "radio",    options: ["Implemented","Partial","Not Implemented","Trial"], required: true },
    { id: "wamis_access", label: "A&E Access to WAMIS",   type: "dropdown", options: ["Full Access","View Only","Partial (Reports Only)","No Access","Data Dump Available"] },
    { id: "wamis_nature", label: "Nature of Data Available", type: "textarea", placeholder: "Describe data available…" },
  ],
  evoucher: [
    { id: "ev_status",  label: "Overall Voucher Status",    type: "radio",    options: ["Fully e-Voucher","Mixed (Both)","Fully Physical"], required: true },
    { id: "ev_type",    label: "Type Prevalent",            type: "checkbox", options: ["e-Voucher","Physical Voucher","Both"] },
    { id: "ev_system",  label: "System / Portal Used",      type: "text",     placeholder: "eg; PFMS, State Treasury Portal…" },
    { id: "ev_dsc",     label: "Digital Signature Status",  type: "dropdown", options: ["Yes — All Vouchers","Yes — Partial","Not Implemented","Planned"] },
    { id: "ev_dsc_rem", label: "Digital Signature Remarks", type: "textarea", placeholder: "Any remarks on digital signature…" },
  ],
};

export const SUBMISSION_FIELDS = [
  { id: "sub_name",   label: "Officer Name",        type: "text",     placeholder: "eg; Rajesh Kumar",         required: true  },
  { id: "sub_desig",  label: "Designation",         type: "text",     placeholder: "eg; Senior Audit Officer" },
  { id: "sub_office", label: "Office / A&E Branch", type: "text",     placeholder: "eg; O/o AG (A&E), Punjab" },
  { id: "sub_date",   label: "Date of Submission",  type: "date",     placeholder: "",                         required: true  },
  { id: "sub_email",  label: "Email Address",       type: "email",    placeholder: "eg; officer@cag.gov.in" },
  { id: "sub_phone",  label: "Phone / Extension",   type: "tel",      placeholder: "eg; +91 98765 43210" },
  { id: "sub_rem",    label: "Additional Remarks",  type: "textarea", placeholder: "Any additional observations…" },
];

// Convert a custom section (created via the wizard) into renderable field defs.
export function customSectionFields(section) {
  return (section.columns || []).map((col, i) => ({
    id: `${section.id}_col_${i}`,
    label: col.name,
    type:
      col.dataType === "number"   ? "number" :
      col.dataType === "date"     ? "date" :
      col.dataType === "dropdown" ? "dropdown" :
      col.dataType === "checkbox" ? "checkbox" : "text",
    placeholder: col.placeholder,
    options:
      col.dataType === "dropdown" ? (col.dropdownOptions || []).filter(o => o.trim()) :
      col.dataType === "checkbox" ? (col.checkboxOptions || []).filter(o => o.trim()) :
      undefined,
    required: false,
  }));
}

// Resolve the ordered list of sections a form includes (built-in first,
// then custom), each augmented with its renderable `fields` array.
export function getFormSections(form, customSections = []) {
  const enabled = form?.sections || [];

  const builtIn = Object.keys(SECTION_FIELDS)
    .filter(id => enabled.includes(id))
    .map(id => ({
      id,
      label: SECTION_LABELS[id] || id,
      ...(SECTIONS_META[id] || { color: "#5F5E5A", bg: "#F1EFE8" }),
      isCustom: false,
      fields: SECTION_FIELDS[id],
    }));

  const custom = (customSections || [])
    .filter(s => enabled.includes(s.id))
    .map(s => ({ ...s, isCustom: true, fields: customSectionFields(s) }));

  return [...builtIn, ...custom];
}
