# HappyVet Pulse Documentation

## TL;DR

HappyVet Pulse is a Human-in-the-Loop veterinary IDP prototype:

1. Upload fragmented medical documents
2. Extract and structure clinically useful data
3. Review and correct extracted fields in the UI

### Iteration snapshots

#### Milestone 1 - Shell foundation
- Backend/frontend scaffold, Docker/Compose, test baseline, CI baseline.

#### Milestone 2 - Upload + preview + API wiring
- Upload UI, document preview, metadata endpoint integration, layered tests.

![Milestone 2 Upload UI](docs/images/milestone2.png)

#### Milestone 3 - Structured record baseline (in progress)
- Backend medical-record schema + frontend read-only structured render.
- Mock scan endpoint + Scan button to validate end-to-end model rendering.
- CORS enabled for local FE dev origin.
- Shared JSON Schema contract validation on both backend and frontend tests.

---

## Standard Plan and Implementation Notes

## Milestone 1

### Goal
Establish a runnable baseline for parallel backend/frontend development.

### Scope
- FastAPI app shell with `GET /health`.
- React + Vite app shell.
- Dockerfiles + `docker-compose.yml`.
- Initial backend/frontend tests.
- GitHub Actions for automated checks.

### Delivered
- Working local stack and CI baseline.
- Basic quality gates to support next milestones safely.

### Testing and CI
- Backend test coverage for health baseline.
- Frontend test coverage for shell rendering baseline.
- CI workflow running backend + frontend tests on `push` and `pull_request`.

### Next step
- Build first vertical slice for document upload and metadata wiring.

## Milestone 2

### Goal
Deliver first end-to-end upload vertical slice with robust UX and validation signals.

### Scope
- Build upload UI with React-Bootstrap and Bootstrap Icons.
- Add backend upload endpoint returning lightweight metadata.
- Wire FE upload action to backend response rendering.
- Improve reliability through error handling, logging, and tests.

### Delivered / Implementation
- Backend:
  - Endpoint: `POST /api/v1/documents/upload`
  - Input: multipart file (`file`)
  - Output:
    - `filename`
    - `content_type`
    - `size_bytes`
    - `text_preview`
  - Architecture improvements:
    - modular routes (`health`, `documents`)
    - centralized errors (`AppError` + global handlers)
    - standardized error payload: `{"error":{"code":"...","message":"..."}}`
    - centralized logging utility used in upload flow
- Frontend:
  - Component architecture:
    - `UploadPanel`
    - `RecentDocumentsPanel`
    - `DocumentPreview`
    - `UploadResultCard`
    - `App` as orchestration layer
  - Upload/preview behavior:
    - click-to-select + drag/drop
    - supported preview: image, PDF, TXT
    - DOCX explicit fallback
    - unsupported file fallback
  - API wiring:
    - `uploadDocument` hook
    - metadata card from API response
    - upload loading/error states
  - UI consistency:
    - centralized strings (`uiContent.json`)
    - centralized theme/tokens (`uiTheme.js`)
    - runtime UI content validation
  - Environment:
    - `BACKEND_API_BASE_URL` for frontend API target

### Testing and CI
- Backend:
  - health
  - upload success
  - empty file error
  - missing file validation
- Frontend:
  - integration tests for upload + metadata/error rendering
  - utility tests for preview classification
- E2E (Playwright smoke):
  - successful TXT upload metadata visibility
  - API failure upload error visibility
- CI pipeline:
  - backend tests
  - frontend unit/integration tests
  - frontend E2E smoke tests (depends on FE tests)

### Next step
- Introduce structured medical record model and read-only render baseline.

## Milestone 3

### Goal
Prepare the medical record structured model and validate model rendering in the current UI.

### Scope
- Define canonical medical record draft schema on backend.
- Mirror schema shape in frontend state.
- Render read-only structured medical record panel.
- Add mocked scan round-trip (backend -> frontend display).
- Add contract guards to prevent FE/BE model drift.
- Keep persistence/edit-save out of scope.

### Delivered / Implementation
- Backend:
  - Canonical schema at `backend/app/schemas/medical_record.py`
  - Mock scan endpoint at `POST /api/v1/documents/scan`
  - CORS enabled for local FE dev origins (`localhost:5173`, `127.0.0.1:5173`)
- Frontend:
  - Read-only panel component: `frontend/src/components/MedicalRecordPanel.jsx`
  - State bootstrapping:
    - `frontend/src/data/medicalRecordEmptyState.js`
    - `frontend/src/data/medicalRecordMockData.js`
    - `frontend/src/data/medicalRecordState.js`
  - Production-safety rule: mock medical data never shown in production builds.
  - `Scan` button in upload panel triggers backend scan and updates medical record panel.
- Shared contract:
  - JSON Schema contract at `contracts/medical_record.schema.json`
  - Backend validates `/scan` payload against shared schema in tests.
  - Frontend validates empty/mock states against same schema with Ajv.

### Testing and CI
- Backend tests cover:
  - scan success payload shape
  - scan response Pydantic validity
  - scan response JSON Schema contract validity
  - CORS preflight behavior for frontend dev origin
