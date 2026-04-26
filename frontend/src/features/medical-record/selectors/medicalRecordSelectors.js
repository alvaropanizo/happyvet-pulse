import { REQUIRED_FIELDS, REQUIRED_TIMELINE_FIELDS } from "../../../contracts/uiRequiredFields";
import { classifyRequiredStatus, isConfirmedFieldStatus, isReviewedStatus } from "../utils/statusAggregators";

export function sortTimelineByDateDesc(events) {
  const toDateValue = (value) => {
    if (!value) return Number.NEGATIVE_INFINITY;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? Number.NEGATIVE_INFINITY : date.getTime();
  };
  return [...events].sort((a, b) => toDateValue(b.date) - toDateValue(a.date));
}

export function buildTimelineRows(timeline) {
  return sortTimelineByDateDesc(timeline).map((event) => ({
    ...event,
    timelineIndex: timeline.findIndex((original) => original.event_id === event.event_id),
  }));
}

export function computeTimelineSectionStatus(timeline, getTimelineEventStatus) {
  if (!timeline.length) return "needs_review";
  const resolvedStatuses = timeline.map((event) => getTimelineEventStatus(event));
  const allApproved = resolvedStatuses.every((status) => status === "approved" || status === "edited");
  if (!allApproved) return "needs_review";
  return resolvedStatuses.includes("edited") ? "edited" : "approved";
}

export function buildClinicalHeader(draft, timelineSectionStatus) {
  const patientNameValue = String(draft.patient.name?.value ?? "").trim();
  const shouldUsePatientTitle = isConfirmedFieldStatus(draft.patient.name) && patientNameValue.length > 0;
  const clinicalHeaderTitle = shouldUsePatientTitle ? `${patientNameValue}'s Clinical History` : "Draft Clinical History";
  const clinicalHeaderPills = [];

  if (isConfirmedFieldStatus(draft.patient.chip_id) && String(draft.patient.chip_id?.value ?? "").trim()) {
    clinicalHeaderPills.push(String(draft.patient.chip_id.value).trim());
  }
  if (isConfirmedFieldStatus(draft.patient.birth_date) && String(draft.patient.birth_date?.value ?? "").trim()) {
    clinicalHeaderPills.push(String(draft.patient.birth_date.value).trim());
  }
  const ownerName = String(draft.owner.name?.value ?? "").trim();
  const ownerSurname = String(draft.owner.surname?.value ?? "").trim();
  if (isConfirmedFieldStatus(draft.owner.name) && isConfirmedFieldStatus(draft.owner.surname) && (ownerName || ownerSurname)) {
    clinicalHeaderPills.push([ownerName, ownerSurname].filter(Boolean).join(" "));
  }

  return {
    clinicalHeaderStatus: timelineSectionStatus,
    clinicalHeaderTitle,
    clinicalHeaderPills,
  };
}

export function buildRequiredBreakdown(draft, getTimelineFieldStatus) {
  const patientRequiredFieldKeys = Array.from(REQUIRED_FIELDS)
    .filter((fieldPath) => fieldPath.startsWith("patient."))
    .map((fieldPath) => fieldPath.slice("patient.".length));
  const ownerRequiredFieldKeys = Array.from(REQUIRED_FIELDS)
    .filter((fieldPath) => fieldPath.startsWith("owner."))
    .map((fieldPath) => fieldPath.slice("owner.".length));

  const patientRequiredStatuses = patientRequiredFieldKeys.map((fieldKey) => draft.patient[fieldKey]?.status ?? "empty");
  const ownerRequiredStatuses = ownerRequiredFieldKeys.map((fieldKey) => draft.owner[fieldKey]?.status ?? "empty");
  const timelineRequiredStatuses = draft.timeline.flatMap((event) =>
    REQUIRED_TIMELINE_FIELDS.map((fieldKey) => getTimelineFieldStatus(event.event_id, fieldKey, event?.[fieldKey])),
  );

  const patientReviewedCount = patientRequiredStatuses.filter(isReviewedStatus).length;
  const ownerReviewedCount = ownerRequiredStatuses.filter(isReviewedStatus).length;
  const historyReviewedCount = timelineRequiredStatuses.filter(isReviewedStatus).length;

  const allRequiredStatuses = [...patientRequiredStatuses, ...ownerRequiredStatuses, ...timelineRequiredStatuses];
  const totalAutoApprovedCount = allRequiredStatuses.filter((status) => classifyRequiredStatus(status) === "auto").length;
  const totalManualApprovedCount = allRequiredStatuses.filter((status) => classifyRequiredStatus(status) === "manual").length;
  const totalNeedsReviewCount = allRequiredStatuses.filter((status) => classifyRequiredStatus(status) === "needs_review").length;
  const totalRequiredCount = allRequiredStatuses.length;

  return {
    patientRequiredStatuses,
    ownerRequiredStatuses,
    timelineRequiredStatuses,
    patientReviewedCount,
    ownerReviewedCount,
    historyReviewedCount,
    totalAutoApprovedCount,
    totalManualApprovedCount,
    totalNeedsReviewCount,
    totalRequiredCount,
  };
}
