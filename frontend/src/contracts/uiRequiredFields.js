export const REQUIRED_FIELDS = new Set([
  "patient.name",
  "patient.species",
  "patient.breed",
  "patient.sex",
  "patient.birth_date",
  "patient.chip_id",
  "patient.weight_kg",
  "owner.name",
  "owner.surname",
  "owner.phone_number",
  "owner.email",
]);

// Timeline UI-required keys are driven by schema required[] with UI exclusions:
// - non-editable event system fields
// - array fields (present in payload but not mandatory to fill in UI)
export const TIMELINE_UI_REQUIRED_EXCLUSIONS = new Set([
  "event_id",
  "status",
  "assessment",
  "diagnoses",
  "treatments",
  "tests",
  "attachments",
]);

export const REQUIRED_TIMELINE_FIELDS = ["event_type", "date", "clinic", "title"];

export function isRequiredField(fieldPath) {
  return REQUIRED_FIELDS.has(fieldPath);
}

export function isRequiredTimelineField(fieldKey) {
  return REQUIRED_TIMELINE_FIELDS.includes(fieldKey);
}
