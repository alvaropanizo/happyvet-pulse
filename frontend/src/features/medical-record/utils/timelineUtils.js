import {
  AlertTriangle,
  BellRing,
  ClipboardList,
  FlaskConical,
  Hospital,
  Phone,
  Pill,
  Stethoscope,
  Syringe,
} from "lucide-react";

export function toTimelineFieldValue(value, statusOverride) {
  const hasValue = value !== null && value !== undefined && String(value).trim() !== "";
  return {
    value: value ?? "",
    confidence: 0.0,
    edited: false,
    status: statusOverride ?? (hasValue ? "pending" : "empty"),
  };
}

export function diagnosesToText(diagnoses) {
  return (diagnoses ?? []).map((diagnosis) => diagnosis?.text).filter(Boolean).join("\n");
}

export function treatmentsToText(treatments) {
  return (treatments ?? []).map((treatment) => treatment?.medication).filter(Boolean).join("\n");
}

export function testsToText(tests) {
  return (tests ?? []).map((test) => test?.test_name).filter(Boolean).join("\n");
}

export function attachmentNamesToText(attachments) {
  return (attachments ?? [])
    .map((attachment) => String(attachment).split("/").pop())
    .filter(Boolean)
    .join("\n");
}

export function parseDiagnosesText(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({ text, status: "suspected" }));
}

export function parseTreatmentsText(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((medication) => ({ medication, dose: null, frequency: null, duration: null }));
}

export function parseTestsText(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((test_name) => ({ test_name, result_summary: null, values: [] }));
}

export function eventTypeIcon(eventType) {
  const iconMap = {
    visit: Stethoscope,
    lab: FlaskConical,
    administrative: ClipboardList,
    vaccination: Syringe,
    phone_call: Phone,
    hospitalization: Hospital,
    prescription: Pill,
    problem: AlertTriangle,
    reminder: BellRing,
  };
  return iconMap[eventType] ?? ClipboardList;
}
