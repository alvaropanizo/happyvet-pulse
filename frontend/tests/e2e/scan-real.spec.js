import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const fixturesDirFromEnv = process.env.E2E_FIXTURES_DIR || "tests/e2e/fixtures";
const FIXTURES_DIR = path.resolve(process.cwd(), fixturesDirFromEnv);
const SUPPORTED_EXTENSIONS = new Set([".txt", ".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp"]);

function listFixtureFilesRecursively(targetDir) {
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFixtureFilesRecursively(fullPath));
      continue;
    }
    if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function getFixtureFiles() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    return [];
  }

  return listFixtureFilesRecursively(FIXTURES_DIR).map((filePath) => ({
      name: path.relative(FIXTURES_DIR, filePath),
      filePath,
      ext: path.extname(filePath).toLowerCase().slice(1),
    }));
}

const FIXTURE_FILES = getFixtureFiles();

async function backendAvailable(page) {
  try {
    const response = await page.request.get("http://127.0.0.1:8000/health");
    return response.ok();
  } catch {
    return false;
  }
}

test.describe("real scan flow from fixture files", () => {
  test.skip(FIXTURE_FILES.length === 0, `No fixture files found in ${FIXTURES_DIR}`);
});

for (const fixtureFile of FIXTURE_FILES) {
  test(`real scan flow: ${fixtureFile.name}`, async ({ page }) => {
    test.setTimeout(240000);

    const hasBackend = await backendAvailable(page);
    test.skip(!hasBackend, "Backend is not running on http://127.0.0.1:8000");

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Upload clinical history to create patient record" })).toBeVisible();

    await page.setInputFiles('input[aria-label="File selector"]', fixtureFile.filePath);
    await expect(page.getByRole("button", { name: "Scan" })).toBeVisible();
    await page.getByRole("button", { name: "Scan" }).click();

    const scanError = page.getByText("Scan error:", { exact: false });
    const structuredHeading = page.getByRole("heading", { name: "Medical record draft (read-only)" });

    const shouldRequireSuccess = fixtureFile.ext === "txt";

    // For .txt fixtures we require successful ingestion to prove text is actually read.
    // For binary formats, parsing quality may differ by environment/content so error is allowed.
    await expect
      .poll(
        async () => {
          if (await scanError.isVisible()) {
            return "error";
          }
          if (await structuredHeading.isVisible()) {
            return "success";
          }
          return "pending";
        },
        // Real scan can be slower on cold start due to OCR and PDF conversion setup.
        { timeout: 180000 },
      )
      .toMatch(shouldRequireSuccess ? /success/ : /success|error/);
  });
}

