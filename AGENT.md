# HappyVet Pulse - Agent Guide

This document gives shared context for autonomous agents working on the project.
Use it as the default reference for development decisions.

## Product Goal

Build a lean Human-in-the-Loop Intelligent Document Processing (IDP) system for veterinary records:

1. Ingest unstructured files (PDF, Word, image formats)
2. Extract raw text (parsing + OCR fallback)
3. Structure content into a normalized schema
4. Present extracted data in an editable UI for clinical review

## Repository Structure

```text
/happyvet-pulse
  /contracts
    medical_record.schema.json
  /backend
    /app
      __init__.py
      /api
        /routes
          documents.py
          health.py
      /document_processing
        __init__.py
        base.py
        gatekeeper_processor.py
        extractors.py
        quality_gate.py
        factory.py
        medical_record_mapper.py
        models.py
      /core
        error_handlers.py
        exceptions.py
        logging.py
      /schemas
        error.py
        medical_record.py
      main.py
    /tests
      test_health.py
      test_upload.py
    pytest.ini
    Dockerfile
    requirements.txt
  /frontend
    index.html
    vite.config.js
    playwright.config.js
    package-lock.json
    /public
      vetpulse-icon.svg   # favicon + top-left brand bubble (/vetpulse-icon.svg)
    /src
      App.jsx
      main.jsx
      App.test.jsx
      /contracts
        medicalRecordContract.test.js
      /constants
        previewTypes.js
      /components
        DocumentPreview.jsx
        FileQuickPreviewThumb.jsx
        MedicalRecordPanel.jsx
        RecentDocumentsPanel.jsx
        StructuredRecordSkeleton.jsx
        DocumentReviewSplitLayout.jsx
        DocumentReviewToolbar.jsx
        DocumentReviewRightPanel.jsx
        UploadDropzoneFooter.jsx
        UploadPanel.jsx
        UploadLandingSection.jsx
        UploadResultCard.jsx
        /icons
          MaterialUploadIcon.jsx
          ArrowForwardIcon.jsx
        /layout
          AppShell.jsx
          SiteFooter.jsx
      /data
        medicalRecordEmptyState.js
        medicalRecordMockData.js
        medicalRecordState.js
        uiContent.json
      /hooks
        uploadDocument.js
      /styles
        theme.css
      /test
        setup.js
      /utils
        filePreview.js
        validateUiContent.js
    /tests
      /e2e
        /fixtures
        upload-smoke.spec.js
        scan-real.spec.js
    /scripts
      check-backend-health.mjs
    .env.example
    Dockerfile
    package.json
  docker-compose.yml
  .gitignore
  README.md
```

## Agent Responsibilities

- **Backend agent (FastAPI/Python)** owns:
  - Upload APIs and file lifecycle
  - Document text extraction pipeline and parser abstraction boundaries
  - Data structuring and schema validation
  - API contracts consumed by frontend
  - Test coverage for extraction and transformation logic

- **Frontend agent (React)** owns:
  - Upload flow and document preview UX
  - Structured-data visualization
  - Human correction/editing experience
  - API integration hooks and UI state handling
  - Core UI behavior tests (as test framework is added)

## Core Principles for Next Iterations

- Start simple and modular; avoid early over-engineering.
- Keep extraction providers replaceable (strategy pattern or adapter boundary).
- Treat uncertain extraction output as first-class (confidence fields, nullable values, review flags).
- Keep strict schema contracts between BE and FE (versioned and documented).
- Use shared JSON Schema contract as the cross-stack baseline (`contracts/medical_record.schema.json`).
- Prioritize deterministic behavior, observability, and error transparency.

## Suggested Backend Direction

- Keep API route handlers thin; move logic into service modules.
- Normalize extracted output into typed Pydantic schemas.
- Preserve raw artifacts (original file metadata + raw extraction text) for traceability.
- Separate concerns:
  - `api/` request/response + routing
  - `core/` settings, constants, shared utilities
  - `models/` persistence models when DB is introduced
  - `schemas/` API and domain validation contracts