- Frontend tests cover:
  - successful scan updates rendered record data
  - scan error rendering
  - shared JSON Schema contract checks for empty/mock states
- Existing CI test jobs run these checks automatically.

### Next step
- Move from read-only state to per-field editable review workflow while preserving schema parity and traceability metadata.

## Milestone 4

### Goal
Implement intelligent document ingestion with a swappable parsing architecture and a real scan ingestion path, then pivot to a performance-first "Gatekeeper" strategy for lower latency and leaner runtime.

### Scope
- Introduce `DocumentProcessor` abstraction and default processor implementation.
- Update `POST /api/v1/documents/scan` to ingest multipart files (`PDF`, `image`, `DOCX`, `TXT`).
- Convert files into structured text and map into `MedicalRecordDraft`.
- Add parsing integrity metadata in response.
- Pivot from heavy ML OCR stack to a lean Gatekeeper routing system with fast-path parsing and Tesseract fallback.

### Delivered / Implementation
- Backend architecture:
  - `backend/app/document_processing/base.py` (processor interface)
  - `backend/app/document_processing/gatekeeper_processor.py` (routing/orchestration)
  - `backend/app/document_processing/extractors.py` (format-specific extraction functions)
  - `backend/app/document_processing/quality_gate.py` (extraction sufficiency heuristic)
  - `backend/app/document_processing/factory.py` (swappable engine selection)
  - `backend/app/document_processing/medical_record_mapper.py` (markdown -> schema mapping)
  - `backend/app/document_processing/models.py` (`DocumentProcessingResult`, `ParsingMetadata`)
- Gatekeeper routing (performance pivot):
  - `.txt` -> native decode path (fast)
  - `.docx` -> `python-docx` extraction (fast)
  - `.pdf` -> `PyMuPDF` text-layer extraction first (fast path), then `pdf2image` + `pytesseract` fallback when insufficient
  - image formats (`.jpg`, `.jpeg`, `.png`, `.webp`) -> `pytesseract`
- Decision-maker heuristic (`is_extraction_sufficient`) uses a score-based gate:
  - hard minimum: reject when extracted text length `< 150`
  - expected text estimate: `page_count * estimated_chars_per_page`
  - structural penalties: subtract penalties for detected images and tables
  - accept when extraction coverage ratio meets threshold (estimated available text vs extracted text)
  - rejected PDF fast-path extractions trigger `tesseract_fallback`
- API integration:
  - `/scan` now accepts `UploadFile`
  - parsing output is mapped into:
    - `MedicalRecordDraft.source_documents[0].raw_text`
  - backend applies lightweight pre-structuring heuristics to prefill core patient fields when recognizable (name, species, breed, sex, chip, weight)
  - response includes top-level `parsing_metadata`
- Parsing metadata fields:
  - `engine`
  - `extraction_method` (`fast_path` | `tesseract_fallback`)
  - `latency_ms`
  - `extracted_char_count`
  - `meaningful_text`
  - `integrity_score`
  - `reason` (optional)
- Error policy:
  - low-integrity extraction returns `422` with `PARSING_INTEGRITY_LOW`
- Dependency/runtime pivot:
  - removed Docling, PyTorch, and EasyOCR dependency chains
  - added `PyMuPDF`, `python-docx`, `pdf2image`, `pytesseract`
  - kept `python:3.11-slim` base image
  - backend Dockerfile uses multi-stage build and installs OCR/PDF system packages:
    - `tesseract-ocr`
    - `libtesseract-dev`
    - `poppler-utils`
    - `libgl1`, `libglib2.0-0`

### Testing and CI
- Backend tests (`backend/tests/test_upload.py`) cover:
  - multipart `/scan` flow
  - mapped markdown in schema payload
  - top-level parsing metadata
  - low-quality parse error path
  - CORS preflight
- Frontend tests (`frontend/src/App.test.jsx`) cover:
  - scan requires selected file
  - multipart scan request (`FormData` with `file`)
  - scan success rendering
  - scan parsing error rendering
  - structured panel raw text section (collapsible) rendering
- Contract tests:
  - shared schema at `contracts/medical_record.schema.json`
  - backend and frontend validate compatibility including `extraction_method` and `latency_ms` in `parsing_metadata`
- E2E coverage:
  - existing mocked smoke tests remain at `frontend/tests/e2e/upload-smoke.spec.js`
  - real scan E2E tests added at `frontend/tests/e2e/scan-real.spec.js` (no API route mocking)
  - real E2E uses fixture files from `frontend/tests/e2e/fixtures/`
  - supported fixture extensions: `.txt`, `.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.webp`
  - fail-fast backend availability pre-check:
    - script: `frontend/scripts/check-backend-health.mjs`
    - command: `npm run test:e2e:real`
    - behavior: exits with clear error message if `http://127.0.0.1:8000/health` is unavailable

### Next step
- Expand deterministic mapping beyond patient basics (timeline, reminders, problem list) while keeping raw extracted text visible as the reliable fallback for human review.
