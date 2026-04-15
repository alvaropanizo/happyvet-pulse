import { expect, test } from "@playwright/test";

test("uploads a txt file and shows returned metadata", async ({ page }) => {
  await page.route("**/api/v1/documents/upload", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        filename: "record.txt",
        content_type: "text/plain",
        size_bytes: 21,
        text_preview: "Patient: Luna",
      }),
    });
  });

  await page.goto("/");
  await page.setInputFiles('input[aria-label="File selector"]', {
    name: "record.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Patient: Luna\nAge: 4"),
  });

  await expect(page.getByRole("heading", { name: "Upload result metadata" })).toBeVisible();
  await expect(page.getByText("File name: record.txt")).toBeVisible();
  await expect(page.getByText("Content type: text/plain")).toBeVisible();
  await expect(page.getByText("Size (bytes): 21")).toBeVisible();
  await expect(page.getByText("Text preview: Patient: Luna")).toBeVisible();
});

test("shows upload error when API returns failure", async ({ page }) => {
  await page.route("**/api/v1/documents/upload", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Uploaded file is empty." }),
    });
  });

  await page.goto("/");
  await page.setInputFiles('input[aria-label="File selector"]', {
    name: "empty.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(""),
  });

  await expect(page.getByText("Upload error: Uploaded file is empty.")).toBeVisible();
});