## Suggested Frontend Direction

- Isolate API calls in dedicated hooks/modules from presentational components.
- Keep editable structured data state explicit and serializable.
- Design UI around review workflow:
  - Source document visibility
  - Extracted fields and confidence/context
  - Clear approve/correct interactions

## Initial Data Contract (Conceptual)

Agents should align around a minimal document extraction payload shape early:

- `document_id`
- `source_type`
- `language`
- `raw_text`
- `sections` (optional grouped content)
- `entities` (key-value extractions with confidence and provenance)
- `status` (`uploaded`, `processed`, `needs_review`, `approved`)
- `timestamps`

Exact schema can evolve, but changes should be coordinated across both agents.

## Collaboration Rules

- Keep commits focused by concern (backend vs frontend vs infra/docs).
- Document API/interface changes in `README.md`.
- Add tests with each new behavior where feasible.
- Prefer environment-driven configuration over hardcoded values.
- Surface assumptions and open questions explicitly in PR descriptions.

## Definition of Good Progress

- Working end-to-end vertical slice as early as possible.
- Clear interfaces that allow swapping extraction methods later.
- Review UI that supports manual correction without blocking iteration.
- Code that is readable, testable, and easy for new contributors to extend.

## Milestone 1 Baseline (Current State)

- Backend includes a FastAPI app with `GET /health`.
- Frontend includes a minimal Vite + React shell screen.
- `docker-compose.yml` runs both services locally.
- Basic automated tests are in place for BE and FE.

### Local Service Endpoints

- Backend API: `http://localhost:8000`
- Backend health: `http://localhost:8000/health`
- Frontend app: `http://localhost:5173`

### Local Test Commands

- Backend:
  - `cd backend`
  - `python3 -m venv .venv`
  - `. .venv/bin/activate`
  - `pip install -r requirements.txt`
  - `pytest -q`
- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run test`
  - `npm run test:e2e`

### CI / Pipeline Status

- GitHub Actions workflow is configured at `.github/workflows/tests.yml`.
- Tests run automatically on `push` and `pull_request` for:
  - backend tests (`pytest -q`)
  - frontend tests (`npm run test`)
  - frontend e2e smoke tests (`npm run test:e2e`) after FE tests pass

### Conventions for Upcoming Iterations

- **API namespace**: introduce endpoints under `/api/v1/*` as features are added.
- **Extraction pipeline**: start parser-first, then OCR fallback, and record method used.
- **Structured output**: every extracted field should support value + confidence + source span/provenance when possible.
- **Human review flow**: design for "extract -> review -> correct -> approve".
- **Backward compatibility**: coordinate schema changes between FE and BE in the same iteration.

## Milestone 2 Decisions (Current)

### UI Scope (Current Progress)

- Milestone 2 started with **frontend-only** iteration.
- Current UI includes:
  - upload area with drag-and-drop and click-to-select behavior
  - left panel showing "Last uploaded documents"
  - uploaded filename list (client-side state)

### Frontend Architecture Decisions

- Upload UI has been componentized into:
  - `frontend/src/components/UploadPanel.jsx`
  - `frontend/src/components/RecentDocumentsPanel.jsx`
  - `frontend/src/components/DocumentPreview.jsx`
  - `frontend/src/components/UploadResultCard.jsx`
- `frontend/src/App.jsx` acts as composition/layout container and shared state owner.
- API integration is isolated in `frontend/src/hooks/uploadDocument.js`.
- Keep this split for future features (upload status, API integration, previews).

### Styling and Design Constraints

- Required palette:
  - `#ffefeb` main background
  - `#fd4d0d` primary actions/details
  - `#fae0ff` secondary soft accent
  - `#3898ff` info/secondary accent
- Title font stack:
  - `"ESRebondGrotesque","Arial",sans-serif`
- Main upload title text:
  - `"Upload medical record documents"`
- Layout target:
  - left/right 2:8 proportion (implemented via CSS grid `2fr 8fr`)

### Frontend Library Choices

- UI framework: `react-bootstrap`
- Icons: `bootstrap-icons`
- Base styles: `bootstrap` CSS imported in `src/main.jsx`

### Testing Decisions

- Frontend integration tests (`frontend/src/App.test.jsx`) cover:
  - heading + empty state
  - upload selection/list update
  - metadata rendering from successful API response
  - metadata fallback when preview text is empty
  - unsupported file fallback
  - DOCX fallback
  - API error display
- Utility tests (`frontend/src/utils/filePreview.test.js`) validate file-type classification.
- E2E smoke tests (`frontend/tests/e2e/upload-smoke.spec.js`) cover:
  - successful TXT upload -> metadata visible
  - API failure -> upload error visible

### Docker/Compose Safety Notes for FE Dev

- Frontend runs with bind mount (`./frontend:/app`) plus named volume for `node_modules`.
- To avoid missing-dependency issues after adding packages, compose command checks required modules and runs `npm ci` when needed.
- If stale module volume causes import resolution errors, use:
  - `docker compose down -v`
  - `docker compose up --build`

### Backend Milestone 2 Status

- Upload endpoint implemented at `POST /api/v1/documents/upload`.
- Endpoint returns quick metadata:
  - `filename`
  - `content_type`
  - `size_bytes`
  - `text_preview`
- API routes are modularized:
  - `backend/app/api/routes/health.py`
  - `backend/app/api/routes/documents.py`
- Centralized error handling implemented:
  - app-level `AppError`
  - global handlers for app + validation errors
  - standardized payload: `{"error": {"code": "...", "message": "..."}}`
- Centralized logging utility implemented and used by upload route.
- Backend tests include:
  - health endpoint
  - upload success
  - empty upload error
  - missing file validation error

## Milestone 3 Decisions (Current)

### Data Model Baseline

- Canonical backend draft schema added at:
  - `backend/app/schemas/medical_record.py`
- Shared JSON Schema contract added at:
  - `contracts/medical_record.schema.json`
- Frontend matching state sources added at:
  - `frontend/src/data/medicalRecordEmptyState.js`
  - `frontend/src/data/medicalRecordMockData.js`
  - `frontend/src/data/medicalRecordState.js`
- Current scope is intentionally **in-app state only** (no persistence/save flow yet).

### Frontend Milestone 3 UI Baseline

- Added read-only structured panel:
  - `frontend/src/components/MedicalRecordPanel.jsx`
- `frontend/src/App.jsx` now wires:
  - upload flow state
  - upload metadata state
  - medical record draft state (read-only render for now)
  - scan action (`POST /api/v1/documents/scan`) to refresh displayed structured record
- UI content keys for structured panel are centralized in:
  - `frontend/src/data/uiContent.json`

### Milestone 3 Development Guidance

- Keep schema alignment between:
  - BE model (`backend/app/schemas/medical_record.py`)
  - shared JSON Schema (`contracts/medical_record.schema.json`)
  - FE state seeds (`medicalRecordEmptyState.js`, `medicalRecordMockData.js`)
- Favor incremental editable fields over full-form editing in one step.
- Keep traceability fields (`source_span`, `document_id`) first-class in future extraction wiring.
- Persistence is explicitly out-of-scope until a later milestone.
- Local FE->BE integration expects CORS allowance for:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

### Contract Testing Baseline

- Backend contract checks (`backend/tests/test_upload.py`):
  - scan payload validates against Pydantic schema
  - scan payload validates against shared JSON Schema
- Frontend contract checks (`frontend/src/contracts/medicalRecordContract.test.js`):
  - empty state validates against shared JSON Schema
  - mock state validates against shared JSON Schema
- Keep contract strict enough for compatibility, but avoid over-constraining future optional fields.

## Milestone 4 Decisions (Current)

### Intelligent Document Ingestion Pivot (Performance-first)

- `POST /api/v1/documents/scan` now accepts multipart `UploadFile`.
- Parsing pipeline keeps the swappable abstraction:
  - `backend/app/document_processing/base.py` (`DocumentProcessor`)
  - default implementation is now a gatekeeper processor (implemented in `backend/app/document_processing/gatekeeper_processor.py`)
  - selector/factory: `backend/app/document_processing/factory.py`
- Gatekeeper routing rules:
  - `.txt` -> native decode (fast path)
  - `.docx` -> `python-docx` parse (fast path)
  - `.pdf` -> `PyMuPDF` text extraction first, then OCR fallback when insufficient
  - images (`.jpg`, `.jpeg`, `.png`, `.webp`) -> OCR fallback path
- Decision-maker heuristic (`is_extraction_sufficient`):
  - reject extraction when text length is `< 150`
  - reject extraction when no medical keyword match is found (`patient`, `breed`, `clinical`, `history`, `weight`)
  - rejected fast-path output triggers OCR fallback automatically
- Output mapping remains unchanged:
  - extracted text is mapped to `MedicalRecordDraft.source_documents[].raw_text`
  - mapper: `backend/app/document_processing/medical_record_mapper.py`

### Parsing Metadata and Error Policy

- Parsing metadata contract is explicit and now includes routing/timing:
  - `engine`
  - `extraction_method` (`fast_path` | `tesseract_fallback`)
  - `latency_ms`
  - `extracted_char_count`
  - `meaningful_text`
  - `integrity_score`
  - `reason` (optional)
- Low-integrity extraction handling remains:
  - endpoint returns `PARSING_INTEGRITY_LOW` (422)

### Dependency / Docker Decisions (Milestone 4 Pivot)

- Heavy ML OCR dependency chains were removed to reduce build/runtime cost.
- Migration note:
  - `DOCUMENT_PROCESSOR` now only supports `gatekeeper`.
  - legacy values are no longer accepted and will raise `UNSUPPORTED_DOCUMENT_PROCESSOR`.
- Backend dependencies now include:
  - `PyMuPDF`
  - `python-docx`
  - `pdf2image`
  - `pytesseract`
- Backend Docker strategy:
  - keeps `python:3.11-slim`
  - uses multi-stage build to keep runtime image leaner
  - installs runtime system libs and OCR/PDF binaries:
    - `libgl1`, `libglib2.0-0`
    - `tesseract-ocr`, `libtesseract-dev`, `poppler-utils`

### Contract and Testing Coverage

- Shared contract file:
  - `contracts/medical_record.schema.json`
  - `parsing_metadata` now requires `extraction_method` and `latency_ms`
- Backend tests (`backend/tests/test_upload.py`) cover:
  - multipart scan ingestion path
  - mapped raw text in schema payload
  - parsing metadata in scan response
  - low-quality parsing error behavior
  - CORS preflight
- Frontend tests (`frontend/src/App.test.jsx`) cover:
  - scan requires selected file
  - multipart scan request shape (`FormData` with `file`)
  - scan success render
  - scan parsing error render
- Frontend contract tests (`frontend/src/contracts/medicalRecordContract.test.js`) validate the updated envelope metadata contract.

### Real E2E Validation (Milestone 4)

- Real scan E2E suite:
  - `frontend/tests/e2e/scan-real.spec.js`
- Fixture-driven scan files live in:
  - `frontend/tests/e2e/fixtures/`
- CI-safe committed fixtures live in:
  - `frontend/tests/e2e/fixtures/CI/`
- Supported fixture extensions for real scan tests:
  - `.txt`, `.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.webp`
- Fail-fast pre-check before running real scan E2E:
  - `frontend/scripts/check-backend-health.mjs`
  - `npm run test:e2e:real` now fails with a clear message when backend healthcheck is unavailable instead of silently skipping.
- CI-focused real scan command:
  - `npm run test:e2e:real:ci`
  - uses `E2E_FIXTURES_DIR=tests/e2e/fixtures/CI`
- Recommended local sequence for real scan E2E:
  - `docker compose up --build`
  - `cd frontend && npm run test:e2e:real`
- GitHub Actions real scan job:
  - `.github/workflows/tests.yml` -> `frontend-e2e-real-ci`
  - starts backend service, waits for `/health`, then executes `npm run test:e2e:real:ci`

## Milestone 5 Decisions (Current)

### Frontend UI Polish and Maintainability

- Milestone 5 is primarily a **frontend-only** pass: upload marketing header, redesigned dropzone + footer, full-window drag overlay, branding, and styling hygiene—**no backend API changes** required for these items.
- **Copy and structured data** live in `frontend/src/data/uiContent.json`. Do not introduce a second parallel UI JSON file.
- **Runtime validation** in `frontend/src/utils/validateUiContent.js`:
  - Required **string** keys as listed in `REQUIRED_PATHS`.
  - **`uploadPanel.sampleFiles`**: must be a **non-empty array** of objects, each with a non-empty **`fileName`** string (mock sample list for pills).

### Upload step architecture (reference)

- **`App.jsx` (upload step):** `hv-upload-screen` — header block (rotating word animation driven by CSS + word list in JS), optional **brand bubble** (`/vetpulse-icon.svg`), **FAB** stub for dark mode (`app.themeFabAriaLabel`), then `UploadPanel`.
- **`UploadPanel.jsx`:** Single **Card**; **`Card.Body`** is the interactive drop target (click + keyboard); **`UploadDropzoneFooter`** is attached below the body inside the same card—footer clicks **`stopPropagation`** so they do not trigger file pick (until sample actions are implemented).
- **`MaterialUploadIcon.jsx`:** Inline SVG (Material-style upload glyph), no extra icon font dependency.
- **Drag overlay:** When a file drag is active, a **fixed** full-screen layer sits **above** other fixed UI (high `z-index`); avoid parent wrappers with `z-index` that trap stacking. Overlay fill uses **`rgba(var(--hv-color-accent-soft-highlight-rgb), var(--hv-overlay-alpha))`** so hue is preserved while tuning transparency via `--hv-overlay-alpha`.
- **Body class** `hv-drag-active` applies **`cursor: copy`** during drag.

### Frontend Styling Rules (Milestone 5)

- Styling is centralized in:
  - `frontend/src/styles/theme.css`
- `frontend/src/styles/uiTheme.js` has been retired and must not be reintroduced.
- Avoid inline style objects in JSX (`style={{ ... }}`) except for temporary experiments that are removed before merge.
- Favor CSS variables in `:root` plus semantic utility/component classes (`hv-*`) for:
  - colors
  - typography
  - spacing/radius
  - component state variants (e.g., drag-over)
- Import order in `frontend/src/main.jsx` should remain:
  - Bootstrap base CSS
  - project `theme.css` overrides

### Static assets (Vite)

- Put fixed-URL assets in **`frontend/public/`** (served at site root): e.g. `public/vetpulse-icon.svg` → `src="/vetpulse-icon.svg"` in `<img>` or `<link rel="icon" ...>`.
- Put imported/hashed assets in **`frontend/src/assets/`** and `import` them in components when you want build-time hashing.

### Milestone 5 Development Guidelines

- Keep the first upload step focused on a **single-file** clinical-history workflow (`one pet per upload` in copy).
- Any text/copy update must be:
  - added in `uiContent.json`
  - covered by `validateUiContent.js` (strings + **`sampleFiles`** shape)
  - reflected in **`App.test.jsx`** (or other tests) when user-visible behavior changes
- Keep components presentational:
  - no theme constants in component files
  - no duplicate style literals across components
- Prefer additive CSS classes over one-off selectors tied to DOM depth.
- Preserve React-Bootstrap usage for structure, while visual identity remains in `theme.css`.
- **Next implementations** (explicitly still open): wire **sample pills** to real files or scan; implement **dark mode** for the FAB; optional Milestone 5 screenshot in `docs/images/`.

### Milestone 5 Latest Flow Decisions (Current)

- **Review split persistence:**
  - Once a file is selected, render path remains in the review split state.
  - Do not key remount by `preview` vs `structured`; only switch upload vs review container state.
  - Goal: avoid full-page re-animation/reload feel when scan completes.

- **Left pane invariant after scan:**
  - Keep `DocumentReviewToolbar` + embedded `DocumentPreview` visible before, during, and after scan.
  - Do not swap to a separate post-scan left placeholder/message component.

- **Toolbar scan state machine (`DocumentReviewToolbar.jsx`):**
  - **idle:** enabled `Scan` button + tooltip
  - **scanning:** disabled grey button with `Scanning` label and inline spinner
  - **completed:** non-interactive `Scanned` status with green check
  - Keep accessibility semantics (`role="status"` for completion, busy semantics for scanning state).

- **Scanning feedback placement:**
  - Remove extra in-card scan status block from `App.jsx`.
  - Primary progress cue is now the toolbar scan control state itself.
  - Keep scan API errors visible in a compact error row beneath the toolbar.

- **Reset flow removal:**
  - “Reset working page” CTA and its confirmation modal are intentionally removed.
  - `uiContent.json` + `validateUiContent.js` should not include the old `app.resetFlow.*` requirements.

- **State reset on file removal:**
  - Confirming remove file must clear `selectedFile`, `scanCompleted`, scan errors, and reset medical record state to initial defaults.

- **Source of truth updates for this flow:**
  - `frontend/src/App.jsx`
  - `frontend/src/components/DocumentReviewToolbar.jsx`
  - `frontend/src/styles/theme.css`
  - `frontend/src/data/uiContent.json`
  - `frontend/src/utils/validateUiContent.js`
  - `frontend/src/App.test.jsx`
  - `frontend/tests/e2e/upload-smoke.spec.js`

### Milestone 5 Latest UI/Form Decisions (Current)

- **MedicalRecordPanel is now editable-first:**
  - `frontend/src/components/MedicalRecordPanel.jsx` renders backend-derived data as editable `Form.Control` / `Form.Select` fields (instead of read-only summary text rows).
  - Panel keeps a local normalized draft seeded from scan payload and resilient to partial/missing backend fields.
  - Current editable scope includes:
    - `record_id`
    - `review.status`
    - patient + owner field values
    - recent timeline rows
    - problem rows
    - reminder rows
    - raw extracted text textarea
  - Confidence metadata may still exist in payload but is intentionally hidden in UI for this slice.

- **Split layout overflow/height behavior:**
  - Post-scan, review split should remain height-bounded (no column growth from expanded accordions).
  - Left and right panes are expected to scroll internally in their pane body area when content exceeds available height.
  - Keep left preview + toolbar stable/visible while right form can grow via internal scroll.

- **Image preview fallback rule:**
  - For image preview/thumbnails (`DocumentPreview`, `FileQuickPreviewThumb`), when image load fails use:
    - `https://www.barkibu.com/images/templates/pre-sales/dog-and-cat.svg`
  - Guard fallback swap to avoid infinite `onError` loops.

- **Frontend maintainability sweep (Milestone 5):**
  - Prefer small render helpers and reduced branch duplication in JSX (`App`, `DocumentPreview`, split/layout/footer components).
  - Preserve behavior and accessibility semantics while refactoring structure.

## Milestone 6 Decisions (Current)

### Backend parsing and model hardening

- `/api/v1/documents/scan` includes parser-to-model mapping coverage metadata:
  - `mapping_coverage_pct`
  - `mapped_fields_count`
  - `total_fields_count`
- `backend/app/document_processing/medical_record_mapper.py` is the source of truth for extraction-to-model mapping rules:
  - species normalization (`cat | dog | bird | other`)
  - multilingual label detection + robust date/fuzzy parsing (`dateparser`, `rapidfuzz`)
  - timeline-first enrichment with derived clinical events.
- Mapper architecture is now split into focused modules for maintainability and deterministic hardening:
  - `mapper_constants.py`, `mapper_common.py`, `mapper_key_value.py`, `mapper_scalar_rules.py`, `mapper_timeline.py`, `mapper_coverage.py`
  - `medical_record_mapper.py` is kept as thin orchestration.
- Local/host resilience rule:
  - if `rapidfuzz` is unavailable, mapper fuzzy matching falls back to stdlib-based partial ratio logic (reduced quality but functional diagnostics).
- Top-level `problem_list` and `reminders` are removed from model/contract payloads.
  - Problem/reminder signals are represented as timeline events (`event_type: "problem"`, `"reminder"`).
- Review/status automation and extraction status states include:
  - `empty`, `pending`, `approved`, `automatically_approved`, `edited`
  - automatic review promotion when parser integrity/confidence is high.
- Scalar hardening decisions:
  - patient/owner extraction prioritizes demographic/header block before clinical-history/event narrative.
  - owner-name extraction priority prefers owner/account-holder labels over representative labels.
  - owner contact validation is strict:
    - email must be syntactically valid.
    - phone must be realistic and not temperature/noise text.
    - address requires meaningful textual pattern and excludes obvious noise.
- Timeline hardening decisions:
  - for explicit `EVENT N` chronicles, parser prioritizes explicit event block splitting.
  - event dates prefer strict `Date/Fecha` labeled extraction and avoid broad fuzzy date grabs from unrelated lines.
  - event payload routing:
    - `Anamnesis` label -> `anamnesis`
    - diagnosis/treatment/test labels -> typed lists
    - remaining clinically relevant context -> `assessment`.
  - header/demographic lines must not produce clinical timeline/problem events.
  - derived `problem`/`reminder` generation is disabled when explicit event blocks exist to avoid inflation.
  - event deduplication/signature filtering is applied to limit OCR/page-repeat duplication in long files.

### Contract alignment rules

- Shared contract remains `contracts/medical_record.schema.json`.
- Schema naming in the contract uses `medicalRecordFinal`.
- Owner contract shape is:
  - required: `name`, `surname`, `phone_number`, `email`
  - optional: `address`
- UI required-field definitions are maintained in `frontend/src/contracts/uiRequiredFields.js` and enforced by `frontend/src/contracts/medicalRecordContract.test.js`.

### Frontend review UX decisions

- `MedicalRecordPanel` primary sections are:
  - `Patient`
  - `Owner`
  - `Clinical History`
  - `Overview`
- Clinical history is tile-based with:
  - compact headers + event chips/icons
  - expand/collapse row editing
  - add/remove
  - select all/none and bulk delete with confirmation.
- Event and section approval is derived from required-field validation status (not only from non-empty values).
- Collapse behavior:
  - auto-collapse only when the final required field transitions an event/section to approved
  - text edits use idle debounce before collapse.
- Milestone 6 wrap-up:
  - raw extracted text is removed from the Overview summary content.

## Current Development Rules (Active)

These rules reflect the latest cross-cutting implementation decisions and should be treated as current guardrails for all new changes.

### Theme and styling system

- Theme mode behavior:
  - default mode is **light** on first visit.
  - persisted user preference in `localStorage` key `hv-theme` is authoritative on subsequent visits.
  - theme is applied through `document.documentElement[data-theme]` (`light` / `dark`).
- Color system:
  - all new colors must be introduced as CSS variables in `frontend/src/styles/theme.css`.
  - avoid hardcoded `#hex` and raw `rgb/rgba` in component rules unless defining shared tokens in `:root`.
  - dark theme must reuse the established palette/token set (no ad-hoc one-off dark-only literals in component rules).
- Bootstrap integration:
  - `.card` and `.accordion` surfaces must inherit theme variables (`--bs-card-*`, `--bs-accordion-*`) so container backgrounds/borders/text update with theme changes.

### Upload and scan limits / fixtures

- Hard limit for upload and scan payloads is **1GB**:
  - frontend pre-checks in `frontend/src/hooks/uploadDocument.js`.
  - backend validation in `backend/app/api/routes/documents.py` (`413 FILE_TOO_LARGE`).
- Dev-only synthetic oversized sample:
  - sample name is `big_file` in `frontend/src/data/uiContent.json`.
  - shown only when URL includes `?dev=true`.
  - synthetic file generation must override `File.size` without allocating huge in-memory content.

### Medical record review/status behavior

- Timeline required-field logic:
  - untouched `automatically_approved` required fields must remain `automatically_approved` when another field in the same event is edited.
  - event status derives from required fields and is considered complete when required fields are in `approved`, `automatically_approved`, or `edited`.
- Overview/status rendering:
  - overview counters use `Partial / Total` pill format and completion state coloring.
  - section/header icon colors are status-driven (`needs_review`, `edited`, `approved`) and should not be hardcoded static green.
  - top clinical header shows a green `Ready to save` badge when Patient + Owner + Clinical History are all fully validated.

### Document review preview and scan-assistant behavior

- Embedded preview behavior:
  - image files should render in scrollable image frame mode (`hv-media-image-frame--embedded`) with width-first display.
  - non-image embedded files (e.g. `.docx`, `.txt`, unsupported) should use the centered thumbnail stage (`hv-review-preview-thumb-stage`) with quick icon + filename.
  - image preview type detection must consider extension fallback when MIME is missing/incorrect (`png`, `jpg`, `jpeg`, `webp`, `gif`).
  - blob/object URL lifecycle in preview components must be effect-managed to avoid premature URL revocation.
- Rive scan assistant:
  - Rive file is expected at `frontend/public/animations/cat.riv`.
  - idle state should play blink-only behavior by default; scan state can trigger tail/leg movement timelines.
  - right review panel no longer uses the old spinner/skeleton stack as primary feedback; Rive panel is the main scan feedback surface.
  - rotating scan quotes are sourced from `uiContent.json` (`documentReviewRightPanel.scanningRotationLines`) with randomized order and random start.
  - pre-scan message text is sourced from `documentReviewRightPanel.readyToScanText`.

### Test/update expectations for changes

- Any behavioral change must include or update:
  - frontend tests (`frontend/src/App.test.jsx` and relevant feature tests), and/or
  - backend tests (`backend/tests/test_upload.py`) when endpoint behavior changes.
- After touching `theme.css` or status logic, verify:
  - lints are clean.
  - core frontend tests pass.
  - contract assumptions remain aligned with `contracts/medical_record.schema.json`.

## How to Update Docs Each Milestone

Use this checklist at the end of every milestone implementation:

- Update `DOCUMENTATION.md`:
  - Add/update TL;DR milestone snapshot.
  - Add new milestone section with standard headings:
    - Goal
    - Scope
    - Delivered/Implementation
    - Testing and CI
    - Next step
  - Add/update milestone screenshots under `docs/images/` and reference them.
- Update `AGENT.md`:
  - Refresh repository structure if files/folders changed.
  - Update milestone decision sections with current architecture choices.
  - Mark pending items as implemented when completed.
  - Keep local run/test commands current.
- Update `README.md` only when run/configuration instructions changed.
- Ensure docs and code match:
  - API endpoints and payload fields.
  - FE env vars and scripts.
  - CI jobs and dependencies.
- Final quality check:
  - Verify markdown links and image paths render on GitHub.
  - Keep wording concise and avoid duplicate/contradictory sections.
