# HappyVet Pulse Documentation

## Milestone 1 Definition

Milestone 1 establishes the technical foundation of the project with a lean, runnable baseline for both backend and frontend.

### Scope Completed

- Set up backend project skeleton with FastAPI entrypoint.
- Set up frontend project skeleton with React + Vite entrypoint.
- Added minimal backend API shell with `GET /health`.
- Added minimal frontend app shell displaying `HappyVet Pulse`.
- Added Dockerfiles for backend and frontend services.
- Added `docker-compose.yml` for local multi-service orchestration.
- Added test infrastructure:
  - Backend: `pytest` with health endpoint test.
  - Frontend: `vitest` + React Testing Library with UI text test.
- Added CI workflow (GitHub Actions) to run backend and frontend tests on push and pull request.

### Milestone 1 Objective

Provide a stable baseline that is easy to run locally, easy to validate automatically, and ready for parallel backend/frontend feature development in upcoming milestones.

## Milestone 2 Definition

Milestone 2 introduces the first functional upload flow, with a simple UI and API handshake, plus stronger operational quality through testing, logging, and error handling.

### Scope Target

- Build a simple frontend upload interface using **React-Bootstrap**.
- Use icons via **FontAwesome** or **Bootstrap Icons**.
- Add visual theming with the following palette:
  - Main light background: `#ffefeb`
  - Primary buttons/details: `#fd4d0d`
  - Secondary accents: `#fae0ff`
  - Info/highlight accents: `#3898ff`
- Implement a backend upload endpoint that:
  - receives a file
  - returns simple metadata (initially file size)
- Keep the end-to-end interaction intentionally minimal and reliable.

### API Goal (MVP)

- Add a basic endpoint for file upload (multipart form-data).
- Validate request and return a simple JSON response including file size.
- Return meaningful HTTP status codes for invalid uploads.

### Quality Requirements

- Expand tests for both backend and frontend:
  - Backend: upload endpoint success and basic validation/error path.
  - Frontend: upload UI rendering and basic interaction flow.
- Improve logging:
  - structured, readable logs for upload attempts and outcomes.
  - clear log levels for info vs error cases.
- Improve error handling:
  - predictable API error responses.
  - user-friendly UI error messages for failed upload attempts.

### Milestone 2 Objective

Deliver the first usable upload vertical slice with a styled UI and a simple backend processing response, while improving reliability through test coverage and clearer runtime diagnostics.

### Milestone 2 - UI Progress (Implemented)

#### Components

- `UploadPanel`: drag-and-drop and click-to-select area for single file selection.
- `RecentDocumentsPanel`: left panel with "Last uploaded documents" and uploaded filename list.
- `DocumentPreview`: conditional preview renderer shown after file selection/upload.
- `App`: composition container with 2/8 layout and shared state orchestration.

#### UI Functionality

- Upload area supports:
  - clicking inside the dropzone
  - selecting a file from the file picker
  - dropping a file into the dropzone
- Layout is split into:
  - left `2/10` panel for recent files
  - right `8/10` area for upload + preview
- Title updated to: `Upload medical record documents`
- Styling uses React-Bootstrap + Bootstrap Icons with configured palette:
  - `#ffefeb`, `#fd4d0d`, `#fae0ff`, `#3898ff`
- Document preview supports:
  - images: inline image preview
  - PDF: iframe preview
  - TXT: text content preview
  - DOCX: explicit fallback card (not supported yet)
  - unsupported formats: error fallback card

#### Testing (Frontend)

- Added/expanded tests with Vitest + React Testing Library:
  - renders main upload title and empty state
  - file selection updates selected state and recent list
  - unsupported file type fallback renders correctly
  - DOCX fallback renders correctly
- Added utility tests for preview-type classification logic.

#### Cleanups / Refactors Completed

- Centralized UI strings in `frontend/src/data/uiContent.json` (single source of truth).
- Centralized shared styles and theme tokens in `frontend/src/styles/uiTheme.js`.
- Extracted file preview type detection to `frontend/src/utils/filePreview.js`.
- Added preview-type constants in `frontend/src/constants/previewTypes.js`.
- Decomposed `DocumentPreview` into focused renderer subcomponents.
- Moved preview dimensions/padding into theme tokens.
- Added runtime validation for UI content contract in `frontend/src/utils/validateUiContent.js`.
