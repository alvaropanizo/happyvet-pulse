const API_BASE_URL = import.meta.env.BACKEND_API_BASE_URL || "http://localhost:8000";

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "Upload failed.";
    try {
      const errorPayload = await response.json();
      detail = errorPayload.error?.message || errorPayload.detail || detail;
    } catch {
      // Keep default error detail if parsing fails.
    }

    throw new Error(detail);
  }

  return response.json();
}

export async function scanDocument(file) {
  if (!file) {
    throw new Error("Please select a document before scanning.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/documents/scan`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "Scan failed.";
    try {
      const errorPayload = await response.json();
      detail = errorPayload.error?.message || errorPayload.detail || detail;
    } catch {
      // Keep default message if parsing fails.
    }

    throw new Error(detail);
  }

  const payload = await response.json();
  if (payload?.medical_record) {
    return payload.medical_record;
  }
  return payload;
}
