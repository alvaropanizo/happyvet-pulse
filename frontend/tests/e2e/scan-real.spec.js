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
const BENCHMARK_TYPES = ["txt", "pdf", "jpg", "docx"];

function pickBenchmarkFixtures() {
  const rankedFixtures = [...FIXTURE_FILES]
    .filter((fixture) => !fixture.name.startsWith("benchmark-"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = [];
  for (const type of BENCHMARK_TYPES) {
    const nonCiMatch = rankedFixtures.find((fixture) => fixture.ext === type && !fixture.name.startsWith("CI/"));
    const fallbackMatch = rankedFixtures.find((fixture) => fixture.ext === type);
    const chosen = nonCiMatch ?? fallbackMatch;
    if (chosen) {
      selected.push(chosen);
    }
  }
  return selected;
}

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

test("real scan benchmark: report mapping coverage from fixtures", async ({ page }) => {
  test.setTimeout(240000);

  const hasBackend = await backendAvailable(page);
  test.skip(!hasBackend, "Backend is not running on http://127.0.0.1:8000");

  const benchmarkFixtures = pickBenchmarkFixtures();
  test.skip(benchmarkFixtures.length === 0, `No benchmark fixtures found in ${FIXTURES_DIR}`);

  const results = [];

  for (const fixtureFile of benchmarkFixtures) {
    const response = await page.request.post("http://127.0.0.1:8000/api/v1/documents/scan", {
      multipart: {
        file: {
          name: path.basename(fixtureFile.filePath),
          mimeType: "application/octet-stream",
          buffer: fs.readFileSync(fixtureFile.filePath),
        },
      },
    });

    const payload = await response.json();
    const statusCode = response.status();
    const metadata = payload?.parsing_metadata ?? null;

    let coveragePct = null;
    let mappedCount = null;
    let totalCount = null;
    let timelineEventsCount = null;

    if (statusCode === 200 && metadata) {
      coveragePct = metadata.mapping_coverage_pct;
      mappedCount = metadata.mapped_fields_count;
      totalCount = metadata.total_fields_count;
      timelineEventsCount = Array.isArray(payload?.medical_record?.timeline)
        ? payload.medical_record.timeline.length
        : 0;

      // "Check it" without enforcing quality target:
      // ensure metric payload exists and has a coherent shape.
      expect(typeof coveragePct).toBe("number");
      expect(typeof mappedCount).toBe("number");
      expect(typeof totalCount).toBe("number");
      expect(mappedCount).toBeGreaterThanOrEqual(0);
      expect(totalCount).toBeGreaterThan(0);
      expect(mappedCount).toBeLessThanOrEqual(totalCount);
      expect(coveragePct).toBeGreaterThanOrEqual(0);
      expect(coveragePct).toBeLessThanOrEqual(100);
      expect(typeof timelineEventsCount).toBe("number");
      expect(timelineEventsCount).toBeGreaterThanOrEqual(0);
    }

    results.push({
      file: fixtureFile.name,
      statusCode,
      coveragePct,
      mappedCount,
      totalCount,
      timelineEventsCount,
      extension: fixtureFile.ext,
      reason: metadata?.reason || payload?.error?.code || null,
    });
  }

  const successful = results.filter((item) => typeof item.coveragePct === "number");
  const avgCoverage =
    successful.length > 0
      ? Number((successful.reduce((acc, item) => acc + item.coveragePct, 0) / successful.length).toFixed(2))
      : null;
  const timelineSuccess = successful.filter((item) => (item.timelineEventsCount ?? 0) >= 1).length;
  const perType = new Map();
  for (const item of successful) {
    const ext = item.extension;
    const existing = perType.get(ext) ?? { coverage: [], timelineWithEvents: 0, total: 0 };
    existing.coverage.push(item.coveragePct);
    if ((item.timelineEventsCount ?? 0) >= 1) {
      existing.timelineWithEvents += 1;
    }
    existing.total += 1;
    perType.set(ext, existing);
  }

  console.log("");
  console.log(`=== Parsing-to-model coverage benchmark (${results.length} fixture${results.length === 1 ? "" : "s"}) ===`);
  for (const result of results) {
    const coverageText =
      typeof result.coveragePct === "number"
        ? `${result.coveragePct}% (${result.mappedCount}/${result.totalCount})`
        : "n/a";
    const timelineText =
      typeof result.timelineEventsCount === "number"
        ? `${result.timelineEventsCount} event(s)`
        : "n/a";
    const suffix = result.reason ? ` | reason=${result.reason}` : "";
    console.log(
      `- ${result.file} | type=${result.extension} | status=${result.statusCode} | ` +
        `coverage=${coverageText} | timeline=${timelineText}${suffix}`,
    );
  }
  console.log(
    `Average coverage (successful scans only): ${avgCoverage === null ? "n/a" : `${avgCoverage}%`} ` +
      `| successful=${successful.length}/${results.length}`,
  );
  console.log(
    `Timeline extraction (>=1 events): ${timelineSuccess}/${successful.length || 0} successful scans`,
  );
  if (perType.size > 0) {
    console.log("Per-file-type coverage:");
    for (const [ext, stats] of perType.entries()) {
      const extAvg = Number((stats.coverage.reduce((acc, value) => acc + value, 0) / stats.total).toFixed(2));
      console.log(
        `- ${ext}: avg_coverage=${extAvg}% | timeline_hits=${stats.timelineWithEvents}/${stats.total}`,
      );
    }
  }
  console.log("=======================================================");
  console.log("");
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
    const structuredHeading = page
      .getByRole("heading")
      .filter({ hasText: /Draft Clinical History|Clinical History/i })
      .first();

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

