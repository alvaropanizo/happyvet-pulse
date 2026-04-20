import { expect, test } from "@playwright/test";

test("selects a file, scans it, and shows structured record card", async ({ page }) => {
  await page.route("**/api/v1/documents/scan", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        medical_record: {
          record_id: "rec_scan_mock_001",
          source_documents: [],
          patient: {
            name: { value: "LUNA", confidence: 0.99, edited: false },
            species: { value: "Canino", confidence: 0.98, edited: false },
            breed: { value: "Mestizo", confidence: 0.97, edited: false },
            sex: { value: "Hembra", confidence: 0.99, edited: false },
            birth_date: { value: "2020-01-01", confidence: 0.9, edited: false },
            chip_id: { value: "123456", confidence: 0.9, edited: false },
            weight_kg: { value: "12", confidence: 0.8, edited: false },
          },
          owner: {
            name: { value: "Owner", confidence: 0.9, edited: false },
            address: { value: "Address", confidence: 0.8, edited: false },
          },
          timeline: [],
          problem_list: [],
          reminders: [],
          review: {
            status: "in_review",
            edited_fields: [],
            last_editor: "scan_service",
            updated_at: null,
          },
        },
        parsing_metadata: {
          engine: "gatekeeper",
          extraction_method: "fast_path",
          latency_ms: 100,
          extracted_char_count: 600,
          meaningful_text: true,
          integrity_score: 1.0,
          reason: null,
        },
        processor_version: null,
        warnings: [],
        timings_ms: null,
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Upload clinical history to create patient record" })).toBeVisible();

  await page.setInputFiles('input[aria-label="File selector"]', {
    name: "record.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Patient: Luna\nAge: 4"),
  });

  await expect(page.getByRole("button", { name: "Scan" })).toBeVisible();
  await page.getByRole("button", { name: "Scan" }).click();

  await expect(page.getByRole("heading", { name: "Medical record draft (read-only)" })).toBeVisible();
  await expect(page.getByText("Name: LUNA")).toBeVisible();
  await expect(page.getByText("rec_scan_mock_001")).toBeVisible();
  await expect(page.getByText("Scanned")).toBeVisible();
});

test("shows scan error when scan API returns failure", async ({ page }) => {
  await page.route("**/api/v1/documents/scan", async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "PARSING_INTEGRITY_LOW",
          message: "Document parsing quality is too low for reliable ingestion.",
        },
      }),
    });
  });

  await page.goto("/");
  await page.setInputFiles('input[aria-label="File selector"]', {
    name: "record.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Patient: Luna\nAge: 4"),
  });
  await page.getByRole("button", { name: "Scan" }).click();

  await expect(
    page.getByText("Scan error: Document parsing quality is too low for reliable ingestion."),
  ).toBeVisible();
});
