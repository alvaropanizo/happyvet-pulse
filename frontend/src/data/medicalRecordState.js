import { medicalRecordEmptyState } from "./medicalRecordEmptyState";
import { medicalRecordMockData } from "./medicalRecordMockData";

function deepClone(data) {
  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }
  return JSON.parse(JSON.stringify(data));
}

export function getInitialMedicalRecordState() {
  // Safety rule: never show mock medical data in production builds.
  if (import.meta.env.PROD) {
    return deepClone(medicalRecordEmptyState);
  }

  const isDevOrTest = import.meta.env.DEV || import.meta.env.MODE === "test";
  const useMockData = isDevOrTest && import.meta.env.VITE_USE_MEDICAL_RECORD_MOCK === "true";

  return deepClone(useMockData ? medicalRecordMockData : medicalRecordEmptyState);
}
