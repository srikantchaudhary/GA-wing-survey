export function rowToForm(row) {
  return {
    id: Number(row.id),
    formId: row.form_id,
    name: row.name,
    sections: typeof row.sections === "string" ? JSON.parse(row.sections) : row.sections,
    states: typeof row.states === "string" ? JSON.parse(row.states) : row.states,
    status: row.status,
    surveyYear: row.survey_year,
    description: row.description || "",
    createdAt: new Date(row.created_date).toISOString(),
    savedAt: new Date(row.updated_date).toISOString(),
  };
}

export function formToRow(form) {
  return {
    id: form.id,
    form_id: form.formId,
    name: form.name,
    sections: JSON.stringify(form.sections || []),
    states: JSON.stringify(form.states || []),
    status: form.status || "draft",
    survey_year: form.surveyYear || null,
    description: form.description || "",
    created_date: form.createdAt ? new Date(form.createdAt) : new Date(),
    updated_date: new Date(),
  };
}
