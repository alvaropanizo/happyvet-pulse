import { Bird, BookAlert, BookCheck, Cat, ClipboardList, Dog, FolderCheck, FolderClock, PawPrint, Search } from "lucide-react";

export function isFieldApprovedStatus(field) {
  return ["approved", "edited", "automatically_approved"].includes(field?.status ?? "empty");
}

export function isFieldEditedStatus(field) {
  return (field?.status ?? "empty") === "edited";
}

export function getSectionStatusFromFields(fields) {
  if (!fields.length) return "needs_review";
  if (!fields.every((field) => isFieldApprovedStatus(field))) return "needs_review";
  return fields.some((field) => isFieldEditedStatus(field)) ? "edited" : "approved";
}

export function getPatientApprovedIconBySpecies(speciesValue) {
  const normalized = String(speciesValue ?? "").trim().toLowerCase();
  if (normalized === "bird") return Bird;
  if (normalized === "cat") return Cat;
  if (normalized === "dog") return Dog;
  return PawPrint;
}

export function getSectionStatusIcon(sectionKey, status, patientSpeciesValue) {
  const isApproved = status === "approved" || status === "edited";
  if (sectionKey === "patient") {
    return isApproved ? getPatientApprovedIconBySpecies(patientSpeciesValue) : Search;
  }
  if (sectionKey === "owner") {
    return isApproved ? BookCheck : BookAlert;
  }
  if (sectionKey === "timeline") {
    return isApproved ? FolderCheck : FolderClock;
  }
  return ClipboardList;
}

export function isConfirmedFieldStatus(field) {
  return ["approved", "automatically_approved"].includes(field?.status ?? "empty");
}

export function isReviewedStatus(status) {
  return ["approved", "edited", "automatically_approved"].includes(status ?? "empty");
}

export function classifyRequiredStatus(status) {
  if (status === "automatically_approved") return "auto";
  if (status === "approved" || status === "edited") return "manual";
  return "needs_review";
}
